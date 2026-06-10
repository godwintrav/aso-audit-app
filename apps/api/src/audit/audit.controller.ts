import {
  Body,
  Controller,
  Get,
  HttpCode,
  NotFoundException,
  Param,
  Post,
  Res,
  Sse,
} from "@nestjs/common";
import { SkipThrottle } from "@nestjs/throttler";
import type { AuditPreview, AuditProgressEvent, AuditRecord } from "@aso/schemas";
import type { Response } from "express";
import { map, type Observable } from "rxjs";
import { ZodValidationPipe } from "../common/zod-validation.pipe";
import { SessionId } from "../common/session.decorator";
import {
  AuditIdParamSchema,
  type AuditRequest,
  AuditRequestSchema,
} from "./audit.dto";
import { AuditService } from "./audit.service";

interface SseMessage {
  data: AuditProgressEvent;
}

@Controller("audit")
export class AuditController {
  constructor(private readonly audit: AuditService) {}

  @Post("preview")
  @HttpCode(200)
  async preview(
    @Body(new ZodValidationPipe(AuditRequestSchema)) body: AuditRequest,
    @Res({ passthrough: true }) res: Response,
  ): Promise<AuditPreview> {
    const { preview, cached } = await this.audit.preview(body.url, body.refresh);
    res.setHeader("X-Cache", cached ? "HIT" : "MISS");
    return preview;
  }

  @Post("run")
  @HttpCode(202)
  run(
    @Body(new ZodValidationPipe(AuditRequestSchema)) body: AuditRequest,
    @SessionId() sessionId: string,
  ): { auditId: string } {
    const record = this.audit.startRun(body.url, body.refresh, sessionId);
    return { auditId: record.auditId };
  }

  @SkipThrottle()
  @Get(":id")
  get(
    @Param("id", new ZodValidationPipe(AuditIdParamSchema)) id: string,
  ): AuditRecord {
    const record = this.audit.getRecord(id);
    if (!record) throw new NotFoundException(`No audit found with id ${id}`);
    return record;
  }

  @SkipThrottle()
  @Sse(":id/stream")
  stream(
    @Param("id", new ZodValidationPipe(AuditIdParamSchema)) id: string,
  ): Observable<SseMessage> {
    return this.audit.streamFor(id).pipe(map((event) => ({ data: event })));
  }
}
