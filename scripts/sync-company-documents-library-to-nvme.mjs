#!/usr/bin/env node
/**
 * Sincroniza a Document Library (company_documents + company_folders) para o NVMe,
 * espelhando a árvore da BD sob DEST_NVME_ROOT/<pasta disco>/…
 * (ex.: Z:\\nvme\\Splendidoption (PT)\\Work\\…)
 *
 * Por omissão (sem --company-id nem SYNC_COMPANY_ID): Splendidoption Lda → Splendidoption (PT)
 *
 *   export SUPABASE_URL="https://zyziolikudoczsthyoja.supabase.co"
 *   export SUPABASE_SERVICE_ROLE_KEY="..."
 *   export DEST_NVME_ROOT="/data/nvme"
 *   # Leitura em disco: tenta …/Work/AAAA/MM Mês AAAA/, …/Work/MM Mês AAAA/, e
 *   # nomes sem sufixo duplicado (_1, _2 antes da extensão) quando o ficheiro na BD
 *   # difere do PDF no NVMe. Se a pasta na BD for AAAA/MM errados mas o nome tiver
 *   # (dd-mm-yyyy) e valor em €, procura também em Work/ano/mês dessa data e na
 *   # raiz da pasta empresa (PDFs fora de Work/).
 *   # Outra empresa:
 *   # export SYNC_COMPANY_ID="<uuid da tabela companies>"
 *   # Pasta no NVMe (opcional; por omissão = nome na BD companies.name):
 *   # export SYNC_DISK_FOLDER="Epicatmosphere Lda"
 *   # Opcional: ficheiro .env.work25 nesta pasta (gitignored) com SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY
 *
 *   node scripts/sync-company-documents-library-to-nvme.mjs --dry-run
 *   node scripts/sync-company-documents-library-to-nvme.mjs --company-id=<uuid> --dry-run
 *   npm run list-work-companies
 *   node scripts/sync-company-documents-library-to-nvme.mjs --list-companies
 *   node scripts/sync-company-documents-library-to-nvme.mjs --probe-registo
 *       (cria/testa o .runs.log sem Supabase; útil antes do cp)
 *
 * Opções:
 *   --list-companies   Lista id + name em companies (Work25) e sai (não grava registo)
 *   --probe-registo    Escreve uma linha de teste no ficheiro de registo e mostra o caminho absoluto
 *   --company-id=uuid  Empresa a sincronizar (ou env SYNC_COMPANY_ID)
 *   --dry-run
 *   --work-only     Só pastas cujo caminho começa por "Work /" (ex.: só Work\\2025\\…)
 *   --verbose       Em falhas, mostra motivo (Storage, path não parseado, disco em falta)
 *   --doc-ids=uuid,uuid,...   Só estes ids de company_documents (útil para repetir os que falharam)
 *
 * Registo de execuções (append JSON por linha):
 *   Por omissão: scripts/sync-company-documents-nvme.runs.log (ao lado deste ficheiro)
 *   SYNC_NVME_LOG_PATH=/caminho/ficheiro.log  — outro destino
 *   SYNC_NVME_LOG=0  — não escrever registo (no fim aparece uma linha a explicar)
 */

import { createClient } from "@supabase/supabase-js";
import fs from "fs/promises";
import os from "node:os";
import path from "path";
import { fileURLToPath } from "node:url";
import { inspect } from "node:util";
import {
  loadWork25EnvFile,
  assertServiceRoleJwt,
  printInvalidApiKeyDiagnostics,
} from "./load-work25-env.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
/** Ficheiro de registo por omissão (append; uma linha JSON por execução). */
const DEFAULT_SYNC_RUN_LOG = path.join(__dirname, "sync-company-documents-nvme.runs.log");

/**
 * @param {Record<string, unknown>} entry
 */
async function appendSyncRunLog(entry) {
  const raw = process.env.SYNC_NVME_LOG?.trim()?.toLowerCase();
  if (raw === "0" || raw === "false" || raw === "no") {
    console.error(
      "sync-nvme: registo de corridas desligado (SYNC_NVME_LOG). Não se cria sync-company-documents-nvme.runs.log — remova ou comente no .env.work25."
    );
    return;
  }

  const logPath = process.env.SYNC_NVME_LOG_PATH?.trim() || DEFAULT_SYNC_RUN_LOG;
  const absLog = path.resolve(logPath);
  let line;
  try {
    line = `${JSON.stringify(entry)}\n`;
  } catch (e) {
    console.error(`[aviso] Registo JSON falhou: ${e?.message || e}`);
    return;
  }
  try {
    await fs.appendFile(absLog, line, "utf8");
    console.error(`Registo: ${absLog}`);
  } catch (e) {
    console.error(`[aviso] Não foi possível escrever registo em ${absLog}: ${e?.message || e}`);
  }
}

