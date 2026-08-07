import "reflect-metadata";
import { Logger } from "@nestjs/common";
import { NestFactory } from "@nestjs/core";
import type { NestExpressApplication } from "@nestjs/platform-express";
import { AppModule } from "./app.module";
import { APP_CONFIG } from "./config/config.module";
import type { AppConfig } from "./config/configuration";
import { DomainExceptionFilter } from "./common/domain-exception.filter";

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create<NestExpressApplication>(AppModule, { bufferLogs: false });
  const config = app.get<AppConfig>(APP_CONFIG);

  // Render terminates TLS at its load balancer, so req.ip is the balancer
  // unless Express is told to read the forwarded-for chain.
  app.set("trust proxy", 1);
  app.enableCors({ origin: config.webOrigins, credentials: true });
  app.useGlobalFilters(new DomainExceptionFilter());
  app.enableShutdownHooks();

  await app.listen(config.port);
  new Logger("Bootstrap").log(`ASO Audit API listening on http://localhost:${config.port}`);
}

void bootstrap();
