import { Inject, Injectable, Logger } from "@nestjs/common";
import {
  type AuditPreview,
  type AuditReport,
  type Conversation,
  ConversationSchema,
  type ConversationSummary,
} from "@aso/schemas";
import { CONVERSATION_STORE, type IConversationStore } from "./conversation.store";

@Injectable()
export class ConversationService {
  private readonly logger = new Logger(ConversationService.name);

  constructor(
    @Inject(CONVERSATION_STORE) private readonly store: IConversationStore,
  ) {}

  create(input: { id: string; sessionId: string; url: string }): Conversation {
    const now = new Date().toISOString();
    return this.save({
      id: input.id,
      sessionId: input.sessionId,
      url: input.url,
      title: "New audit",
      status: "running",
      preview: null,
      report: null,
      error: null,
      createdAt: now,
      updatedAt: now,
    });
  }

  attachPreview(id: string, preview: AuditPreview): void {
    this.patch(id, (c) => ({ ...c, preview, title: preview.title }));
  }

  complete(id: string, report: AuditReport): void {
    this.patch(id, (c) => ({
      ...c,
      status: "completed",
      report,
      title: report.app.title || c.title,
    }));
  }

  fail(id: string, error: string): void {
    this.patch(id, (c) => ({ ...c, status: "failed", error }));
  }

  list(sessionId: string): ConversationSummary[] {
    return this.store.list(sessionId).map((c) => ({
      id: c.id,
      title: c.title,
      status: c.status,
      iconUrl: c.preview?.iconUrl ?? c.report?.app.iconUrl,
      createdAt: c.createdAt,
      updatedAt: c.updatedAt,
    }));
  }

  get(id: string, sessionId: string): Conversation | undefined {
    const conversation = this.store.get(id);
    if (!conversation || conversation.sessionId !== sessionId) return undefined;
    return conversation;
  }

  remove(id: string, sessionId: string): boolean {
    if (!this.get(id, sessionId)) return false;
    this.store.delete(id);
    return true;
  }

  private patch(id: string, update: (c: Conversation) => Conversation): void {
    const existing = this.store.get(id);
    if (!existing) {
      this.logger.warn(`Conversation ${id} not found while updating`);
      return;
    }
    this.save({ ...update(existing), updatedAt: new Date().toISOString() });
  }

  private save(conversation: Conversation): Conversation {
    const validated = ConversationSchema.parse(conversation);
    this.store.upsert(validated);
    return validated;
  }
}
