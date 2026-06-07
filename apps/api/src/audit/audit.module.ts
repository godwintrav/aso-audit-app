import { Module } from "@nestjs/common";
import { AppStoreModule } from "../appstore/appstore.module";
import { ConversationsModule } from "../conversations/conversations.module";
import { AuditController } from "./audit.controller";
import { AuditEventsService } from "./audit-events.service";
import { AuditService } from "./audit.service";
import { AUDIT_STORE, InMemoryAuditStore } from "./audit.store";
import { analysisGatewayProvider } from "./gateway.provider";

@Module({
  imports: [AppStoreModule, ConversationsModule],
  controllers: [AuditController],
  providers: [
    AuditService,
    AuditEventsService,
    analysisGatewayProvider,
    { provide: AUDIT_STORE, useClass: InMemoryAuditStore },
  ],
})
export class AuditModule {}
