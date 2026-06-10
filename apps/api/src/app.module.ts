import { Module } from "@nestjs/common";
import { APP_GUARD } from "@nestjs/core";
import { ThrottlerGuard, ThrottlerModule } from "@nestjs/throttler";
import { AppStoreModule } from "./appstore/appstore.module";
import { AuditModule } from "./audit/audit.module";
import { CacheModule } from "./cache/cache.module";
import { APP_CONFIG, ConfigModule } from "./config/config.module";
import type { AppConfig } from "./config/configuration";
import { ConversationsModule } from "./conversations/conversations.module";

@Module({
  imports: [
    ConfigModule,
    CacheModule,
    ThrottlerModule.forRootAsync({
      inject: [APP_CONFIG],
      useFactory: (config: AppConfig) => ({
        throttlers: [{ ttl: config.rateLimitTtlMs, limit: config.rateLimitMax }],
      }),
    }),
    ConversationsModule,
    AppStoreModule,
    AuditModule,
  ],
  providers: [{ provide: APP_GUARD, useClass: ThrottlerGuard }],
})
export class AppModule {}
