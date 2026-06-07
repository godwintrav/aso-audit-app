import { mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import type { Conversation } from "@aso/schemas";
import { afterEach, describe, expect, it } from "vitest";
import {
  InMemoryConversationStore,
  JsonFileConversationStore,
} from "./conversation.store";

let counter = 0;
function tempFile(): string {
  const dir = mkdtempSync(join(tmpdir(), "aso-conv-"));
  return join(dir, `conversations-${counter++}.json`);
}

function convo(overrides: Partial<Conversation> = {}): Conversation {
  const now = new Date().toISOString();
  return {
    id: `id-${Math.random().toString(36).slice(2)}`,
    sessionId: "s1",
    url: "https://apps.apple.com/us/app/x/id1",
    title: "App",
    status: "completed",
    preview: null,
    report: null,
    error: null,
    createdAt: now,
    updatedAt: now,
    ...overrides,
  };
}

describe("InMemoryConversationStore", () => {
  it("scopes list() by session and orders newest-first", () => {
    const store = new InMemoryConversationStore(50);
    store.upsert(convo({ id: "a", sessionId: "s1", createdAt: "2024-01-01T00:00:00.000Z" }));
    store.upsert(convo({ id: "b", sessionId: "s1", createdAt: "2024-02-01T00:00:00.000Z" }));
    store.upsert(convo({ id: "c", sessionId: "s2" }));

    const s1 = store.list("s1");
    expect(s1.map((c) => c.id)).toEqual(["b", "a"]); // newest first
    expect(store.list("s2").map((c) => c.id)).toEqual(["c"]);
  });

  it("evicts the oldest beyond maxPerSession", () => {
    const store = new InMemoryConversationStore(2);
    store.upsert(convo({ id: "a", createdAt: "2024-01-01T00:00:00.000Z" }));
    store.upsert(convo({ id: "b", createdAt: "2024-02-01T00:00:00.000Z" }));
    store.upsert(convo({ id: "c", createdAt: "2024-03-01T00:00:00.000Z" }));
    expect(store.list("s1").map((c) => c.id)).toEqual(["c", "b"]); // "a" evicted
  });
});

describe("JsonFileConversationStore", () => {
  const flushers: JsonFileConversationStore[] = [];
  afterEach(async () => {
    await Promise.all(flushers.map((s) => s.flush()));
    flushers.length = 0;
  });

  it("persists to disk and reloads in a fresh instance (survives restart)", async () => {
    const file = tempFile();
    const a = new JsonFileConversationStore(file, 50);
    flushers.push(a);
    a.upsert(convo({ id: "x", title: "Persisted", sessionId: "s1" }));
    await a.flush();

    const b = new JsonFileConversationStore(file, 50);
    expect(b.get("x")?.title).toBe("Persisted");
    expect(b.list("s1")).toHaveLength(1);
  });

  it("writes an atomic, well-formed JSON array", async () => {
    const file = tempFile();
    const store = new JsonFileConversationStore(file, 50);
    flushers.push(store);
    store.upsert(convo({ id: "x" }));
    await store.flush();
    const parsed = JSON.parse(readFileSync(file, "utf8"));
    expect(Array.isArray(parsed)).toBe(true);
    expect(parsed[0].id).toBe("x");
  });

  it("skips corrupt rows on load", () => {
    const file = tempFile();
    writeFileSync(
      file,
      JSON.stringify([convo({ id: "good" }), { id: "bad", nope: true }]),
      "utf8",
    );
    const store = new JsonFileConversationStore(file, 50);
    expect(store.get("good")).toBeDefined();
    expect(store.get("bad")).toBeUndefined();
  });

  it("deletes and persists the removal", async () => {
    const file = tempFile();
    const store = new JsonFileConversationStore(file, 50);
    flushers.push(store);
    store.upsert(convo({ id: "x" }));
    store.delete("x");
    await store.flush();
    expect(new JsonFileConversationStore(file, 50).get("x")).toBeUndefined();
  });
});
