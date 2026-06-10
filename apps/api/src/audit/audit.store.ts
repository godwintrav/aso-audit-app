import { Injectable } from "@nestjs/common";
import type { AuditRecord } from "@aso/schemas";

export interface IAuditStore {
  create(record: AuditRecord): void;
  get(auditId: string): AuditRecord | undefined;
  update(auditId: string, patch: Partial<AuditRecord>): AuditRecord | undefined;
}

export const AUDIT_STORE = Symbol("AUDIT_STORE");

@Injectable()
export class InMemoryAuditStore implements IAuditStore {
  private readonly records = new Map<string, AuditRecord>();

  create(record: AuditRecord): void {
    this.records.set(record.auditId, record);
  }

  get(auditId: string): AuditRecord | undefined {
    return this.records.get(auditId);
  }

  update(auditId: string, patch: Partial<AuditRecord>): AuditRecord | undefined {
    const existing = this.records.get(auditId);
    if (!existing) return undefined;
    const updated: AuditRecord = {
      ...existing,
      ...patch,
      updatedAt: new Date().toISOString(),
    };
    this.records.set(auditId, updated);
    return updated;
  }
}
