import { existsSync, mkdirSync, readFileSync } from "node:fs";
import { rename, writeFile } from "node:fs/promises";
import { dirname } from "node:path";
import { Logger } from "@nestjs/common";
import { type Conversation, ConversationSchema } from "@aso/schemas";

export interface IConversationStore {
  list(sessionId: string): Conversation[];
  get(id: string): Conversation | undefined;
  upsert(conversation: Conversation): void;
  delete(id: string): void;
}

export const CONVERSATION_STORE = Symbol("CONVERSATION_STORE");

function byNewest(a: Conversation, b: Conversation): number {
  return b.createdAt.localeCompare(a.createdAt);
}

abstract class BaseConversationStore implements IConversationStore {
  protected readonly conversations = new Map<string, Conversation>();
  constructor(protected readonly maxPerSession: number) {}

  list(sessionId: string): Conversation[] {
    return [...this.conversations.values()]
      .filter((c) => c.sessionId === sessionId)
      .sort(byNewest);
  }

  get(id: string): Conversation | undefined {
    return this.conversations.get(id);
  }

  upsert(conversation: Conversation): void {
    this.conversations.set(conversation.id, conversation);
    this.evict(conversation.sessionId);
    this.persist();
  }

  delete(id: string): void {
    if (this.conversations.delete(id)) this.persist();
  }

  private evict(sessionId: string): void {
    const owned = this.list(sessionId);
    for (const stale of owned.slice(this.maxPerSession)) {
      this.conversations.delete(stale.id);
    }
  }

  protected persist(): void {}
}

export class InMemoryConversationStore extends BaseConversationStore {}

export class JsonFileConversationStore extends BaseConversationStore {
  private readonly logger = new Logger(JsonFileConversationStore.name);
  private writeChain: Promise<void> = Promise.resolve();

  constructor(
    private readonly filePath: string,
    maxPerSession: number,
  ) {
    super(maxPerSession);
    this.load();
  }

  private load(): void {
    if (!existsSync(this.filePath)) return;
    try {
      const raw = JSON.parse(readFileSync(this.filePath, "utf8")) as unknown[];
      let skipped = 0;
      for (const row of Array.isArray(raw) ? raw : []) {
        const parsed = ConversationSchema.safeParse(row);
        if (parsed.success) this.conversations.set(parsed.data.id, parsed.data);
        else skipped += 1;
      }
      this.logger.log(
        `Loaded ${this.conversations.size} conversation(s) from ${this.filePath}` +
          (skipped ? ` (skipped ${skipped} invalid)` : ""),
      );
    } catch (error) {
      this.logger.warn(
        `Could not read ${this.filePath}; starting empty: ${
          error instanceof Error ? error.message : error
        }`,
      );
    }
  }

  protected override persist(): void {
    const snapshot = JSON.stringify([...this.conversations.values()], null, 2);
    this.writeChain = this.writeChain
      .then(async () => {
        mkdirSync(dirname(this.filePath), { recursive: true });
        const tmp = `${this.filePath}.${process.pid}.tmp`;
        await writeFile(tmp, snapshot, "utf8");
        await rename(tmp, this.filePath);
      })
      .catch((error) => {
        this.logger.error(
          `Failed to persist conversations: ${error instanceof Error ? error.message : error}`,
        );
      });
  }

  flush(): Promise<void> {
    return this.writeChain;
  }
}
