#!/usr/bin/env node
/**
 * Descarrega workflow_files do Supabase Storage (Work25) para a árvore NVMe.
 *
 * Mapeamento: `<companies.name>/...` na BD → `<pasta NVMe>/...` em disco.
 * Omissão: Splendidoption Lda → Splendidoption (PT).
 *
 *   export SUPABASE_URL="https://zyziolikudoczsthyoja.supabase.co"
 *   export SUPABASE_SERVICE_ROLE_KEY="..."
 *   export DEST_NVME_ROOT="/data/nvme"
 *   # export SYNC_COMPANY_ID="<uuid>"   # outra empresa
 *   # export SYNC_DISK_FOLDER="Nome pasta NVMe"  # opcional; omissão = companies.name
 *
 *   node scripts/sync-splendidoption-work-from-supabase.mjs --dry-run
 *   node scripts/sync-splendidoption-work-from-supabase.mjs --company-id=<uuid> --dry-run
 *
 * Opções:
 *   --company-id=uuid
 *   --dry-run
 *   --server-path-only
 *   --years=2025,2026
 *
 * Nota: file_url só /api/work-files/... tenta WORK_FILES_LDA_ROOT + server_path.
 */

import { createClient } from "@supabase/supabase-js";
import fs from "fs/promises";
import path from "path";
import {
  loadWork25EnvFile,
  assertServiceRoleJwt,
  printInvalidApiKeyDiagnostics,
} from "./load-work25-env.mjs";

const DEFAULT_COMPANY_ID = "0bddb3b3-cd90-420a-b37d-be467c0c0687";
const DEFAULT_DB_PATH_PREFIX = "Splendidoption Lda";
const DEFAULT_DISK_FOLDER = "Splendidoption (PT)";

/** Preenchido em main() após resolver empresa */
let WFC_ID = DEFAULT_COMPANY_ID;
let WFC_FROM = DEFAULT_DB_PATH_PREFIX;
let WFC_TO = DEFAULT_DISK_FOLDER;

const WORKFLOW_BUCKETS = new Set(["company-documents", "attachments"]);

function parseArgs(argv) {
  let dryRun = false;
  let serverPathOnly = false;
  let years = new Set([2025, 2026]);
  /** @type {string|null} */
  let companyIdArg = null;
  for (const a of argv) {
    if (a === "--dry-run") dryRun = true;
    if (a === "--server-path-only") serverPathOnly = true;
    if (a.startsWith("--company-id=")) {
      companyIdArg = a.slice("--company-id=".length).trim() || null;
    }
    if (a.startsWith("--years=")) {
      years = new Set(
        a
          .slice("--years=".length)
          .split(",")
          .map((s) => parseInt(s.trim(), 10))
          .filter((n) => !Number.isNaN(n))
      );
    }
  }
  return { dryRun, serverPathOnly, years, companyIdArg };
}

function sanitizeJwtFromEnv(raw) {
  let s = String(raw ?? "").trim();
  s = s.normalize("NFKC");
  s = s.replace(/\uFEFF/g, "");
  s = s.replace(/[\u200B-\u200D\u2060]/g, "");
  s = s.replace(/^[\s"'`\u201C\u201D\u2018\u2019]+|[\s"'`\u201C\u201D\u2018\u2019]+$/g, "");
  s = s.replace(/[\u2010-\u2015\u2212\uFE58\uFE63\uFF0D]/g, "-");
  return s.trim();
}

/**
 * @param {string|null|undefined} explicitId
 */
async function resolveCompanyForWorkflow(supabase, explicitId, authCtx) {
  const id = explicitId?.trim();
  if (!id) {
    WFC_ID = DEFAULT_COMPANY_ID;
    WFC_FROM = DEFAULT_DB_PATH_PREFIX;
    WFC_TO = DEFAULT_DISK_FOLDER;
    return;
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
    console.error(`Empresa não encontrada: id=${id}`);
    process.exit(1);
  }
  WFC_ID = row.id;
  WFC_FROM = row.name;
  WFC_TO = process.env.SYNC_DISK_FOLDER?.trim() || row.name;
}

/** Espelho de parseSupabaseStorageLooseRef (useFileServerBaseUrl.ts) — só buckets workflow. */
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
    /^merged-/.test(lastSeg) ||
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\//i.test(noLead)
  ) {
    return { bucket: "company-documents", filePath: noLead };
  }

  return null;
}

