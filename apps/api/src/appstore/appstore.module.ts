import { Module } from "@nestjs/common";
import { AppleLookupClient } from "./apple-lookup.client";
import { AppStorePageParser } from "./app-store-page.parser";
import { AppStoreService } from "./app-store.service";
import { FirecrawlClient } from "./firecrawl.client";

@Module({
  providers: [
    AppleLookupClient,
    FirecrawlClient,
    AppStorePageParser,
    AppStoreService,
  ],
  exports: [AppStoreService],
})
export class AppStoreModule {}
