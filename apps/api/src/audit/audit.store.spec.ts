import type { AuditRecord } from "@aso/schemas";
import { describe, expect, it } from "vitest";
import { InMemoryAuditStore } from "./audit.store";

function record(overrides: Partial<AuditRecord> = {}): AuditRecord {
  return {
    auditId: "audit-1",
    status: "pending",
    preview: null,
    progress: [],
    report: null,
    error: null,
    createdAt: "2026-06-12T00:00:00.000Z",
    updatedAt: "2026-06-12T00:00:00.000Z",
    ...overrides,
  };
}

describe("InMemoryAuditStore", () => {
  it("stores and retrieves a record by id", () => {
    const store = new InMemoryAuditStore();
    const rec = record();
    store.create(rec);
    expect(store.get("audit-1")).toEqual(rec);
  });

  it("returns undefined for an unknown id", () => {
    expect(new InMemoryAuditStore().get("missing")).toBeUndefined();
  });

  it("applies a patch and refreshes updatedAt on update", () => {
    const store = new InMemoryAuditStore();
    store.create(record());
    const updated = store.update("audit-1", { status: "completed", error: "none" });
    expect(updated?.status).toBe("completed");
    expect(updated?.error).toBe("none");
    expect(updated?.updatedAt).not.toBe("2026-06-12T00:00:00.000Z");
    expect(store.get("audit-1")?.status).toBe("completed");
  });

  it("returns undefined when updating a record that does not exist", () => {
    expect(new InMemoryAuditStore().update("missing", { status: "failed" })).toBeUndefined();
  });

  it("overwrites an existing record when create is called with the same id", () => {
    const store = new InMemoryAuditStore();
    store.create(record({ status: "pending" }));
    store.create(record({ status: "running" }));
    expect(store.get("audit-1")?.status).toBe("running");
  });
});
