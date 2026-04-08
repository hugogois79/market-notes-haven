/** Primeiros bytes de um PDF válido (%PDF). */
export async function blobLooksLikePdf(blob: Blob): Promise<boolean> {
  if (blob.size < 4) return false;
  const buf = await blob.slice(0, Math.min(8, blob.size)).arrayBuffer();
  const u = new Uint8Array(buf);
  return u[0] === 0x25 && u[1] === 0x50 && u[2] === 0x44 && u[3] === 0x46;
}

/** Resposta típica de erro HTML/JSON em vez de binário PDF. */
export async function blobLooksLikeNonBinaryDocument(blob: Blob): Promise<boolean> {
  if (blob.size === 0) return true;
  const n = Math.min(blob.size, 512);
  const text = new TextDecoder("utf-8", { fatal: false }).decode(await blob.slice(0, n).arrayBuffer());
  const t = text.trimStart();
  return t.startsWith("<!DOCTYPE") || t.startsWith("<html") || t.startsWith("<HTML") || t.startsWith("<?xml");
}

/** Devolve o blob só se for PDF válido (%PDF); caso contrário null (evita passar HTML ao pdf.js). */
export async function filterPdfBlob(blob: Blob | null): Promise<Blob | null> {
  if (!blob || blob.size === 0) return null;
  if (await blobLooksLikeNonBinaryDocument(blob)) return null;
  if (await blobLooksLikePdf(blob)) return blob;
  return null;
}
