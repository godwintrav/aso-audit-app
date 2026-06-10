import { randomUUID } from "node:crypto";
import { Inject, Injectable, Logger } from "@nestjs/common";
import type { AnalysisGateway } from "@aso/agents";
import { AUDIT_STAGES, parseAppStoreUrl, STAGE_LABELS } from "@aso/core";
import {
  type AppListing,
  AppListingSchema,
  type AuditPreview,
  type AuditProgressEvent,
  type AuditRecord,
  type AuditReport,
  type AuditStage,
} from "@aso/schemas";
import { type ProgressStatus, runAudit } from "@aso/workflows";
import { AppStoreService } from "../appstore/app-store.service";
import { AuditCacheService } from "../cache/audit-cache.service";
import { ConversationService } from "../conversations/conversation.service";
import { AuditEventsService } from "./audit-events.service";
import { AUDIT_STORE, type IAuditStore } from "./audit.store";
import { ANALYSIS_GATEWAY } from "./gateway.provider";

export interface PreviewResult {
  preview: AuditPreview;
  cached: boolean;
}

@Injectable()
export class AuditService {
  private readonly logger = new Logger(AuditService.name);

  constructor(
    private readonly appStore: AppStoreService,
    private readonly events: AuditEventsService,
    private readonly cache: AuditCacheService,
    private readonly conversations: ConversationService,
    @Inject(AUDIT_STORE) private readonly store: IAuditStore,
    @Inject(ANALYSIS_GATEWAY) private readonly gateway: AnalysisGateway,
  ) {}

  async preview(url: string, refresh = false): Promise<PreviewResult> {
    const cached = refresh ? undefined : this.cache.getPreview(url);
    if (cached) return { preview: cached, cached: true };

    const preview = await this.appStore.getPreview(url);
    this.cache.setPreview(url, preview);
    return { preview, cached: false };
  }

  startRun(url: string, refresh = false, sessionId = "anonymous"): AuditRecord {
    if (refresh) this.cache.invalidate(url);

    const now = new Date().toISOString();
    const record: AuditRecord = {
      auditId: randomUUID(),
      status: "running",
      preview: null,
      progress: [],
      report: null,
      error: null,
      createdAt: now,
      updatedAt: now,
    };
    this.store.create(record);
    this.conversations.create({ id: record.auditId, sessionId, url });

    void this.runPipeline(record.auditId, url);
    return record;
  }

  getRecord(auditId: string): AuditRecord | undefined {
    return this.store.get(auditId);
  }

  streamFor(auditId: string) {
    return this.events.stream(auditId);
  }

  private async runPipeline(auditId: string, url: string): Promise<void> {
    try {
      const cachedReport = this.cache.getReport(url);
      if (cachedReport) {
        this.completeFromCache(auditId, url, cachedReport);
        return;
      }

      this.publish(auditId, "acquire_metadata", "started");

      const listing = await this.cache.getOrCompute(
        "listing",
        url,
        AppListingSchema,
        () => this.appStore.getListing(url),
      );
      const preview = this.previewFromListing(listing);
      this.store.update(auditId, { preview });
      this.conversations.attachPreview(auditId, preview);
      this.publish(auditId, "acquire_metadata", "completed");

      const report = await runAudit({
        listing,
        gateway: this.gateway,
        emit: (stage, status, message) => this.publish(auditId, stage, status, message),
      });

      this.cache.setReport(url, report);
      this.store.update(auditId, { status: "completed", report });
      this.conversations.complete(auditId, report);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      this.logger.error(`Audit ${auditId} failed: ${message}`);
      this.store.update(auditId, { status: "failed", error: message });
      this.conversations.fail(auditId, message);
      this.publish(auditId, "acquire_metadata", "failed", message);
    } finally {
      this.events.complete(auditId);
    }
  }

  private completeFromCache(auditId: string, url: string, report: AuditReport): void {
    const preview = this.previewFromReport(url, report);
    this.store.update(auditId, { preview });
    this.conversations.attachPreview(auditId, preview);
    for (const stage of AUDIT_STAGES) {
      this.publish(auditId, stage, "completed", "Served from cache");
    }
    this.store.update(auditId, { status: "completed", report });
    this.conversations.complete(auditId, report);
  }

  private previewFromListing(listing: AppListing): AuditPreview {
    return {
      appId: listing.appId,
      country: listing.country,
      url: listing.url,
      title: listing.title,
      developer: listing.developer,
      category: listing.category,
      iconUrl: listing.iconUrl,
    };
  }

  private previewFromReport(url: string, report: AuditReport): AuditPreview {
    const { country, url: canonicalUrl } = parseAppStoreUrl(url);
    return {
      appId: report.app.appId,
      country,
      url: canonicalUrl,
      title: report.app.title,
      developer: report.app.developer,
      category: report.app.category,
      iconUrl: report.app.iconUrl,
    };
  }

  private publish(
    auditId: string,
    stage: AuditStage,
    status: ProgressStatus,
    message?: string,
  ): void {
    const event: AuditProgressEvent = {
      auditId,
      stage,
      label: STAGE_LABELS[stage],
      status,
      message,
      at: new Date().toISOString(),
    };
    const record = this.store.get(auditId);
    if (record) {
      this.store.update(auditId, { progress: [...record.progress, event] });
    }
    this.events.publish(event);
  }
}
