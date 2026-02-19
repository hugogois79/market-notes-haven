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

const LEGAL_BASE = "/root/Robsonway-Research/Legal";
const WORK_BASE = "/root/Robsonway-Research";
const WORK_BLOCKED_SEGMENTS = new Set([".cursor", ".git", ".venv", "node_modules", "__pycache__", "Workspaces"]);

function jsonResponse(res, statusCode, data) {
  res.writeHead(statusCode, {
    "Content-Type": "application/json",
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
  });
  res.end(JSON.stringify(data));
}

function getNextSequentialNumber(dirPath) {
  if (!fs.existsSync(dirPath)) return 1;
  const entries = fs.readdirSync(dirPath);
  let maxNum = 0;
  for (const entry of entries) {
    const match = entry.match(/^(\d+)\./);
    if (match) {
      const num = parseInt(match[1], 10);
      if (num > maxNum) maxNum = num;
    }
  }
  return maxNum + 1;
}

const MONTH_NAMES_PT = [
  "", "01 Janeiro", "02 Fevereiro", "03 Março", "04 Abril",
  "05 Maio", "06 Junho", "07 Julho", "08 Agosto",
  "09 Setembro", "10 Outubro", "11 Novembro", "12 Dezembro"
];

function getYearMonthSubfolder(dateStr) {
  if (!dateStr) return null;
  const m = dateStr.match(/^(\d{4})-(\d{2})/);
  if (!m) return null;
  const year = m[1];
  const month = parseInt(m[2], 10);
  if (month < 1 || month > 12) return null;
  return `${year}/${MONTH_NAMES_PT[month]} ${year}`;
}

