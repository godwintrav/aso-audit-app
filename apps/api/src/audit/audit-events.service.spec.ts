import type { AuditProgressEvent } from "@aso/schemas";
import { firstValueFrom, toArray } from "rxjs";
import { describe, expect, it } from "vitest";
import { AuditEventsService } from "./audit-events.service";

function event(overrides: Partial<AuditProgressEvent> = {}): AuditProgressEvent {
  return {
    auditId: "audit-1",
    stage: "acquire_metadata",
    label: "Fetching app metadata",
    status: "started",
    at: "2026-06-12T00:00:00.000Z",
    ...overrides,
  };
}

describe("AuditEventsService", () => {
  it("replays buffered events to a late subscriber", async () => {
    const service = new AuditEventsService();
    service.publish(event({ status: "started" }));
    service.publish(event({ status: "completed" }));
    service.complete("audit-1");

    const events = await firstValueFrom(service.stream("audit-1").pipe(toArray()));
    expect(events.map((e) => e.status)).toEqual(["started", "completed"]);
  });

  it("delivers events published after subscription", async () => {
    const service = new AuditEventsService();
    const collected = firstValueFrom(service.stream("audit-2").pipe(toArray()));
    service.publish(event({ auditId: "audit-2" }));
    service.complete("audit-2");
    expect(await collected).toHaveLength(1);
  });

  it("keeps streams for different audits isolated", async () => {
    const service = new AuditEventsService();
    service.publish(event({ auditId: "a" }));
    service.publish(event({ auditId: "b" }));
    service.complete("a");
    const aEvents = await firstValueFrom(service.stream("a").pipe(toArray()));
    expect(aEvents).toHaveLength(1);
    expect(aEvents[0].auditId).toBe("a");
  });

  it("does not throw when completing an audit that was never published to", () => {
    const service = new AuditEventsService();
    expect(() => service.complete("never")).not.toThrow();
  });
});
