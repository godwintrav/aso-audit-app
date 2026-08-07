import type {
  AuditPreview,
  AuditProgressEvent,
  AuditRecord,
  Conversation,
  ConversationSummary,
} from "@aso/schemas";
import { getSessionId } from "./session";

const BASE = "/api";

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


export interface HealthProbe {
  /** True only when the API itself answered — not the platform in front of it. */
  awake: boolean;
  /** Delay the host asked us to wait for, in ms, when it pushed back. */
  retryAfterMs?: number;
  /**
   * The host refused the request outright rather than passing it to the app.
   * Probing harder makes this worse, not better — see {@link probeHealth}.
   */
  rateLimited?: boolean;
}

/**
 * Probes the API health endpoint. Never throws — every failure shape means the
 * same thing to the caller: not up yet.
 *
 * A request to a hibernating Render instance is itself the wake trigger: the
 * platform holds the connection open until the app boots (measured at 42.6s on
 * this service) and then answers normally. But it also rate-limits *how often*
 * you may trigger a wake, answering `429` with `x-render-routing:
 * hibernate-rate-limited` and never waking the instance at all. Retrying
 * quickly is therefore actively counterproductive, which is why that case is
 * reported separately for the caller to back off hard on.
 *
 * Status alone is not sufficient evidence of health either, so success is
 * confirmed against the controller's own contract rather than `res.ok`.
 */
export async function probeHealth(timeoutMs: number): Promise<HealthProbe> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(`${BASE}/healthz`, {
      signal: controller.signal,
      cache: "no-store",
    });

    // `/healthz` is exempt from our own throttler, so a 429 here is the
    // platform refusing to wake the instance — push-back, not proof of life.
    if (res.status === 429) {
      return { awake: false, rateLimited: true, retryAfterMs: retryAfterMs(res) };
    }
    if (!res.ok) return { awake: false };

    const body = (await res.json().catch(() => null)) as { status?: string } | null;
    return { awake: body?.status === "ok" };
  } catch {
    return { awake: false };
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