function handleLegalFilesUpload(req, res) {
  const url = new URL(req.url, `http://${HOST}`);
  const folder = url.searchParams.get("folder") || "";
  const title = url.searchParams.get("title") || "";
  const dateStr = url.searchParams.get("date") || "";
  const filename = url.searchParams.get("filename") || "document.pdf";

  if (!folder) {
    jsonResponse(res, 400, { error: "Parametro 'folder' obrigatorio" });
    return;
  }

  const resolved = validateLegalPath(folder);
  if (!resolved) {
    jsonResponse(res, 403, { error: "Acesso negado" });
    return;
  }

  const subFolder = getYearMonthSubfolder(dateStr);
  const targetDir = subFolder ? path.join(resolved, subFolder) : resolved;
  const relFolder = subFolder ? `${folder}/${subFolder}` : folder;

  if (!fs.existsSync(targetDir)) {
    fs.mkdirSync(targetDir, { recursive: true });
  }

  const chunks = [];
  req.on("data", (chunk) => chunks.push(chunk));
  req.on("end", () => {
    try {
      const fileData = Buffer.concat(chunks);
      if (fileData.length === 0) {
        jsonResponse(res, 400, { error: "Ficheiro vazio" });
        return;
      }

      const ext = path.extname(filename) || ".pdf";
      const nextNum = getNextSequentialNumber(targetDir);

      let description = title;
      if (!description) {
        description = path.basename(filename, ext).replace(/[_-]/g, " ");
      }
      const words = description.split(/\s+/).slice(0, 5).join(" ");

      let datePart = "";
      if (dateStr) {
        const m = dateStr.match(/^(\d{4})-(\d{2})-(\d{2})/);
        if (m) datePart = ` (${m[3]}-${m[2]}-${m[1]})`;
      }

      const newName = `${nextNum}. ${words}${datePart}${ext}`;
      const destPath = path.join(targetDir, newName);

      fs.writeFileSync(destPath, fileData);

      const relativePath = `${relFolder}/${newName}`;

      jsonResponse(res, 200, {
        server_path: relativePath,
        filename: newName,
        size: fileData.length,
      });
    } catch (err) {
      jsonResponse(res, 500, { error: err.message });
    }
  });
  req.on("error", (err) => {
    jsonResponse(res, 500, { error: err.message });
  });
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

function validateLegalPath(relativePath) {
  const resolved = path.resolve(LEGAL_BASE, relativePath);
  if (!resolved.startsWith(LEGAL_BASE)) {
    return null;
  }
  return resolved;
}

function formatFileSize(bytes) {
  if (bytes < 1024) return bytes + " B";
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
  if (bytes < 1024 * 1024 * 1024) return (bytes / (1024 * 1024)).toFixed(1) + " MB";
  return (bytes / (1024 * 1024 * 1024)).toFixed(2) + " GB";
}

function handleLegalFilesList(req, res) {
  const url = new URL(req.url, `http://${HOST}`);
  const folder = url.searchParams.get("folder") || "";

  const resolved = validateLegalPath(folder);
  if (!resolved) {
    jsonResponse(res, 403, { error: "Acesso negado" });
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
    const items = entries
      .filter((e) => !e.name.startsWith("."))
      .map((e) => {
        const fullPath = path.join(resolved, e.name);
        const s = fs.statSync(fullPath);
        return {
          name: e.name,
          type: e.isDirectory() ? "dir" : "file",
          size: e.isDirectory() ? null : s.size,
          sizeFormatted: e.isDirectory() ? null : formatFileSize(s.size),
          modified: s.mtime.toISOString(),
        };
      })
      .sort((a, b) => {
        if (a.type !== b.type) return a.type === "dir" ? -1 : 1;
        return a.name.localeCompare(b.name);
      });

    const relativePath = path.relative(LEGAL_BASE, resolved);
    jsonResponse(res, 200, {
      folder: relativePath || ".",
      parentFolder: relativePath ? path.dirname(relativePath) : null,
      items,
    });
  } catch (err) {
    jsonResponse(res, 500, { error: err.message });
  }
}

function handleLegalFilesDownload(req, res) {
  const url = new URL(req.url, `http://${HOST}`);
  const filePath = url.searchParams.get("file") || "";

  const resolved = validateLegalPath(filePath);
  if (!resolved) {
    res.writeHead(403, { "Content-Type": "text/plain" });
    res.end("Acesso negado");
    return;
  }

  try {
    if (!fs.existsSync(resolved)) {
      res.writeHead(404, { "Content-Type": "text/plain" });
      res.end("Ficheiro não encontrado");
      return;
    }

    const stat = fs.statSync(resolved);
    if (!stat.isFile()) {
      res.writeHead(400, { "Content-Type": "text/plain" });
      res.end("Caminho não é um ficheiro");
      return;
    }

    const fileName = path.basename(resolved);
    const ext = path.extname(fileName).toLowerCase();
    const mimeTypes = {
      ".pdf": "application/pdf",
      ".doc": "application/msword",
      ".docx": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      ".xls": "application/vnd.ms-excel",
      ".xlsx": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      ".jpg": "image/jpeg",
      ".jpeg": "image/jpeg",
      ".png": "image/png",
      ".txt": "text/plain",
      ".eml": "message/rfc822",
      ".msg": "application/vnd.ms-outlook",
      ".zip": "application/zip",
    };
    const contentType = mimeTypes[ext] || "application/octet-stream";

    res.writeHead(200, {
      "Content-Type": contentType,
      "Content-Length": stat.size,
      "Content-Disposition": `attachment; filename="${encodeURIComponent(fileName)}"`,
      "Access-Control-Allow-Origin": "*",
    });

    const stream = fs.createReadStream(resolved);
    stream.pipe(res);
    stream.on("error", () => {
      res.writeHead(500, { "Content-Type": "text/plain" });
      res.end("Erro ao ler ficheiro");
    });
  } catch (err) {
    res.writeHead(500, { "Content-Type": "text/plain" });
    res.end(err.message);
  }
}

// ── Work Files helpers ──────────────────────────────────────────────

function validateWorkPath(relativePath) {
  const resolved = path.resolve(WORK_BASE, relativePath);
  if (!resolved.startsWith(WORK_BASE)) return null;
  const segments = relativePath.split(path.sep);
  for (const seg of segments) {
    if (WORK_BLOCKED_SEGMENTS.has(seg)) return null;
  }
  return resolved;
}

function handleWorkFilesList(req, res) {
  const url = new URL(req.url, `http://${HOST}`);
  const folder = url.searchParams.get("folder") || "";

  const resolved = validateWorkPath(folder);
  if (!resolved) {
    jsonResponse(res, 403, { error: "Acesso negado" });
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
    const items = entries
      .filter((e) => !e.name.startsWith(".") && !WORK_BLOCKED_SEGMENTS.has(e.name))
      .map((e) => {
        const fullPath = path.join(resolved, e.name);
        const s = fs.statSync(fullPath);
        return {
          name: e.name,
          type: e.isDirectory() ? "dir" : "file",
          size: e.isDirectory() ? null : s.size,
          sizeFormatted: e.isDirectory() ? null : formatFileSize(s.size),
          modified: s.mtime.toISOString(),
        };
      })
      .sort((a, b) => {
        if (a.type !== b.type) return a.type === "dir" ? -1 : 1;
        return a.name.localeCompare(b.name);
      });

    const relativePath = path.relative(WORK_BASE, resolved);
    jsonResponse(res, 200, {
      folder: relativePath || ".",
      parentFolder: relativePath ? path.dirname(relativePath) : null,
      items,
    });
  } catch (err) {
    jsonResponse(res, 500, { error: err.message });
  }
}

function handleWorkFilesUpload(req, res) {
  const url = new URL(req.url, `http://${HOST}`);
  const folder = url.searchParams.get("folder") || "";
  const filename = url.searchParams.get("filename") || "document.pdf";

  if (!folder) {
    jsonResponse(res, 400, { error: "Parametro 'folder' obrigatorio" });
    return;
  }

  const resolved = validateWorkPath(folder);
  if (!resolved) {
    jsonResponse(res, 403, { error: "Acesso negado" });
    return;
  }

  if (!fs.existsSync(resolved)) {
    fs.mkdirSync(resolved, { recursive: true });
  }

  const chunks = [];
  req.on("data", (chunk) => chunks.push(chunk));
  req.on("end", () => {
    try {
      const fileData = Buffer.concat(chunks);
      if (fileData.length === 0) {
        jsonResponse(res, 400, { error: "Ficheiro vazio" });
        return;
      }

      const safeName = filename.replace(/[\/\\]/g, "_");
      let destPath = path.join(resolved, safeName);

      if (fs.existsSync(destPath)) {
        const ext = path.extname(safeName);
        const base = path.basename(safeName, ext);
        destPath = path.join(resolved, `${base}_${Date.now()}${ext}`);
      }

      fs.writeFileSync(destPath, fileData);

      const finalName = path.basename(destPath);
      const serverPath = `${folder}/${finalName}`;

      jsonResponse(res, 200, {
        server_path: serverPath,
        filename: finalName,
        size: fileData.length,
      });
    } catch (err) {
      jsonResponse(res, 500, { error: err.message });
    }
  });
  req.on("error", (err) => {
    jsonResponse(res, 500, { error: err.message });
  });
}

function handleWorkFilesDownload(req, res) {
  const url = new URL(req.url, `http://${HOST}`);
  const filePath = url.searchParams.get("file") || "";

  const resolved = validateWorkPath(filePath);
  if (!resolved) {
    res.writeHead(403, { "Content-Type": "text/plain" });
    res.end("Acesso negado");
    return;
  }

  try {
    if (!fs.existsSync(resolved)) {
      res.writeHead(404, { "Content-Type": "text/plain" });
      res.end("Ficheiro não encontrado");
      return;
    }
    const stat = fs.statSync(resolved);
    if (!stat.isFile()) {
      res.writeHead(400, { "Content-Type": "text/plain" });
      res.end("Caminho não é um ficheiro");
      return;
    }

    const fileName = path.basename(resolved);
    const ext = path.extname(fileName).toLowerCase();
    const mimeTypes = {
      ".pdf": "application/pdf",
      ".doc": "application/msword",
      ".docx": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      ".xls": "application/vnd.ms-excel",
      ".xlsx": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      ".jpg": "image/jpeg",
      ".jpeg": "image/jpeg",
      ".png": "image/png",
      ".gif": "image/gif",
      ".txt": "text/plain",
      ".csv": "text/csv",
      ".eml": "message/rfc822",
      ".msg": "application/vnd.ms-outlook",
      ".zip": "application/zip",
    };
    const contentType = mimeTypes[ext] || "application/octet-stream";

    res.writeHead(200, {
      "Content-Type": contentType,
      "Content-Length": stat.size,
      "Content-Disposition": `attachment; filename="${encodeURIComponent(fileName)}"`,
      "Access-Control-Allow-Origin": "*",
    });

    const stream = fs.createReadStream(resolved);
    stream.pipe(res);
    stream.on("error", () => {
      res.writeHead(500, { "Content-Type": "text/plain" });
      res.end("Erro ao ler ficheiro");
    });
  } catch (err) {
    res.writeHead(500, { "Content-Type": "text/plain" });
    res.end(err.message);
  }
}

async function handleWorkFilesMigrate(req, res) {
  const chunks = [];
  req.on("data", (chunk) => chunks.push(chunk));
  req.on("end", async () => {
    try {
      const body = JSON.parse(Buffer.concat(chunks).toString());
      const { files, target_folder } = body;

      if (!files || !Array.isArray(files) || !target_folder) {
        jsonResponse(res, 400, { error: "Campos 'files' e 'target_folder' obrigatorios" });
        return;
      }

      const resolved = validateWorkPath(target_folder);
      if (!resolved) {
        jsonResponse(res, 403, { error: "Acesso negado" });
        return;
      }

      if (!fs.existsSync(resolved)) {
        fs.mkdirSync(resolved, { recursive: true });
      }

      const results = [];
      for (const file of files) {
        try {
          const response = await fetch(file.file_url);
          if (!response.ok) {
            results.push({ id: file.id, error: `Download failed: ${response.status}` });
            continue;
          }

          const arrayBuffer = await response.arrayBuffer();
          const fileData = Buffer.from(arrayBuffer);

          let safeName = (file.file_name || "document.pdf").replace(/[\/\\]/g, "_");
          let destPath = path.join(resolved, safeName);

          if (fs.existsSync(destPath)) {
            const ext = path.extname(safeName);
            const base = path.basename(safeName, ext);
            destPath = path.join(resolved, `${base}_${Date.now()}${ext}`);
            safeName = path.basename(destPath);
          }

          fs.writeFileSync(destPath, fileData);

          const serverPath = `${target_folder}/${safeName}`;
          results.push({ id: file.id, server_path: serverPath, size: fileData.length });
        } catch (fileErr) {
          results.push({ id: file.id, error: fileErr.message });
        }
      }

      jsonResponse(res, 200, { results });
    } catch (err) {
      jsonResponse(res, 500, { error: err.message });
    }
  });
  req.on("error", (err) => {
    jsonResponse(res, 500, { error: err.message });
  });
}

const server = http.createServer((req, res) => {
  // CORS preflight
  if (req.method === "OPTIONS") {
    res.writeHead(204, {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    });
    res.end();
    return;
  }

  const url = new URL(req.url, `http://${HOST}`);

  if (url.pathname === "/api/browse-folders" && req.method === "GET") {
    handleBrowseFolders(req, res);
  } else if (url.pathname === "/api/legal-files/list" && req.method === "GET") {
    handleLegalFilesList(req, res);
  } else if (url.pathname === "/api/legal-files/download" && req.method === "GET") {
    handleLegalFilesDownload(req, res);
  } else if (url.pathname === "/api/legal-files/upload" && req.method === "POST") {
    handleLegalFilesUpload(req, res);
  } else if (url.pathname === "/api/work-files/list" && req.method === "GET") {
    handleWorkFilesList(req, res);
  } else if (url.pathname === "/api/work-files/download" && req.method === "GET") {
    handleWorkFilesDownload(req, res);
  } else if (url.pathname === "/api/work-files/upload" && req.method === "POST") {
    handleWorkFilesUpload(req, res);
  } else if (url.pathname === "/api/work-files/migrate" && req.method === "POST") {
    handleWorkFilesMigrate(req, res);
  } else if (url.pathname === "/api/health") {
    jsonResponse(res, 200, { status: "ok", uptime: process.uptime() });
  } else {
    jsonResponse(res, 404, { error: "Endpoint não encontrado" });
  }
});

server.listen(PORT, HOST, () => {
  console.log(`[API Server] A escutar em http://${HOST}:${PORT}`);
});
