const SESSION_KEY = "aso_session_id";

/**
 * Returns a stable anonymous session id for this browser, creating one on first
 * use. It scopes the user's audit history server-side (sent as X-Session-Id) and
 * maps cleanly to a real user id once accounts exist. SSR-safe (returns "" on the
 * server; callers run it in effects/handlers).
 */
export function getSessionId(): string {
  if (typeof window === "undefined") return "";
  let id = window.localStorage.getItem(SESSION_KEY);
  if (!id) {
    id = crypto.randomUUID();
    window.localStorage.setItem(SESSION_KEY, id);
  }
  return id;
}
