import type { Provider } from "@nestjs/common";
import { type AnalysisGateway, OpenAIAnalysisGateway } from "@aso/agents";
import { APP_CONFIG } from "../config/config.module";
import type { AppConfig } from "../config/configuration";

/** DI token for the AnalysisGateway (the swappable LLM dependency). */
export const ANALYSIS_GATEWAY = Symbol("ANALYSIS_GATEWAY");

/**
 * Binds the AnalysisGateway interface to the OpenAI implementation, configured
 * from validated env. Swapping to the stub gateway (tests) or another provider
 * is a one-line change here — nothing else in the app depends on the concrete type.
 */
export const analysisGatewayProvider: Provider = {
  provide: ANALYSIS_GATEWAY,
  inject: [APP_CONFIG],
  useFactory: (config: AppConfig): AnalysisGateway =>
    new OpenAIAnalysisGateway({
      apiKey: config.openaiApiKey,
      textModel: config.textModel,
      visionModel: config.visionModel,
    }),
};
