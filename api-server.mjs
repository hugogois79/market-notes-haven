#!/usr/bin/env node

/**
 * API server para Market Notes Haven
 * 
 * Serve endpoints que precisam de acesso ao filesystem do servidor,
 * como browse-folders. Corre como serviço separado, proxied pelo Caddy.
 * 
 * Porto: 3001 (apenas localhost)
 */

import http from "node:http";
import fs from "node:fs";
import path from "node:path";

const PORT = 3001;
const HOST = "127.0.0.1";

// Raízes permitidas para navegação
const ALLOWED_ROOTS = ["/root/Robsonway-Research", "/root"];

function jsonResponse(res, statusCode, data) {
  res.writeHead(statusCode, {
    "Content-Type": "application/json",
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
  });
  res.end(JSON.stringify(data));
}

function handleBrowseFolders(req, res) {
  const url = new URL(req.url, `http://${HOST}`);
  const dirPath = url.searchParams.get("path") || "/root/Robsonway-Research";

  // Segurança: só permitir caminhos dentro das raízes permitidas
  const resolved = path.resolve(dirPath);
  const isAllowed = ALLOWED_ROOTS.some((root) => resolved.startsWith(root));

  if (!isAllowed) {
    jsonResponse(res, 403, { error: "Acesso negado a este caminho" });
    return;
  }

  try {
    if (!fs.existsSync(resolved)) {
      jsonResponse(res, 404, { error: "Pasta não encontrada" });
      return;
    }

    const stat = fs.statSync(resolved);
    if (!stat.isDirectory()) {
      jsonResponse(res, 400, { error: "Caminho não é uma pasta" });
      return;
    }

    const entries = fs.readdirSync(resolved, { withFileTypes: true });
    const folders = entries
      .filter((e) => e.isDirectory() && !e.name.startsWith("."))
      .map((e) => ({
        name: e.name,
        path: path.join(resolved, e.name),
      }))
      .sort((a, b) => a.name.localeCompare(b.name));

    jsonResponse(res, 200, {
      current: resolved,
      parent: path.dirname(resolved),
      folders,
    });
  } catch (err) {
    jsonResponse(res, 500, { error: err.message });
  }
}

const server = http.createServer((req, res) => {
  // CORS preflight
  if (req.method === "OPTIONS") {
    res.writeHead(204, {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    });
    res.end();
    return;
  }

  const url = new URL(req.url, `http://${HOST}`);

  if (url.pathname === "/api/browse-folders" && req.method === "GET") {
    handleBrowseFolders(req, res);
  } else if (url.pathname === "/api/health") {
    jsonResponse(res, 200, { status: "ok", uptime: process.uptime() });
  } else {
    jsonResponse(res, 404, { error: "Endpoint não encontrado" });
  }
});

server.listen(PORT, HOST, () => {
  console.log(`[API Server] A escutar em http://${HOST}:${PORT}`);
});
