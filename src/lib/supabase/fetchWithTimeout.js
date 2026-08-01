const DEFAULT_TIMEOUT_MS = 8000;

// Supabase uses fetch under the hood. This wrapper prevents a slow or blocked
// network request from hanging the whole page forever during development.
export function fetchWithTimeout(input, init = {}) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), DEFAULT_TIMEOUT_MS);

  // If Supabase already passed in its own abort signal, keep it connected to
  // our controller so either signal can stop the request.
  if (init.signal) {
    if (init.signal.aborted) {
      controller.abort();
    } else {
      init.signal.addEventListener("abort", () => controller.abort(), {
        once: true,
      });
    }
  }

  return fetch(input, {
    ...init,
    signal: controller.signal,
  }).finally(() => clearTimeout(timeoutId));
}
