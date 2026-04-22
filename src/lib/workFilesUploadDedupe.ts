/** Evita POST duplicado ao mesmo destino (ex.: guardar + concluir, ou double-submit). */
const recent = new Map<string, number>();
const MAX_KEYS = 400;
const DEFAULT_WINDOW_MS = 15_000;

function prune(now: number, windowMs: number) {
  for (const [k, t] of recent) {
    if (now - t > windowMs) recent.delete(k);
  }
}

/** true = omitir este upload (há um igual há menos de `windowMs`). */
export function shouldSkipDuplicateWorkFilePost(key: string, windowMs = DEFAULT_WINDOW_MS): boolean {
  const now = Date.now();
  prune(now, windowMs);
  const prev = recent.get(key);
  return prev != null && now - prev < windowMs;
}

/** Chamar só depois de resposta HTTP OK do /api/work-files/upload. */
export function recordSuccessfulWorkFilePost(key: string) {
  const now = Date.now();
  if (recent.size >= MAX_KEYS) {
    const first = recent.keys().next().value;
    if (first) recent.delete(first);
  }
  recent.set(key, now);
}