function mapServerPathToDisk(sp) {
  if (!sp || !sp.startsWith(`${WFC_FROM}/`)) return null;
  return sp.replace(new RegExp(`^${escapeRe(WFC_FROM)}/`), `${WFC_TO}/`);
}

function escapeRe(s) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function yearForRow(row) {
  if (row.invoice_date) return new Date(row.invoice_date).getFullYear();
  return new Date(row.created_at).getFullYear();
}

function monthForRow(row) {
  const d = row.invoice_date ? new Date(row.invoice_date) : new Date(row.created_at);
  return String(d.getMonth() + 1).padStart(2, "0");
}

function shouldIncludeRow(row, { serverPathOnly, years }) {
  const sp = row.server_path?.trim() || "";
  if (serverPathOnly) {
    return (
      sp.startsWith(`${WFC_FROM}/Work/2025`) || sp.startsWith(`${WFC_FROM}/Work/2026`)
    );
  }
  if (sp.startsWith(`${WFC_FROM}/Work/2025`) || sp.startsWith(`${WFC_FROM}/Work/2026`)) {
    return true;
  }
  const y = yearForRow(row);
  return years.has(y);
}

function safeFileName(name) {
  const base = name.replace(/[/\\]/g, "_").replace(/\0/g, "");
  return base.slice(0, 240) || "unnamed";
}

function destPathForRow(row, destRoot) {
  const sp = row.server_path?.trim();
  if (sp) {
    const mapped = mapServerPathToDisk(sp);
    if (mapped) return path.join(destRoot, mapped);
  }
  const y = yearForRow(row);
  const m = monthForRow(row);
  const fn = safeFileName(row.file_name || "file");
  return path.join(destRoot, WFC_TO, "Work", String(y), m, fn);
}

async function downloadFromStorage(supabase, bucket, filePath) {
  const { data, error } = await supabase.storage.from(bucket).download(filePath);
  if (error) throw error;
  return Buffer.from(await data.arrayBuffer());
}

async function tryGetBytes(supabase, row) {
  for (const ref of [row.file_url, row.receipt_url]) {
    const parsed = parseSupabaseStorageLooseRef(ref);
    if (parsed) {
      try {
        const buf = await downloadFromStorage(supabase, parsed.bucket, parsed.filePath);
        return { buf, source: `storage:${parsed.bucket}/${parsed.filePath}` };
      } catch {
        // tentar próximo ref
      }
    }
  }
  return null;
}

/** Ficheiros só com /api/work-files/... — copiar de árvore companies.name se existir. */
async function tryCopyFromLdaMirror(row) {
  const ldaRoot = process.env.WORK_FILES_LDA_ROOT?.trim();
  const sp = row.server_path?.trim();
  if (!ldaRoot || !sp || !sp.startsWith(`${WFC_FROM}/`)) return null;
  const abs = path.join(ldaRoot, sp);
  try {
    const st = await fs.stat(abs);
    if (!st.isFile()) return null;
    const buf = await fs.readFile(abs);
    return { buf, source: `disk:${abs}` };
  } catch {
    return null;
  }
}

function readSupabaseUrl() {
  const url = sanitizeJwtFromEnv(process.env.SUPABASE_URL);
  if (!url) return "";
  for (let i = 0; i < url.length; i++) {
    if (url.charCodeAt(i) > 127) {
      console.error(`SUPABASE_URL: carácter não ASCII na posição ${i}.`);
      process.exit(1);
    }
  }
  return url;
}

