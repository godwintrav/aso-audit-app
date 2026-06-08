import type {
  AuditPreview,
  AuditProgressEvent,
  AuditRecord,
  Conversation,
  ConversationSummary,
} from "@aso/schemas";
import { getSessionId } from "./session";

/**
 * Typed client for the ASO Audit API. Requests are proxied through Next's
 * /api rewrite to the NestJS backend. Every request carries the anonymous
 * session id so history is scoped per browser. The frontend depends only on
 * the shared domain types — never on backend internals.
 */
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
  if (!res.ok) {
    const detail = await res.json().catch(() => ({}));
    throw new Error((detail as { message?: string }).message ?? `Request failed (${res.status})`);
  }
  return res.json() as Promise<T>;
}

async function getJson<T>(path: string): Promise<T> {
  const res = await fetch(`${BASE}${path}`, { headers: headers() });
  if (!res.ok) throw new Error(`Request failed (${res.status})`);
  return res.json() as Promise<T>;
}

// --- Audit flow ---

export function previewApp(url: string): Promise<AuditPreview> {
  return postJson<AuditPreview>("/audit/preview", { url });
}

export function startAudit(url: string): Promise<{ auditId: string }> {
  return postJson<{ auditId: string }>("/audit/run", { url });
}

export function getAudit(auditId: string): Promise<AuditRecord> {
  return getJson<AuditRecord>(`/audit/${auditId}`);
}

/** Subscribes to the SSE progress stream. Returns an unsubscribe function. */
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
      /* ignore malformed frames */
    }
  };
  source.onerror = () => handlers.onError?.();
  return () => source.close();
}

// --- History ("previous chats") ---

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
