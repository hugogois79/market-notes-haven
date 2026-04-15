/**
 * Carrega credenciais Work25 a partir de ficheiro (sem dependência dotenv).
 * Ordem: já definidas em process.env têm prioridade.
 *
 * Ficheiros tentados (primeiro que existir):
 *   $WORK25_ENV_FILE
 *   <cwd>/.env.work25
 *
 * Formato: linhas KEY=value (opcionalmente entre aspas). Linhas # são comentários.
 */
import fs from "fs";
import path from "path";

/**
 * Junta quebras de linha acidentais ao colar JWT longo no nano.
 */
export function mergeMultilineJwtValue(text, keyName) {
  const lines = text.split(/\n/);
  const prefix = `${keyName}=`;
  let i = lines.findIndex((L) => L.trimStart().startsWith(prefix));
  if (i < 0) return null;
  let rest = lines[i].slice(lines[i].indexOf("=") + 1).trim();
  if (
    (rest.startsWith('"') && rest.endsWith('"')) ||
    (rest.startsWith("'") && rest.endsWith("'"))
  ) {
    rest = rest.slice(1, -1);
  }
  let merged = rest;
  const dotCount = (s) => (s.match(/\./g) || []).length;
  i++;
  while (i < lines.length && dotCount(merged) < 2) {
    const t = lines[i].trim();
    if (!t || t.startsWith("#")) {
      i++;
      continue;
    }
    if (/^[A-Za-z_][A-Za-z0-9_]*=/.test(t)) break;
    merged += t;
    i++;
  }
  return merged.replace(/\s/g, "");
}

export function loadWork25EnvFile(cwd = process.cwd()) {
  const extra = process.env.WORK25_ENV_FILE?.trim();
  const candidates = [extra, path.join(cwd, ".env.work25")].filter(Boolean);
  let loadedFrom = null;
  for (const filePath of candidates) {
    try {
      if (!fs.existsSync(filePath)) continue;
      const text = fs.readFileSync(filePath, "utf8");
      for (const line of text.split("\n")) {
        const trimmed = line.trim();
        if (!trimmed || trimmed.startsWith("#")) continue;
        const eq = trimmed.indexOf("=");
        if (eq <= 0) continue;
        const k = trimmed.slice(0, eq).trim();
        let v = trimmed.slice(eq + 1).trim();
        if (
          (v.startsWith('"') && v.endsWith('"')) ||
          (v.startsWith("'") && v.endsWith("'"))
        ) {
          v = v.slice(1, -1);
        }
        if (!/^[A-Za-z_][A-Za-z0-9_]*$/.test(k)) continue;
        if (process.env[k] === undefined || process.env[k] === "") {
          process.env[k] = v;
        }
      }
      const mergedJwt = mergeMultilineJwtValue(text, "SUPABASE_SERVICE_ROLE_KEY");
      if (mergedJwt && (process.env.SUPABASE_SERVICE_ROLE_KEY === undefined || process.env.SUPABASE_SERVICE_ROLE_KEY === "")) {
        process.env.SUPABASE_SERVICE_ROLE_KEY = mergedJwt;
      } else if (mergedJwt && (process.env.SUPABASE_SERVICE_ROLE_KEY || "").replace(/\s/g, "").split(".").length < 3) {
        process.env.SUPABASE_SERVICE_ROLE_KEY = mergedJwt;
      }
      loadedFrom = filePath;
      break;
    } catch {
      /* próximo */
    }
  }
  return loadedFrom;
}

/**
 * Decodifica payload JWT (sem verificar assinatura) — só para diagnóstico.
 * @returns {{ role?: string, exp?: number, error?: string }}
 */
export function jwtPayloadPeek(jwt) {
  try {
    const compact = String(jwt).replace(/\s/g, "");
    const parts = compact.split(".");
    if (parts.length !== 3) {
      return {
        error: `JWT sem 3 segmentos (${parts.length} partes, ${(compact.match(/\./g) || []).length} pontos, ${compact.length} chars)`,
      };
    }
    const b64 = parts[1].replace(/-/g, "+").replace(/_/g, "/");
    const pad = b64.length % 4;
    const padded = pad ? b64 + "=".repeat(4 - pad) : b64;
    const payload = JSON.parse(Buffer.from(padded, "base64").toString("utf8"));
    return { role: payload.role, exp: payload.exp };
  } catch (e) {
    return { error: e?.message || String(e) };
  }
}

/**
 * Termina o processo se o JWT for anon ou ilegível. Não imprime o segredo.
 */
export function assertServiceRoleJwt(key) {
  const compact = String(key || "").replace(/\s/g, "");
  const peek = jwtPayloadPeek(compact);
  if (peek.error && !peek.role) {
    console.error(`SUPABASE_SERVICE_ROLE_KEY: ${peek.error}.`);
    console.error(
      "Confirma: colaste o secret «service_role» completo (Project Settings → API)? Uma linha no .env, exactamente 2 pontos «.» no JWT, sem texto a mais."
    );
    console.error(
      "Se usaste nano: desliga «hard wrap» ou cola outra vez numa única linha; ou remove aspas desnecessárias em volta da chave."
    );
    process.exit(1);
  }
  if (peek.role === "anon") {
    console.error(
      "A variável SUPABASE_SERVICE_ROLE_KEY contém uma chave ANON, não SERVICE_ROLE."
    );
    console.error(
      "No Supabase: Project Settings → API → copia o secret «service_role» (não «anon»)."
    );
    process.exit(1);
  }
  if (peek.role && peek.role !== "service_role") {
    console.error(`Aviso: JWT com role=\"${peek.role}\" (esperado service_role).`);
  }
}

/**
 * Quando a API devolve Invalid API key.
 */
export function printInvalidApiKeyDiagnostics(url, key, apiError) {
  const peek = jwtPayloadPeek(key);
  let host = "";
  try {
    host = url ? new URL(url).host : "";
  } catch {
    /* */
  }
  console.error(apiError?.message || "Erro de autenticação Supabase");
  if (apiError?.hint) console.error(String(apiError.hint));
  console.error("--- Diagnóstico (sem revelar a chave) ---");
  console.error(`SUPABASE_URL: ${url ? `OK (host ${host})` : "EM FALTA"}`);
  console.error(`Chave: ${key.length} caracteres, segmentos JWT: ${key.split(".").length}`);
  if (peek.role) console.error(`Papel no JWT: ${peek.role}`);
  if (peek.role === "anon") {
    console.error("Correcção: usa o secret «service_role», não «anon», do MESMO projecto que o URL.");
  } else if (peek.role === "service_role") {
    console.error(
      "O JWT indica service_role mas o servidor recusou: projecto errado, chave regenerada, ou URL não corresponde."
    );
  }
  console.error("Cria .env.work25 nesta pasta com SUPABASE_URL= e SUPABASE_SERVICE_ROLE_KEY= ou exporta no shell.");
}
