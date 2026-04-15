#!/usr/bin/env node
/**
 * Verifica quais workflow_files com server_path devolvem 404 no api-server local.
 * Uso: node scripts/verify-workflow-disk-files.mjs
 * Env: VERIFY_API_BASE=http://127.0.0.1:3001 (default)
 *
 * Lê JSON array stdin: [{"id":"...","file_name":"...","server_path":"..."},...]
 * Ou ficheiro: node scripts/verify-workflow-disk-files.mjs caminho.json
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const BASE = (process.env.VERIFY_API_BASE || "http://127.0.0.1:3001").replace(/\/$/, "");

async function checkOne(row) {
  const sp = row.server_path?.trim();
  if (!sp) return { row, status: "skip", http: null };
  const url = `${BASE}/api/work-files/download?file=${encodeURIComponent(sp)}`;
  try {
    const res = await fetch(url, { method: "GET", cache: "no-store" });
    return { row, status: res.ok ? "ok" : "fail", http: res.status };
  } catch (e) {
    return { row, status: "error", http: null, err: String(e.message || e) };
  }
}

async function main() {
  let raw;
  if (process.argv[2]) {
    raw = fs.readFileSync(process.argv[2], "utf8");
  } else {
    raw = fs.readFileSync(0, "utf8");
  }
  const rows = JSON.parse(raw);
  if (!Array.isArray(rows)) {
    console.error("Esperado JSON array");
    process.exit(1);
  }

  const results = [];
  const concurrency = 8;
  for (let i = 0; i < rows.length; i += concurrency) {
    const chunk = rows.slice(i, i + concurrency);
    const part = await Promise.all(chunk.map(checkOne));
    results.push(...part);
  }

  const missing = results.filter((r) => r.http === 404);
  const forbidden = results.filter((r) => r.http === 403);
  const ok = results.filter((r) => r.status === "ok");
  const other = results.filter((r) => r.status === "fail" && r.http !== 404 && r.http !== 403);
  const errors = results.filter((r) => r.status === "error");

  const report = {
    api_base: BASE,
    total_input: rows.length,
    ok: ok.length,
    missing_404: missing.length,
    forbidden_403: forbidden.length,
    other_http: other.length,
    fetch_errors: errors.length,
    missing_rows: missing.map((m) => ({
      id: m.row.id,
      file_name: m.row.file_name,
      server_path: m.row.server_path,
    })),
    forbidden_rows: forbidden.map((m) => ({
      id: m.row.id,
      file_name: m.row.file_name,
      server_path: m.row.server_path,
    })),
    other_rows: other.map((m) => ({
      id: m.row.id,
      http: m.http,
      file_name: m.row.file_name,
      server_path: m.row.server_path,
    })),
    error_rows: errors.map((m) => ({
      id: m.row.id,
      err: m.err,
      server_path: m.row.server_path,
    })),
  };

  console.log(JSON.stringify(report, null, 2));
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
