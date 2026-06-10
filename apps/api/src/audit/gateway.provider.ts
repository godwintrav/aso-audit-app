import type { Provider } from "@nestjs/common";
import { type AnalysisGateway, OpenAIAnalysisGateway } from "@aso/agents";
import { APP_CONFIG } from "../config/config.module";
import type { AppConfig } from "../config/configuration";

export const ANALYSIS_GATEWAY = Symbol("ANALYSIS_GATEWAY");

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
