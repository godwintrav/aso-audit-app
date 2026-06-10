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

const ConversationIdSchema = z.uuid("Invalid conversation id");

@SkipThrottle()
@Controller("conversations")
export class ConversationsController {
  constructor(private readonly conversations: ConversationService) {}

  @Get()
  list(@SessionId() sessionId: string): ConversationSummary[] {
    return this.conversations.list(sessionId);
  }

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
