/** How long to leave the wake request open before abandoning the socket. */
const WAKE_TIMEOUT_MS = 90_000;

/**
 * Runs once when the Next server process starts, before it serves a request.
 *
 * The web app and the API hibernate independently on Render, and a request to
 * a sleeping instance is itself the wake trigger: the platform holds the
 * connection for the ~43s the API needs to boot, then answers it. Starting
 * that wake here overlaps the API's boot with the rest of this instance's
 * startup and with the user's first page load, rather than beginning only once
 * the browser gets far enough to probe.
 *
 * Safe to overlap with the browser's own probe: concurrent wake requests are
 * all held and answered by the same boot, so this costs nothing against
 * Render's limit on how often a hibernating service may be woken.
 */
export async function register(): Promise<void> {
  // The same module is evaluated for the edge runtime, which has no business
  // opening a 90s connection on startup.
  if (process.env.NEXT_RUNTIME !== "nodejs") return;

  const api = process.env.NEXT_PUBLIC_API_URL;
  if (!api) return;

  const startedAt = Date.now();

  // Deliberately not awaited: the server must start serving immediately, and
  // the wake is useful precisely because it runs in the background.
  void fetch(`${api}/healthz`, {
    cache: "no-store",
    signal: AbortSignal.timeout(WAKE_TIMEOUT_MS),
  })
    .then((res) => {
      const seconds = ((Date.now() - startedAt) / 1_000).toFixed(1);
      console.log(`[wake] API responded ${res.status} after ${seconds}s`);
    })
    .catch((error: unknown) => {
      // A failure here costs nothing — the browser probe still wakes the API.
      const reason = error instanceof Error ? error.message : String(error);
      console.warn(`[wake] API wake-up request failed: ${reason}`);
    });
}