/** Cria ou acrescenta uma linha de teste no mesmo ficheiro que as corridas (sem credenciais Supabase). */
async function probeSyncRunLogFile() {
  const logPath = process.env.SYNC_NVME_LOG_PATH?.trim() || DEFAULT_SYNC_RUN_LOG;
  const absLog = path.resolve(logPath);
  const line = `${JSON.stringify({
    probe: true,
    ts: new Date().toISOString(),
    host: os.hostname(),
    cwd: process.cwd(),
    log_path: absLog,
  })}\n`;
  try {
    await fs.appendFile(absLog, line, "utf8");
    console.error(`OK — registo acessível (podes copiar este ficheiro):\n${absLog}`);
  } catch (e) {
    console.error(`FALHA ao escrever registo: ${e?.message || e}`);
    process.exit(1);
  }
}

/** Omissão histórica: Splendidoption */
const DEFAULT_COMPANY_ID = "0bddb3b3-cd90-420a-b37d-be467c0c0687";
const DEFAULT_DISK_FOLDER = "Splendidoption (PT)";
const DEFAULT_DB_PATH_PREFIX = "Splendidoption Lda";

const WORKFLOW_BUCKETS = new Set(["company-documents", "attachments"]);

function parseArgs(argv) {
  let dryRun = false;
  let workOnly = false;
  let verbose = false;
  let listCompanies = false;
  let probeRegisto = false;
  /** @type {string|null} */
  let companyIdArg = null;
  /** @type {Set<string>|null} */
  let docIds = null;
  for (const a of argv) {
    if (a === "--dry-run") dryRun = true;
    if (a === "--work-only") workOnly = true;
    if (a === "--verbose") verbose = true;
    if (a === "--list-companies") listCompanies = true;
    if (a === "--probe-registo") probeRegisto = true;
    if (a.startsWith("--company-id=")) {
      companyIdArg = a.slice("--company-id=".length).trim() || null;
    }
    if (a.startsWith("--doc-ids=")) {
      const raw = a.slice("--doc-ids=".length).trim();
      docIds = new Set(
        raw
          .split(/[\s,]+/)
          .map((s) => s.trim())
          .filter(Boolean)
      );
    }
  }
  return { dryRun, workOnly, verbose, docIds, listCompanies, companyIdArg, probeRegisto };
}

function parseSupabaseStorageLooseRef(input) {
  if (!input || typeof input !== "string") return null;
  const s = input.trim();
  if (!s) return null;

  if (/^https?:\/\//i.test(s)) {
    try {
      const url = new URL(s);
      const splitPath = (prefix) => {
        const pathParts = url.pathname.split(prefix);
        if (pathParts.length < 2) return null;
        const [bucket, ...rest] = pathParts[1].split("/");
        if (!bucket || rest.length === 0) return null;
        return { bucket, filePath: decodeURIComponent(rest.join("/")) };
      };
      return splitPath("/storage/v1/object/public/") ?? splitPath("/storage/v1/object/sign/");
    } catch {
      return null;
    }
  }

  const noLead = s.replace(/^\/+/, "");
  for (const bucket of WORKFLOW_BUCKETS) {
    const prefix = `${bucket}/`;
    if (noLead.startsWith(prefix)) {
      return { bucket, filePath: noLead.slice(prefix.length) };
    }
  }

  const lastSeg = noLead.includes("/") ? noLead.slice(noLead.lastIndexOf("/") + 1) : noLead;
  if (
    noLead.startsWith("payment-attachments/") ||
    noLead.startsWith("workflow/") ||
    noLead.startsWith("documentos/") ||
    /^merged-/.test(lastSeg) ||
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\//i.test(noLead)
  ) {
    return { bucket: "company-documents", filePath: noLead };
  }

  return null;
}

function safeFileName(name) {
  const base = String(name || "file").replace(/[/\\]/g, "_").replace(/\0/g, "");
  return base.slice(0, 240) || "file";
}

/**
 * Normaliza colagens com travessões Unicode (U+2014), BOM, aspas “curvas”, etc.
 * que causam: ByteString … character 8212 nos headers do fetch/undici.
 */
