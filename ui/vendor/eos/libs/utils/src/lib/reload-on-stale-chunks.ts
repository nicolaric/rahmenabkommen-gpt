const RELOADED_AT_KEY = 'eos:stale-chunk-reload-at';

// A second failure this soon after a reload is a real outage, not a stale tab;
// reloading again would only loop.
const RELOAD_COOLDOWN_MS = 30_000;

/**
 * Reload the page once when a lazy chunk or its CSS fails to load.
 *
 * Asset names are content-hashed and a deploy removes the old ones, so a tab
 * opened before the deploy asks for files that no longer exist the first time
 * it lazy-loads something (e.g. opening the PDF viewer). A reload picks up the
 * new manifest.
 */
export function reloadOnStaleChunks() {
  window.addEventListener('vite:preloadError', (event) => {
    const now = Date.now();
    try {
      const last = Number(sessionStorage.getItem(RELOADED_AT_KEY));
      if (last && now - last < RELOAD_COOLDOWN_MS) return;
      sessionStorage.setItem(RELOADED_AT_KEY, String(now));
    } catch {
      // Without storage there is no loop guard; let the error surface instead.
      return;
    }
    event.preventDefault();
    window.location.reload();
  });
}
