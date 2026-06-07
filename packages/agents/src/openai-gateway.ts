import { createOpenAI, type OpenAIProvider } from "@ai-sdk/openai";
import { generateObject, type ModelMessage } from "ai";
import type { AnalysisGateway, GenerateStructuredInput } from "./gateway";

export interface OpenAIGatewayConfig {
  apiKey: string;
  /** Model used for text analyses. Defaults to gpt-4o. */
  textModel?: string;
  /** Model used for vision analyses. Defaults to gpt-4o. */
  visionModel?: string;
  /**
   * Retries per structured-output call. Covers both transient OpenAI errors
   * and the occasional schema-invalid response (the AI SDK re-asks the model).
   * Defaults to 3.
   */
  maxRetries?: number;
}

/**
 * Production gateway backed by OpenAI via the Vercel AI SDK. Uses
 * `generateObject` so the model is constrained to the provided Zod schema and
 * the result is validated before it is returned — never raw model output.
 */
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

    // `generateObject`'s own `maxRetries` only covers transient transport
    // errors (429/5xx/timeout). It does NOT re-ask the model when the response
    // fails schema validation — common for heavy schemas (recommendations) on
    // data-sparse apps. So we additionally re-generate on validation failures.
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