function readServiceRoleKey() {
  let key = sanitizeJwtFromEnv(process.env.SUPABASE_SERVICE_ROLE_KEY);
  if (!key) return "";
  key = key.replace(/\s/g, "");
  for (let i = 0; i < key.length; i++) {
    if (key.charCodeAt(i) > 127) {
      console.error(
        `SUPABASE_SERVICE_ROLE_KEY: carácter inválido na posição ${i} (U+${key.charCodeAt(i).toString(16)}).`
      );
      process.exit(1);
    }
  }
  if (!key.includes(".")) {
    console.error('SUPABASE_SERVICE_ROLE_KEY: JWT esperado (segmentos separados por ".").');
    process.exit(1);
  }
  return key;
}

async function main() {
  const envFrom = loadWork25EnvFile();
  if (envFrom) {
    console.error(`Credenciais carregadas de: ${envFrom}`);
  }

  const argvSlice = process.argv.slice(2);
  const { dryRun, serverPathOnly, years, companyIdArg } = parseArgs(argvSlice);
  const explicitCompanyId = companyIdArg || process.env.SYNC_COMPANY_ID?.trim() || null;
  const url = readSupabaseUrl();
  const key = readServiceRoleKey();
  const destRoot = process.env.DEST_NVME_ROOT?.trim() || "/data/nvme";
  const ldaHint = process.env.WORK_FILES_LDA_ROOT?.trim();

  if (!url || !key) {
    console.error(
      "Defina SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY (JWT real do projecto Work25)."
    );
    console.error("Ou cria .env.work25 nesta pasta (gitignored).");
    process.exit(1);
  }

  assertServiceRoleJwt(key);

  const supabase = createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  await resolveCompanyForWorkflow(supabase, explicitCompanyId, { url, key });

  console.error(
    `workflow_files: empresa "${WFC_FROM}" → NVMe/${WFC_TO} (id=${WFC_ID}), anos ${[...years].join(",")}`
  );

  const { data: rows, error } = await supabase
    .from("workflow_files")
    .select(
      "id,file_name,file_url,receipt_url,server_path,invoice_date,created_at"
    )
    .eq("company_id", WFC_ID);

  if (error) {
    if (String(error.message || "").includes("Invalid API key")) {
      printInvalidApiKeyDiagnostics(url, key, error);
    } else {
      console.error(error);
    }
    process.exit(1);
  }

  const selected = (rows || []).filter((r) => shouldIncludeRow(r, { serverPathOnly, years }));
  console.error(
    `Seleccionados ${selected.length} ficheiros${serverPathOnly ? ", só server_path Work/2025|2026" : ""}. Destino base: ${destRoot}${ldaHint ? ` | espelho LDA: ${ldaHint}` : ""}`
  );

  let ok = 0;
  let skip = 0;
  let fail = 0;

  for (const row of selected) {
    const dest = destPathForRow(row, destRoot);
    if (dryRun) {
      console.log(`[dry-run] ${row.id} → ${dest}`);
      continue;
    }

    try {
      const existing = await fs.stat(dest).catch(() => null);
      if (existing?.isFile()) {
        console.error(`[skip exists] ${dest}`);
        skip++;
        continue;
      }

      let got = await tryGetBytes(supabase, row);
      if (!got) got = await tryCopyFromLdaMirror(row);
      if (!got) {
        console.error(`[fail no storage nem espelho LDA] ${row.id} ${row.file_name}`);
        fail++;
        continue;
      }

      await fs.mkdir(path.dirname(dest), { recursive: true });
      await fs.writeFile(dest, got.buf);
      console.error(`[ok] ${got.source} → ${dest}`);
      ok++;
    } catch (e) {
      console.error(`[fail] ${row.id}`, e.message || e);
      fail++;
    }
  }

  if (dryRun) {
    console.error(`Dry-run: ${selected.length} ficheiros. Correr sem --dry-run para descarregar.`);
  } else {
    console.error(`Feito: ${ok} escritos, ${skip} já existiam, ${fail} falharam.`);
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
