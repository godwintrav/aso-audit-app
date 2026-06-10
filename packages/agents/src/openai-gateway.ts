import { createOpenAI, type OpenAIProvider } from "@ai-sdk/openai";
import { generateObject, type ModelMessage } from "ai";
import type { AnalysisGateway, GenerateStructuredInput } from "./gateway";

export interface OpenAIGatewayConfig {
  apiKey: string;
  textModel?: string;
  visionModel?: string;
  maxRetries?: number;
}

export class OpenAIAnalysisGateway implements AnalysisGateway {
  private readonly openai: OpenAIProvider;
  private readonly textModel: string;
  private readonly visionModel: string;
  private readonly maxRetries: number;

  constructor(config: OpenAIGatewayConfig) {
    this.openai = createOpenAI({ apiKey: config.apiKey });
    this.textModel = config.textModel ?? "gpt-4o";
    this.visionModel = config.visionModel ?? "gpt-4o";
    this.maxRetries = config.maxRetries ?? 3;
  }

  async generateStructured<T>(input: GenerateStructuredInput<T>): Promise<T> {
    const hasImages = (input.images?.length ?? 0) > 0;
    const modelId = hasImages ? this.visionModel : this.textModel;

    const messages: ModelMessage[] = [
      {
        role: "user",
        content: [
          { type: "text", text: input.prompt },
          ...(input.images ?? []).map(
            (url) => ({ type: "image" as const, image: new URL(url) }),
          ),
        ],
      },
    ];

    let lastError: unknown;
    for (let attempt = 0; attempt <= this.maxRetries; attempt++) {
      try {
        const { object } = await generateObject({
          model: this.openai(modelId),
          schema: input.schema,
          system: input.system,
          messages,
          maxRetries: 1,
        });
        return object;
      } catch (error) {
        lastError = error;
      }
    }
    throw lastError;
  }
}
