import { Global, Module } from "@nestjs/common";
import { type AppConfig, loadConfig } from "./configuration";

/** DI token for the validated application configuration. */
export const APP_CONFIG = Symbol("APP_CONFIG");

/**
 * Global module that loads and validates configuration once at startup and
 * exposes it under the APP_CONFIG token.
 */
@Global()
@Module({
  providers: [
    {
      provide: APP_CONFIG,
      useFactory: (): AppConfig => loadConfig(),
    },
  ],
  exports: [APP_CONFIG],
})
export class ConfigModule {}
