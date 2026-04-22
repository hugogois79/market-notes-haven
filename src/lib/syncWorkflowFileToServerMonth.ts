import { supabase } from "@/integrations/supabase/client";
import {
  getWorkFileDownloadUrl,
  getWorkFilesUploadUrl,
  parseSupabaseStorageLooseRef,
  resolvePublicFileFetchUrl,
} from "@/hooks/useFileServerBaseUrl";
import {
  resolveWorkflowDiskRelativePath,
  safeWorkFilesUploadFileName,
} from "@/lib/workflowServerPath";
import {
  recordSuccessfulWorkFilePost,
  shouldSkipDuplicateWorkFilePost,
} from "@/lib/workFilesUploadDedupe";

/**
 * Caminho relativo a WORK_FILES_ROOT onde o ficheiro deve ser gravado.
 * Se na BD `server_root` está vazio e `folder_path` começa por `Work/`, prefixa com o nome da empresa
 * (layout típico `nvme/Hugo Góis/Work/2025/12 Dezembro 2025`).
 */
export async function resolveArchiveFolderOnDisk(
  loc: { server_root: string | null; folder_path: string | null; company_id?: string },
  companyId: string | null | undefined
): Promise<string> {
  let relative = resolveWorkflowDiskRelativePath(
    loc.server_root?.trim() ?? "",
    loc.folder_path?.trim() ?? ""
  );
  if (!relative) return "";
  const cid = (companyId || loc.company_id)?.trim();
  if (relative.startsWith("Work/") && cid) {
    const { data: comp } = await supabase.from("companies").select("name").eq("id", cid).maybeSingle();
    const n = comp?.name?.trim();
    if (n && !relative.startsWith(`${n}/`) && relative !== n) {
      relative = `${n}/${relative}`;
    }
  }
  return relative;
}

const TABLE_RELATIONS_KEY = "work-table-relations";

export type SyncWorkflowToServerResult =
  | { ok: true; targetFolder: string }
  | { ok: false; skipped: true; reason: string }
  | { ok: false; skipped: false; error: string };

/**
 * Copia o PDF do workflow para o VPS (File Storage Locations por mês, ou caminho explícito).
 * Usado ao «Guardar» o movimento e ao concluir.
 */
export async function copyWorkflowFileToServerMonthFolder(opts: {
  fileServerBaseUrl: string;
  companyId: string;
  movementDate: string;
  fileNameOnDisk: string;
  mimeType: string | null | undefined;
  serverPath: string | null | undefined;
  fileUrl: string | null | undefined;
  /** Para deduplicação com «Concluir» / segundo guardar. */
  workflowFileId?: string | null;
  /**
   * Caminho completo relativo a WORK_FILES_ROOT (ex. `Splendidoption Lda/Work`).
   * Quando definido, ignora `workflow_storage_locations` (pasta do mês).
   */
  serverDestinationOverride?: string | null;
  /**
   * Movimento Draft tipo Documento: ignorar o skip em modo Supabase e enviar mesma assim para o VPS.
   */
  forceServerCopy?: boolean;
}): Promise<SyncWorkflowToServerResult> {
  let workflowUploadTarget: string | undefined;
  try {
    const raw = JSON.parse(localStorage.getItem(TABLE_RELATIONS_KEY) || "{}");
    workflowUploadTarget = raw.workflowUploadTarget;
  } catch {
    workflowUploadTarget = "server";
  }
  if ((workflowUploadTarget ?? "server") === "supabase" && !opts.forceServerCopy) {
    return { ok: false, skipped: true, reason: "Modo Supabase (teste)" };
  }

  let targetFolder = "";

  const override = opts.serverDestinationOverride?.trim().replace(/\\/g, "/").replace(/^\/+|\/+$/g, "") ?? "";
  if (override) {
    targetFolder = override;
  } else {
    const d = new Date(opts.movementDate);
    if (Number.isNaN(d.getTime())) {
      return { ok: false, skipped: true, reason: "Data inválida" };
    }
    const y = d.getFullYear();
    const m = d.getMonth() + 1;

    const { data: loc, error } = await supabase
      .from("workflow_storage_locations")
      .select("server_root, folder_path")
      .eq("company_id", opts.companyId)
      .eq("year", y)
      .eq("month", m)
      .maybeSingle();

    if (error) {
      return { ok: false, skipped: false, error: error.message };
    }
    if (!loc) {
      return {
        ok: false,
        skipped: true,
        reason: `Sem linha File Storage Locations para ${y}-${String(m).padStart(2, "0")}`,
      };
    }

    targetFolder = await resolveArchiveFolderOnDisk(loc, opts.companyId);
    if (!targetFolder) {
      return { ok: false, skipped: true, reason: "Pasta no servidor vazia (File Storage Locations)" };
    }
  }

  const safeNameEarly = safeWorkFilesUploadFileName(opts.fileNameOnDisk || "document.pdf");
  const dedupeKey = `wf:${opts.workflowFileId ?? "na"}:${targetFolder}:${safeNameEarly}`;
  if (shouldSkipDuplicateWorkFilePost(dedupeKey)) {
    return { ok: true, targetFolder };
  }

  let blob: Blob | null = null;

  if (opts.serverPath?.trim()) {
    const u = getWorkFileDownloadUrl(opts.serverPath.trim(), opts.fileServerBaseUrl);
    const abs = u.startsWith("http") ? u : `${typeof window !== "undefined" ? window.location.origin : ""}${u.startsWith("/") ? u : `/${u}`}`;
    try {
      const resp = await fetch(abs, { credentials: "include" });
      if (resp.ok) blob = await resp.blob();
    } catch {
      /* ignore */
    }
  }

  if (!blob && opts.fileUrl?.trim()) {
    try {
      const parsed = parseSupabaseStorageLooseRef(opts.fileUrl);
      if (parsed) {
        const { data, error: downloadError } = await supabase.storage
          .from(parsed.bucket)
          .download(parsed.filePath);
        if (!downloadError && data) blob = data;
      }
    } catch {
      /* ignore */
    }
  }

  if (!blob && opts.fileUrl?.trim()) {
    try {
      const abs = resolvePublicFileFetchUrl(opts.fileUrl);
      if (abs) {
        const resp = await fetch(abs, { credentials: "include" });
        if (resp.ok) blob = await resp.blob();
      }
    } catch {
      /* ignore */
    }
  }

  if (!blob) {
    return { ok: false, skipped: false, error: "Não foi possível ler o ficheiro para copiar ao servidor" };
  }

  const params = new URLSearchParams({
    folder: targetFolder,
    filename: safeNameEarly,
  });
  const uploadUrl = getWorkFilesUploadUrl(opts.fileServerBaseUrl, params);
  const resp = await fetch(uploadUrl, {
    method: "POST",
    headers: { "Content-Type": opts.mimeType || "application/pdf" },
    body: blob,
    credentials: opts.fileServerBaseUrl?.trim() ? "include" : "same-origin",
  });

  if (!resp.ok) {
    const detail = await resp.text().catch(() => "");
    return {
      ok: false,
      skipped: false,
      error: `Upload falhou (${resp.status}): ${detail.slice(0, 200)}`,
    };
  }

  recordSuccessfulWorkFilePost(dedupeKey);
  return { ok: true, targetFolder };
}

