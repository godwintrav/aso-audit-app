import "reflect-metadata";
import { Logger } from "@nestjs/common";
import { NestFactory } from "@nestjs/core";
import { AppModule } from "./app.module";
import { APP_CONFIG } from "./config/config.module";
import type { AppConfig } from "./config/configuration";
import { DomainExceptionFilter } from "./common/domain-exception.filter";

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule, { bufferLogs: false });
  const config = app.get<AppConfig>(APP_CONFIG);

  app.enableCors({ origin: config.webOrigins, credentials: true });
  app.useGlobalFilters(new DomainExceptionFilter());
  app.enableShutdownHooks();

  await app.listen(config.port);
  new Logger("Bootstrap").log(`ASO Audit API listening on http://localhost:${config.port}`);
}

void bootstrap();
