import type {
  AuditPreview,
  AuditProgressEvent,
  AuditRecord,
  Conversation,
  ConversationSummary,
} from "@aso/schemas";
import { getSessionId } from "./session";

const BASE = "/api";

/**
 * The health probe is the one call that bypasses the proxy and talks to the API
 * origin directly.
 *
 * A request to a hibernating instance is what wakes it, and Render refuses wake
 * requests arriving from the web service's own egress. Measured at the same
 * moment against the same sleeping instance: through the proxy it returned
 * `429 x-render-routing: hibernate-rate-limited` in 0.66s and never woke,
 * while the identical request straight from a browser was held for 63.7s and
 * woke it. Only a request from the user's own address reliably wakes the API.
 *
 * Every other call stays proxied: once the API is awake the proxy is fine
 * (1.5s), and same-origin requests avoid preflighting the session header.
 */
const HEALTH_URL = process.env.NEXT_PUBLIC_API_URL
  ? `${process.env.NEXT_PUBLIC_API_URL}/healthz`
  : `${BASE}/healthz`;

function headers(extra?: Record<string, string>): HeadersInit {
  return { "X-Session-Id": getSessionId(), ...extra };
}

async function postJson<T>(path: string, body: unknown): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    method: "POST",
    headers: headers({ "Content-Type": "application/json" }),
    body: JSON.stringify(body),
  });
  if (res.status === 429) throw new Error(rateLimitMessage(res));
  if (!res.ok) {
    const detail = await res.json().catch(() => ({}));
    throw new Error((detail as { message?: string }).message ?? `Request failed (${res.status})`);
  }
  return res.json() as Promise<T>;
}

/** Reads `Retry-After` (delta-seconds form) as milliseconds, if present. */
function retryAfterMs(res: Response): number | undefined {
  const seconds = Number(res.headers.get("retry-after"));
  return Number.isFinite(seconds) && seconds > 0 ? seconds * 1_000 : undefined;
}

/** Turns a throttled response into something a user can act on. */
function rateLimitMessage(res: Response): string {
  const delay = retryAfterMs(res);
  return delay
    ? `Too many audits in a short time. Try again in ${Math.ceil(delay / 1_000)}s.`
    : "Too many audits in a short time. Try again in a moment.";
}

async function getJson<T>(path: string): Promise<T> {
  const res = await fetch(`${BASE}${path}`, { headers: headers() });
  if (!res.ok) throw new Error(`Request failed (${res.status})`);
  return res.json() as Promise<T>;
}


/**
 * Probes the API health endpoint, reporting whether it is serving. Never
 * throws — every failure shape means the same thing to the caller: not up yet.
 *
 * A request to a hibernating Render instance is itself the wake trigger: the
 * platform holds the connection open until the app boots (42.6s to 63.7s
 * measured on this service) and then answers. The caller must therefore allow
 * a timeout longer than a whole cold start.
 *
 * Success is confirmed against the controller's own contract rather than
 * `res.ok`, so only the app itself can report the app as healthy.
 */
export async function probeHealth(timeoutMs: number): Promise<boolean> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(HEALTH_URL, {
      signal: controller.signal,
      cache: "no-store",
    });
    if (!res.ok) return false;

    const body = (await res.json().catch(() => null)) as { status?: string } | null;
    return body?.status === "ok";
  } catch {
    return false;
  } finally {
    clearTimeout(timer);
  }
}

export function previewApp(url: string): Promise<AuditPreview> {
  return postJson<AuditPreview>("/audit/preview", { url });
}

export function startAudit(url: string): Promise<{ auditId: string }> {
  return postJson<{ auditId: string }>("/audit/run", { url });
}

export function getAudit(auditId: string): Promise<AuditRecord> {
  return getJson<AuditRecord>(`/audit/${auditId}`);
}

export function streamAudit(
  auditId: string,
  handlers: {
    onEvent: (event: AuditProgressEvent) => void;
    onError?: () => void;
  },
): () => void {
  const source = new EventSource(`${BASE}/audit/${auditId}/stream`);
  source.onmessage = (msg) => {
    try {
      handlers.onEvent(JSON.parse(msg.data) as AuditProgressEvent);
    } catch {
    }
  };
  source.onerror = () => handlers.onError?.();
  return () => source.close();
}


export function getConversations(): Promise<ConversationSummary[]> {
  return getJson<ConversationSummary[]>("/conversations");
}

export function getConversation(id: string): Promise<Conversation> {
  return getJson<Conversation>(`/conversations/${id}`);
}

export async function deleteConversation(id: string): Promise<void> {
  const res = await fetch(`${BASE}/conversations/${id}`, {
    method: "DELETE",
    headers: headers(),
  });
  if (!res.ok && res.status !== 204) {
    throw new Error(`Could not delete conversation (${res.status})`);
  }
}
