/**
 * Junta `server_root` + `folder_path` relativos a WORK_FILES_ROOT, sem duplicar segmentos
 * quando a raiz já contém o mesmo sufixo que `folder_path`.
 */
export function resolveWorkflowDiskRelativePath(serverRoot: string, folderPath: string): string {
  const r = serverRoot.trim().replace(/\\/g, "/").replace(/\/+$/, "");
  const f = folderPath.trim().replace(/\\/g, "/").replace(/^\/+/, "");
  if (!r) return f;
  if (!f) return r;
  if (r === f) return r;
  if (f.startsWith(r + "/")) return f;
  if (r.endsWith("/" + f)) return r;
  if (r.endsWith(f)) {
    const before = r.length - f.length - 1;
    if (before >= 0 && r.charAt(before) === "/") return r;
  }
  return `${r}/${f}`;
}

/** Nome seguro para gravar no disco (upload VPS / company-documents). */
export function sanitizeWorkflowFileName(fileName: string): string {
  const lastDot = fileName.lastIndexOf(".");
  const ext = lastDot !== -1 ? fileName.substring(lastDot) : "";
  const nameWithoutExt = lastDot !== -1 ? fileName.substring(0, lastDot) : fileName;
  const sanitized = nameWithoutExt
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9-_]/g, "_")
    .replace(/_+/g, "_")
    .replace(/^_|_$/g, "");
  return sanitized + ext;
}

/** Nome para gravar no VPS: só remove barras e controlos; mantém €, espaços e parênteses (como no Explorador). */
export function safeWorkFilesUploadFileName(name: string): string {
  const t = name.trim().replace(/[/\\]/g, "_").replace(/[\x00-\x1f]/g, "");
  if (t.length <= 240) return t;
  const dot = t.lastIndexOf(".");
  const ext = dot > 0 ? t.slice(dot) : "";
  const maxBase = Math.max(1, 240 - ext.length);
  return t.slice(0, maxBase) + ext;
}
