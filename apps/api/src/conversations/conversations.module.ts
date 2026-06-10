import { Module } from "@nestjs/common";
import { APP_CONFIG } from "../config/config.module";
import type { AppConfig } from "../config/configuration";
import { ConversationService } from "./conversation.service";
import {
  CONVERSATION_STORE,
  type IConversationStore,
  InMemoryConversationStore,
  JsonFileConversationStore,
} from "./conversation.store";
import { ConversationsController } from "./conversations.controller";

@Module({
  controllers: [ConversationsController],
  providers: [
    ConversationService,
    {
      provide: CONVERSATION_STORE,
      inject: [APP_CONFIG],
      useFactory: (config: AppConfig): IConversationStore =>
        config.historyPersistence === "memory"
          ? new InMemoryConversationStore(config.conversationsMaxPerSession)
          : new JsonFileConversationStore(
              config.conversationsFile,
              config.conversationsMaxPerSession,
            ),
    },
  ],
  exports: [ConversationService],
})
export class ConversationsModule {}
