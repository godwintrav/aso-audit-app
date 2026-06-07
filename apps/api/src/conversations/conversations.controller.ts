import {
  Controller,
  Delete,
  Get,
  HttpCode,
  NotFoundException,
  Param,
} from "@nestjs/common";
import { SkipThrottle } from "@nestjs/throttler";
import type { Conversation, ConversationSummary } from "@aso/schemas";
import { z } from "zod";
import { ZodValidationPipe } from "../common/zod-validation.pipe";
import { SessionId } from "../common/session.decorator";
import { ConversationService } from "./conversation.service";

const ConversationIdSchema = z.string().uuid("Invalid conversation id");

/** Audit history ("previous chats"), scoped to the caller's anonymous session. */
@SkipThrottle()
@Controller("conversations")
export class ConversationsController {
  constructor(private readonly conversations: ConversationService) {}

  /** List the session's past audits (newest first) for the sidebar. */
  @Get()
  list(@SessionId() sessionId: string): ConversationSummary[] {
    return this.conversations.list(sessionId);
  }

  /** Fetch one full conversation to re-render its report (no re-run). */
  @Get(":id")
  get(
    @Param("id", new ZodValidationPipe(ConversationIdSchema)) id: string,
    @SessionId() sessionId: string,
  ): Conversation {
    const conversation = this.conversations.get(id, sessionId);
    if (!conversation) throw new NotFoundException(`No conversation found with id ${id}`);
    return conversation;
  }

  @Delete(":id")
  @HttpCode(204)
  remove(
    @Param("id", new ZodValidationPipe(ConversationIdSchema)) id: string,
    @SessionId() sessionId: string,
  ): void {
    if (!this.conversations.remove(id, sessionId)) {
      throw new NotFoundException(`No conversation found with id ${id}`);
    }
  }
}
