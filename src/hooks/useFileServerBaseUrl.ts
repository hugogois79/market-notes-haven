import { useMemo } from "react";

/**
 * URL absoluta opcional do servidor de ficheiros Work (ex.: produção com API noutro host).
 * Em branco, usa mesmo origin (ex.: /api/work-files/... na app).
 */
export function useFileServerBaseUrl(): string {
  return useMemo(() => {
    const fromEnv = import.meta.env.VITE_WORK_FILES_API_BASE as string | undefined;
    if (fromEnv?.trim()) return fromEnv.replace(/\/$/, "");
    return "";
  }, []);
}

/** Mesmo padrão que [id].tsx / WorkFlowTab upload — download por server_path. */
export function getWorkFileDownloadUrl(serverPath: string, baseUrl: string): string {
  const path = `/api/work-files/download?file=${encodeURIComponent(serverPath)}`;
  if (baseUrl?.trim()) {
    return `${baseUrl.replace(/\/$/, "")}${path}`;
  }
  return path;
}

/**
 * Lista subpastas no disco (api-server), relativas a WORK_FILES_ROOT.
 * `listFolder` vazio = raiz configurada no servidor; ex. "Work" ou "Splendidoption/Work" para só empresas.
 */
export function getWorkFilesListUrl(baseUrl: string, listFolder = ""): string {
  const q = new URLSearchParams();
  if (listFolder != null && listFolder !== "") {
    q.set("folder", listFolder);
  }
  const qs = q.toString();
  const path = `/api/work-files/list${qs ? `?${qs}` : ""}`;
  if (baseUrl?.trim()) {
    return `${baseUrl.replace(/\/$/, "")}${path}`;
  }
  return path;
}

/** Upload para o api-server (query: folder, filename). */
export function getWorkFilesUploadUrl(baseUrl: string, searchParams: URLSearchParams): string {
  const q = searchParams.toString();
  const path = `/api/work-files/upload${q ? `?${q}` : ""}`;
  if (baseUrl?.trim()) {
    return `${baseUrl.replace(/\/$/, "")}${path}`;
  }
  return path;
}

/** Garante URL absoluta para fetch (Supabase, /api/..., ou já absoluta). */
export function resolvePublicFileFetchUrl(fileUrl: string | null | undefined): string {
  const fu = fileUrl?.trim() || "";
  if (!fu) return "";
  if (fu.startsWith("http://") || fu.startsWith("https://")) return fu;
  if (typeof window !== "undefined") {
    return `${window.location.origin}${fu.startsWith("/") ? fu : `/${fu}`}`;
  }
  return fu;
}

/**
 * Extrai bucket + caminho do objecto a partir de uma URL Supabase Storage (pública ou sign).
 * Usa `resolvePublicFileFetchUrl` para aceitar URLs relativas (evita `new URL(relativo)` → Invalid URL).
 */
export function parseSupabasePublicStorageFile(
  fileUrl: string | null | undefined
): { bucket: string; filePath: string } | null {
  const abs = resolvePublicFileFetchUrl(fileUrl);
  if (!abs) return null;
  let url: URL;
  try {
    url = new URL(abs);
  } catch {
    return null;
  }
  const splitPath = (prefix: string): { bucket: string; filePath: string } | null => {
    const pathParts = url.pathname.split(prefix);
    if (pathParts.length < 2) return null;
    const [bucket, ...rest] = pathParts[1].split("/");
    if (!bucket || rest.length === 0) return null;
    const filePath = decodeURIComponent(rest.join("/"));
    return { bucket, filePath };
  };
  return (
    splitPath("/storage/v1/object/public/") ?? splitPath("/storage/v1/object/sign/")
  );
}

/** Buckets usados em workflow / documentos (referências relativas sem hostname). */
const WORKFLOW_STORAGE_BUCKETS = new Set(["company-documents", "attachments"]);

/**
 * Quando `file_url` na BD não é URL completa mas sim `bucket/caminho` ou só o caminho dentro
 * de `company-documents` (ex. pipeline John/n8n), o parser por URL falha — isto recupera bucket + path.
 */
export function parseSupabaseStorageLooseRef(
  input: string | null | undefined
): { bucket: string; filePath: string } | null {
  const fromUrl = parseSupabasePublicStorageFile(input);
  if (fromUrl) return fromUrl;

  const s = input?.trim() || "";
  if (!s) return null;
  // Não adivinhar em links http(s) que não passaram no parser de Storage.
  if (/^https?:\/\//i.test(s)) return null;

  const noLead = s.replace(/^\/+/, "");

  for (const bucket of WORKFLOW_STORAGE_BUCKETS) {
    const prefix = `${bucket}/`;
    if (noLead.startsWith(prefix)) {
      return { bucket, filePath: noLead.slice(prefix.length) };
    }
  }

  // Caminhos típicos só no bucket company-documents (sem prefixo do bucket na BD)
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

/**
 * Só priorizar `file_url` sobre `server_path` quando for **Supabase Storage** (URL completa, path público/sign ou referência `bucket/caminho`).
 * URLs https genéricas (Wise, etc.) não são ficheiros.
 */
export function shouldPreferWorkflowFileUrlOverServer(fileUrl: string | null | undefined): boolean {
  const fu = fileUrl?.trim() || "";
  if (!fu) return false;
  if (fu.includes("/storage/v1/object/")) return true;
  return parseSupabaseStorageLooseRef(fu) !== null;
}