function sanitizeJwtFromEnv(raw) {
  let s = String(raw ?? "").trim();
  s = s.normalize("NFKC");
  s = s.replace(/\uFEFF/g, "");
  s = s.replace(/[\u200B-\u200D\u2060]/g, "");
  s = s.replace(/^[\s"'`\u201C\u201D\u2018\u2019]+|[\s"'`\u201C\u201D\u2018\u2019]+$/g, "");
  s = s.replace(/[\u2010-\u2015\u2212\uFE58\uFE63\uFF0D]/g, "-");
  return s.trim();
}

function readSupabaseUrl() {
  const url = sanitizeJwtFromEnv(process.env.SUPABASE_URL);
  if (!url) return "";
  for (let i = 0; i < url.length; i++) {
    const c = url.charCodeAt(i);
    if (c > 127) {
      console.error(
        `SUPABASE_URL tem carácter não ASCII na posição ${i} (U+${c.toString(16)}). Cola o URL exactamente do dashboard.`
      );
      process.exit(1);
    }
  }
  return url;
}

/**
 * JWT service_role: só caracteres permitidos em headers HTTP.
 */
function readServiceRoleKey() {
  let key = sanitizeJwtFromEnv(process.env.SUPABASE_SERVICE_ROLE_KEY);
  if (!key) return "";
  key = key.replace(/\s/g, "");
  for (let i = 0; i < key.length; i++) {
    const c = key.charCodeAt(i);
    if (c > 127) {
      console.error(
        `SUPABASE_SERVICE_ROLE_KEY: ainda há carácter inválido na posição ${i} (U+${c.toString(16).toUpperCase()}).`
      );
      console.error(
        "Cola de novo o secret service_role a partir do Supabase (sem texto extra, sem reticências … ou ....)."
      );
      process.exit(1);
    }
  }
  if (!key.includes(".")) {
    console.error(
      'SUPABASE_SERVICE_ROLE_KEY não parece um JWT (três partes com ".").'
    );
    process.exit(1);
  }
  return key;
}

/** Constrói mapa folder_id -> caminho lógico "A / B / C" a partir da lista plana. */
function buildFolderPaths(rows) {
  const byId = new Map(rows.map((r) => [r.id, r]));
  const memo = new Map();

  function pathFor(id) {
    if (!id) return "";
    if (memo.has(id)) return memo.get(id);
    const row = byId.get(id);
    if (!row) {
      memo.set(id, "");
      return "";
    }
    if (!row.parent_folder_id) {
      const p = row.name;
      memo.set(id, p);
      return p;
    }
    const parent = pathFor(row.parent_folder_id);
    const p = parent ? `${parent} / ${row.name}` : row.name;
    memo.set(id, p);
    return p;
  }

  const out = new Map();
  for (const r of rows) {
    out.set(r.id, pathFor(r.id));
  }
  return out;
}

function mapDbPathToDisk(rel, dbPathPrefix, diskFolder) {
  if (!rel || !dbPathPrefix || !diskFolder) return null;
  if (rel.startsWith(`${dbPathPrefix}/`)) {
    return rel.replace(
      new RegExp(`^${dbPathPrefix.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}/`),
      `${diskFolder}/`
    );
  }
  return null;
}

/** Nomes de mês para pastas no NVMe (ex.: `12 Dezembro 2025`). */
const PT_MONTH_NAMES = [
  "Janeiro",
  "Fevereiro",
  "Março",
  "Abril",
  "Maio",
  "Junho",
  "Julho",
  "Agosto",
  "Setembro",
  "Outubro",
  "Novembro",
  "Dezembro",
];

/** Pastas criadas em inglês (ex. UK): `04 April 2026`, `12 December 2025`. */
const EN_MONTH_NAMES = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

/**
 * A BD / API usam `…/Work/AAAA/MM/nome.pdf`; no NVMe os PDFs costumam estar em
 * `…/Work/AAAA/MM Mês AAAA/nome.pdf` ou `…/Work/MM Mês AAAA/nome.pdf`.
 * Também se tenta **inglês** (`MM Month YYYY`) para empresas/pastas UK.
 * Devolve lista de caminhos relativos a testar (primeiro o original).
 */
function nvmeWorkPathVariants(rel) {
  const out = [];
  const seen = new Set();
  function add(s) {
    if (s && !seen.has(s)) {
      seen.add(s);
      out.push(s);
    }
  }
  add(rel);

  const re = /^(.*\/Work\/)(\d{4})\/(\d{2})\/(.*)$/s;
  const m = rel.match(re);
  if (!m) return out;
  const [, prefix, yearStr, mmStr, rest] = m;
  const mo = parseInt(mmStr, 10);
  if (mo < 1 || mo > 12) return out;
  const monthPt = PT_MONTH_NAMES[mo - 1];
  const monthEn = EN_MONTH_NAMES[mo - 1];
  const segments = [
    `${mmStr} ${monthPt} ${yearStr}`,
    `${mmStr}. ${monthPt} ${yearStr}`,
    `${mmStr} ${monthEn} ${yearStr}`,
    `${mmStr}. ${monthEn} ${yearStr}`,
  ];
  for (const folderSegment of segments) {
    add(`${prefix}${yearStr}/${folderSegment}/${rest}`);
    add(`${prefix}${folderSegment}/${rest}`);
  }
  return out;
}

/**
 * A BD pode guardar `nome_2.pdf` (duplicado); no disco o ficheiro é `nome.pdf`.
 * Gera variantes removendo sufixos `_\d+` antes da extensão.
 */
function fileNameDupSuffixVariants(fileName) {
  const out = [];
  const seen = new Set();
  let cur = fileName;
  while (cur && !seen.has(cur)) {
    seen.add(cur);
    out.push(cur);
    const m = cur.match(/^(.*?)(_\d+)(\.[^./]+)$/);
    if (!m) break;
    cur = m[1] + m[3];
  }
  return out;
}

/** Combina variantes de pasta Work (NVMe) e de nome de ficheiro (sufixo _N). */
function nvmeWorkPathAndFileVariants(rel) {
  const folderPaths = nvmeWorkPathVariants(rel);
  const out = [];
  const seen = new Set();
  for (const fp of folderPaths) {
    const d = path.posix.dirname(fp);
    const base = path.posix.basename(fp);
    for (const b of fileNameDupSuffixVariants(base)) {
      const p = d === "." ? b : path.posix.join(d, b);
      if (!seen.has(p)) {
        seen.add(p);
        out.push(p);
      }
    }
  }
  return out;
}

/**
 * @returns {Promise<{ hit: { ok: true; buf: Buffer; source: string } | null; triedAbs: string[] }>}
 */
async function readFirstExistingUnderDest(destRoot, relPaths, verbose, label) {
  const triedAbs = [];
  for (const rel of relPaths) {
    const abs = path.join(destRoot, rel);
    triedAbs.push(abs);
    try {
      const buf = await fs.readFile(abs);
      return { hit: { ok: true, buf, source: `disk:${abs}` }, triedAbs };
    } catch {
      if (verbose) console.error(`[verbose] disco (${label}): não existe ${abs}`);
    }
  }
  return { hit: null, triedAbs };
}

/** Pastas candidatas (dirname de cada variante de caminho). */
function uniqueParentDirsFromMappedRel(mappedRel) {
  const s = new Set();
  for (const p of nvmeWorkPathAndFileVariants(mappedRel)) {
    const d = path.posix.dirname(p);
    if (d && d !== ".") s.add(d);
  }
  return [...s];
}

/**
 * Quando o registo na BD aponta para Work/AAAA/MM errados (ex. pasta movida para
 * "Janeiro 2026" na app) mas o nome do ficheiro tem `(27-03-2024)`, o PDF está
 * tipicamente em Work/2024/03 Março 2024/. Gera pastas-mês a partir dessa data.
 * @param {string} mappedRel caminho já mapeado para o disco (inclui …/Work/…)
 * @param {string} baseName nome do ficheiro com `(dd-mm-yyyy)`
 * @returns {string[]} caminhos relativos (posix) de pastas candidatas extra
 */
function extraMonthDirsFromParensDate(mappedRel, baseName) {
  const dm = extractParensDateMarker(baseName);
  if (!dm) return [];
  const inner = dm.slice(1, -1);
  const parts = inner.split("-");
  if (parts.length !== 3) return [];
  const dd = parseInt(parts[0], 10);
  const mm = parseInt(parts[1], 10);
  const yyyy = parseInt(parts[2], 10);
  if (
    Number.isNaN(yyyy) ||
    Number.isNaN(mm) ||
    Number.isNaN(dd) ||
    mm < 1 ||
    mm > 12 ||
    dd < 1 ||
    dd > 31
  ) {
    return [];
  }
  const prefixMatch = mappedRel.match(/^(.*)\/Work\//);
  if (!prefixMatch) return [];
  const prefixBeforeWork = prefixMatch[1];
  const mmStr = String(mm).padStart(2, "0");
  const syntheticRel = `${prefixBeforeWork}/Work/${yyyy}/${mmStr}/${baseName}`;
  return uniqueParentDirsFromMappedRel(syntheticRel);
}

/** União de pastas do caminho mapeado + pastas derivadas da data no nome + raiz empresa. */
function allLooseSearchDirs(mappedRel) {
  const base = path.posix.basename(mappedRel);
  const a = uniqueParentDirsFromMappedRel(mappedRel);
  const b = extraMonthDirsFromParensDate(mappedRel, base);
  const prefixMatch = mappedRel.match(/^(.*)\/Work\//);
  /** PDFs por vezes estão na raiz da pasta disco, sem `Work/`. */
  const rootCompany = prefixMatch ? [prefixMatch[1]] : [];
  const s = new Set([...a, ...b, ...rootCompany]);
  return [...s];
}

/** Ex.: `(20-12-2025)` */
function extractParensDateMarker(baseName) {
  const m = String(baseName).match(/\(\d{2}-\d{2}-\d{4}\)/);
  return m ? m[0] : null;
}

/** Valores monetários em € como número (PT: 1.234,56; 10,17; 1180€; 9.44€; 27 650€). */
function parseEuroAmountsFromName(name) {
  const s = String(name)
    .replace(/\u00a0/g, " ")
    .replace(/\u202f/g, " ")
    .replace(/\s+/g, " ");
  const nums = [];
  const pushN = (n) => {
    if (!Number.isNaN(n)) nums.push(n);
  };
  for (const m of s.matchAll(/(\d{1,3}(?:\.\d{3})*,\d{2})\s*€/g)) {
    const t = m[1];
    pushN(parseFloat(t.replace(/\./g, "").replace(",", ".")));
  }
  /** Milhares com espaço antes de € (evita confundir com o último grupo de dígitos). */
  for (const m of s.matchAll(/(\d{1,3}(?:\s+\d{3})+(?:,\d{2})?)\s*€/g)) {
    const compact = m[1].replace(/\s+/g, "");
    if (compact.includes(",")) {
      pushN(parseFloat(compact.replace(/\./g, "").replace(",", ".")));
    } else {
      pushN(parseFloat(compact));
    }
  }
  for (const m of s.matchAll(/(\d+[.,]\d{2})\s*€/g)) {
    const t = m[1];
    if (/^\d{1,3}(\.\d{3})*,\d{2}$/.test(t)) continue;
    if (t.includes(",")) pushN(parseFloat(t.replace(/\./g, "").replace(",", ".")));
    else pushN(parseFloat(t));
  }
  /** Só inteiros 2–6 dígitos colados a € (não captura o último grupo de "27 650 €"). */
  for (const m of s.matchAll(/(?:^|[\s(])(\d{2,6})\s*€/g)) {
    const before = m.index ?? 0;
    const prev = before > 0 ? s[before - 1] : "";
    if (/\d/.test(prev)) continue;
    pushN(parseFloat(m[1]));
  }
  return nums;
}

function euroAmountsOverlap(baseName, candidateName) {
  const a = parseEuroAmountsFromName(baseName);
  const b = parseEuroAmountsFromName(candidateName);
  if (a.length === 0 || b.length === 0) return false;
  const eps = 0.009;
  for (const x of a) {
    for (const y of b) {
      if (Math.abs(x - y) < eps) return true;
    }
  }
  return false;
}

/**
 * Quando o nome na BD não coincide com o PDF no NVMe (ex.: "Edp Comercial" vs
 * "EDP Comercial - Comercialização de Energia S.A."), procura na mesma pasta-mês
 * um PDF com a mesma data `(dd-mm-aaaa)` e o mesmo valor em €.
 */
async function tryLoosePdfInNvmeDirs(destRoot, mappedRel, verbose, label) {
  const base = path.posix.basename(mappedRel);
  const dateMarker = extractParensDateMarker(base);
  if (!dateMarker) return null;
  if (parseEuroAmountsFromName(base).length === 0) return null;

  const dirs = allLooseSearchDirs(mappedRel);
  for (const dirRel of dirs) {
    const absDir = path.join(destRoot, dirRel);
    let names;
    try {
      names = await fs.readdir(absDir);
    } catch {
      continue;
    }
    for (const name of names) {
      if (!name.toLowerCase().endsWith(".pdf")) continue;
      if (!name.includes(dateMarker)) continue;
      if (!euroAmountsOverlap(base, name)) continue;
      const abs = path.join(absDir, name);
      try {
        const buf = await fs.readFile(abs);
        if (verbose) {
          console.error(`[verbose] disco (${label}): match por data+valor → ${abs}`);
        }
        return { ok: true, buf, source: `disk:${abs}` };
      } catch {
        /* */
      }
    }
  }
  return null;
}

function parseApiWorkFileParam(fileUrl) {
  const s = fileUrl?.trim() || "";
  if (!s.includes("/api/work-files/download")) return null;
  try {
    const u = s.startsWith("http") ? new URL(s) : new URL(s, "http://local");
    const f = u.searchParams.get("file");
    return f ? decodeURIComponent(f) : null;
  } catch {
    return null;
  }
}

function serializeStorageError(e) {
  if (e == null) return String(e);
  if (typeof e === "string") return e;
  if (typeof e !== "object") return String(e);
  try {
    const o = {
      message: e.message,
      statusCode: e.statusCode,
      status: e.status,
      error: e.error,
      name: e.name,
    };
    const s = JSON.stringify(o);
    if (s === "{}" || s === '{"message":""}') {
      const j = JSON.stringify(e, Object.getOwnPropertyNames(e));
      if (j !== "{}") return j;
    } else {
      return s;
    }
  } catch {
    /* fall through */
  }
  return inspect(e, { depth: 4, compact: true, breakLength: 100, maxStringLength: 500 });
}

async function downloadFromStorage(supabase, bucket, filePath) {
  const { data, error } = await supabase.storage.from(bucket).download(filePath);
  if (error) {
    const raw = error.message?.trim();
    const msg = raw ? raw : serializeStorageError(error);
    const err = new Error(`Storage: ${msg}`);
    err.cause = error;
    throw err;
  }
  if (!data) {
    throw new Error("Storage: resposta sem corpo (data vazio)");
  }
  return Buffer.from(await data.arrayBuffer());
}

function trunc(s, n = 120) {
  const t = String(s ?? "");
  return t.length <= n ? t : `${t.slice(0, n)}…`;
}

/**
 * @param {{ verbose?: boolean; dbPathPrefix: string; diskFolder: string }} ctx
 * @returns {Promise<{ ok: true; buf: Buffer; source: string } | { ok: false; reason: string }>}
 */
async function tryGetBytes(supabase, row, destRoot, ctx) {
  const { verbose = false, dbPathPrefix, diskFolder } = ctx;
  const fu = row.file_url?.trim();
  /** @type {string|null} */
  let storageErr = null;
  /** @type {string|null} */
  let unparsedUrl = null;
  /** Caminhos em disco tentados e não encontrados (para diagnóstico final). */
  /** @type {string[]} */
  const diskMiss = [];

  if (fu) {
    const parsed = parseSupabaseStorageLooseRef(fu);
    if (parsed) {
      try {
        const buf = await downloadFromStorage(supabase, parsed.bucket, parsed.filePath);
        return { ok: true, buf, source: `storage:${parsed.bucket}/${parsed.filePath}` };
      } catch (e) {
        storageErr = e?.message || serializeStorageError(e?.cause ?? e);
        if (verbose) {
          console.error(
            `[verbose] Storage download falhou bucket=${parsed.bucket} path=${trunc(parsed.filePath, 200)} → ${storageErr}`
          );
        }
      }
    } else if (!parseApiWorkFileParam(fu)) {
      unparsedUrl = fu;
      if (verbose) {
        console.error(`[verbose] file_url não reconhecido como Storage/API (primeiros 160 chars): ${trunc(fu, 160)}`);
      }
    }
  } else if (verbose) {
    console.error(`[verbose] file_url vazio para este registo`);
  }

  const apiPath = parseApiWorkFileParam(row.file_url);
  if (apiPath) {
    const mapped = mapDbPathToDisk(apiPath, dbPathPrefix, diskFolder);
    if (mapped) {
      const r = await readFirstExistingUnderDest(
        destRoot,
        nvmeWorkPathAndFileVariants(mapped),
        verbose,
        "api"
      );
      if (r.hit) return r.hit;
      const loose = await tryLoosePdfInNvmeDirs(destRoot, mapped, verbose, "api");
      if (loose) return loose;
      diskMiss.push(`api→${r.triedAbs.map((a) => trunc(a, 90)).join(" | ")}`);
    }
  }

  const ldaRoot = process.env.WORK_FILES_LDA_ROOT?.trim();
  const sp = row.server_path?.trim();
  if (ldaRoot && sp && sp.startsWith(`${dbPathPrefix}/`)) {
    const abs = path.join(ldaRoot, sp);
    try {
      const buf = await fs.readFile(abs);
      return { ok: true, buf, source: `disk:${abs}` };
    } catch {
      diskMiss.push(`lda→${abs}`);
      if (verbose) console.error(`[verbose] disco (WORK_FILES_LDA_ROOT): não existe ${abs}`);
    }
  }

  if (sp && sp.startsWith(`${dbPathPrefix}/`)) {
    const mapped = mapDbPathToDisk(sp, dbPathPrefix, diskFolder);
    if (mapped) {
      const r = await readFirstExistingUnderDest(
        destRoot,
        nvmeWorkPathAndFileVariants(mapped),
        verbose,
        "server_path"
      );
      if (r.hit) return r.hit;
      const loose = await tryLoosePdfInNvmeDirs(destRoot, mapped, verbose, "server_path");
      if (loose) return loose;
      diskMiss.push(`server_path→${r.triedAbs.map((a) => trunc(a, 90)).join(" | ")}`);
    }
  } else if (verbose && sp) {
    console.error(`[verbose] server_path não começa por "${dbPathPrefix}/": ${trunc(sp, 160)}`);
  }

  if (storageErr) {
    const low = String(storageErr).toLowerCase();
    let tag = "storage_erro";
    if (low.includes("not found") || low.includes("404") || low.includes("does not exist")) {
      tag = "storage_objecto_inexistente";
    }
    return { ok: false, reason: `${tag}: ${trunc(storageErr, 160)}` };
  }
  if (unparsedUrl) {
    return {
      ok: false,
      reason: `file_url_nao_reconhecido: ${trunc(unparsedUrl, 120)}`,
    };
  }
  if (!fu && !sp) {
    return { ok: false, reason: "sem_file_url_nem_server_path" };
  }
  if (!fu && sp && !sp.startsWith(`${dbPathPrefix}/`)) {
    return {
      ok: false,
      reason: `server_path_prefixo_errado(esperado_${dbPathPrefix}/): ${trunc(sp, 100)}`,
    };
  }
  if (diskMiss.length > 0) {
    return {
      ok: false,
      reason: `disco_nao_encontrado: ${diskMiss.map((x) => trunc(x, 100)).join(" | ")}`,
    };
  }
  if (!fu && sp && sp.startsWith(`${dbPathPrefix}/`)) {
    const mapped = mapDbPathToDisk(sp, dbPathPrefix, diskFolder);
    if (!mapped) {
      return {
        ok: false,
        reason: `server_path_nao_mapeavel_para_destino: ${trunc(sp, 120)}`,
      };
    }
  }
  return {
    ok: false,
    reason: `sem_fallback: fu=${fu ? "sim" : "nao"} sp=${sp ? "sim" : "nao"} (ver --verbose)`,
  };
}

/**
 * Resolve empresa: omissão Splendidoption (PT); com explicitId lê companies.name e pasta disco.
 * @param {string|null|undefined} explicitId  --company-id ou SYNC_COMPANY_ID
 */
async function resolveCompanyContext(supabase, explicitId, authCtx) {
  const id = explicitId?.trim();

  if (!id) {
    return {
      companyId: DEFAULT_COMPANY_ID,
      dbPathPrefix: DEFAULT_DB_PATH_PREFIX,
      diskFolder: DEFAULT_DISK_FOLDER,
    };
  }

  const { data: row, error } = await supabase.from("companies").select("id,name").eq("id", id).maybeSingle();

  if (error) {
    if (String(error.message || "").includes("Invalid API key") && authCtx) {
      printInvalidApiKeyDiagnostics(authCtx.url, authCtx.key, error);
    } else {
      console.error(error);
    }
    process.exit(1);
  }
  if (!row?.name) {
    console.error(`Empresa não encontrada para id=${id} (tabela companies).`);
    process.exit(1);
  }

  const diskFolder = process.env.SYNC_DISK_FOLDER?.trim() || row.name;

  return {
    companyId: row.id,
    dbPathPrefix: row.name,
    diskFolder,
  };
}

async function main() {
  const envFrom = loadWork25EnvFile();
  if (envFrom) {
    console.error(`Credenciais carregadas de: ${envFrom}`);
  }

  const argvSlice = process.argv.slice(2);
  const { dryRun, workOnly, verbose, docIds, listCompanies, companyIdArg, probeRegisto } =
    parseArgs(argvSlice);
  const explicitCompanyId = companyIdArg || process.env.SYNC_COMPANY_ID?.trim() || null;

  if (probeRegisto) {
    await probeSyncRunLogFile();
    return;
  }

  const url = readSupabaseUrl();
  const key = readServiceRoleKey();
  const destRoot = process.env.DEST_NVME_ROOT?.trim() || "/data/nvme";

  if (!url || !key) {
    console.error("Defina SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY (JWT real do dashboard, sem texto extra).");
    console.error("Ou cria .env.work25 nesta pasta (ver comentário no topo do script).");
    process.exit(1);
  }

  assertServiceRoleJwt(key);

  const supabase = createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  if (listCompanies) {
    const { data: rows, error } = await supabase.from("companies").select("id,name").order("name");
    if (error) {
      if (String(error.message || "").includes("Invalid API key")) {
        printInvalidApiKeyDiagnostics(url, key, error);
      } else {
        console.error(error);
      }
      process.exit(1);
    }
    for (const r of rows || []) {
      console.log(`${r.id}\t${r.name}`);
    }
    console.error(`Total: ${(rows || []).length} empresas. Use: --company-id=<uuid> [--dry-run]`);
    return;
  }

  const { companyId, dbPathPrefix, diskFolder } = await resolveCompanyContext(supabase, explicitCompanyId, {
    url,
    key,
  });

  console.error(
    `Sincronizar Document Library → ${path.join(destRoot, diskFolder)} (BD prefix: "${dbPathPrefix}", company_id=${companyId})`
  );

  const { data: folders, error: fe } = await supabase
    .from("company_folders")
    .select("id,name,parent_folder_id")
    .eq("company_id", companyId);

  if (fe) {
    if (String(fe.message || "").includes("Invalid API key")) {
      printInvalidApiKeyDiagnostics(url, key, fe);
    } else {
      console.error(fe);
    }
    process.exit(1);
  }

  const folderPaths = buildFolderPaths(folders || []);

  const { data: docs, error: de } = await supabase
    .from("company_documents")
    .select("id,name,file_url,server_path,folder_id")
    .eq("company_id", companyId);

  if (de) {
    if (String(de.message || "").includes("Invalid API key")) {
      printInvalidApiKeyDiagnostics(url, key, de);
    } else {
      console.error(de);
    }
    process.exit(1);
  }

  const base = path.join(destRoot, diskFolder);
  const tryCtx = { verbose, dbPathPrefix, diskFolder };
  let ok = 0;
  let skip = 0;
  let fail = 0;
  let considered = 0;
  /** @type {Map<string, number>} */
  const failByTag = new Map();

  for (const row of docs || []) {
    if (docIds && docIds.size > 0 && !docIds.has(row.id)) {
      continue;
    }

    const logical = row.folder_id ? folderPaths.get(row.folder_id) || "" : "";
    if (workOnly && !String(logical).trim().startsWith("Work")) {
      continue;
    }

    considered++;

    const relParts = logical.split(" / ").filter(Boolean);
    const destDir = path.join(base, ...relParts);
    let fname = safeFileName(row.name);
    const dest = path.join(destDir, fname);

    if (dryRun) {
      console.log(`[dry-run] ${logical || "(sem pasta)"} → ${dest}`);
      continue;
    }

    try {
      const st = await fs.stat(dest).catch(() => null);
      if (st?.isFile()) {
        console.error(`[skip exists] ${dest}`);
        skip++;
        continue;
      }

      const got = await tryGetBytes(supabase, row, destRoot, tryCtx);
      if (!got.ok) {
        const tag = (got.reason.split(":")[0] || "outro").trim();
        failByTag.set(tag, (failByTag.get(tag) || 0) + 1);
        console.error(`[fail] ${row.id} ${row.name}`);
        if (verbose) {
          console.error(`       → ${got.reason}`);
        }
        fail++;
        continue;
      }

      await fs.mkdir(destDir, { recursive: true });
      await fs.writeFile(dest, got.buf);
      console.error(`[ok] ${got.source} → ${dest}`);
      ok++;
    } catch (e) {
      console.error(`[fail] ${row.id}`, e.message || e);
      fail++;
    }
  }

  if (dryRun) {
    console.error(
      `Dry-run concluído (${considered} documentos considerados${workOnly ? ", só Work" : ""}).`
    );
  } else {
    console.error(`Feito: ${ok} escritos, ${skip} já existiam, ${fail} falharam.`);
    if (fail > 0 && failByTag.size > 0) {
      console.error("");
      console.error("--- Resumo de falhas (tag → contagem) ---");
      const sorted = [...failByTag.entries()].sort((a, b) => b[1] - a[1]);
      for (const [tag, count] of sorted) {
        console.error(`  ${count}× ${tag}`);
      }
      console.error(
        "Repetir com --verbose para ver o motivo completo por ficheiro. Causas típicas: objecto em falta no Storage, file_url aponta para outro PDF, ou caminho só no disco noutro servidor."
      );
    }
  }

  await appendSyncRunLog({
    ts: new Date().toISOString(),
    host: os.hostname(),
    cwd: process.cwd(),
    script: "sync-company-documents-library-to-nvme.mjs",
    company_id: companyId,
    db_path_prefix: dbPathPrefix,
    disk_folder: diskFolder,
    dest_root: destRoot,
    dry_run: dryRun,
    work_only: workOnly,
    doc_ids_filter: Boolean(docIds && docIds.size > 0),
    verbose,
    documents_in_query: (docs || []).length,
    considered,
    written: dryRun ? null : ok,
    skipped_existing: dryRun ? null : skip,
    failed: dryRun ? null : fail,
    fail_by_tag:
      !dryRun && fail > 0 && failByTag.size > 0 ? Object.fromEntries(failByTag.entries()) : undefined,
  });
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
