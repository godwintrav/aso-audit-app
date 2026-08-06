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


/**
 * Probes the API health endpoint. Never throws: a cold host (Render free tier
 * spins the service down when idle) answers with a network error, a gateway
 * error or nothing at all, and all of those mean the same thing — not up yet.
 */
export async function checkHealth(timeoutMs: number): Promise<boolean> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(`${BASE}/healthz`, {
      signal: controller.signal,
      cache: "no-store",
    });
    return res.ok;
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
