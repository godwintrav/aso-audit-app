import { Global, Module } from "@nestjs/common";
import { APP_CONFIG } from "../config/config.module";
import type { AppConfig } from "../config/configuration";
import { AuditCacheService } from "./audit-cache.service";
import { CACHE_STORE, type ICacheStore, InMemoryCacheStore } from "./cache-store";

/**
 * Global caching module. Binds the cache store interface to the in-memory
 * implementation (configured from validated env) and exposes the typed
 * `AuditCacheService`. Swapping to Redis later is a one-line change here.
 */
@Global()
@Module({
  providers: [
    {
      provide: CACHE_STORE,
      inject: [APP_CONFIG],
      useFactory: (config: AppConfig): ICacheStore =>
        new InMemoryCacheStore({ maxEntries: config.cacheMaxEntries }),
    },
    AuditCacheService,
  ],
  exports: [CACHE_STORE, AuditCacheService],
})
export class CacheModule {}
