import { existsSync } from "node:fs";
import { resolve } from "node:path";
import * as dotenv from "dotenv";
import { z } from "zod";


const EnvSchema = z.object({
  OPENAI_API_KEY: z.string().min(1, "OPENAI_API_KEY is required"),
  FIRECRAWL_API_KEY: z.string().min(1, "FIRECRAWL_API_KEY is required"),
  API_PORT: z.coerce
    .number()
    .int()
    .positive()
    .default(process.env.PORT ? Number(process.env.PORT) : 3001),
  WEB_ORIGIN: z.string().default("http://localhost:3000"),
  ASO_TEXT_MODEL: z.string().default("gpt-4o"),
  ASO_VISION_MODEL: z.string().default("gpt-4o"),
  CACHE_ENABLED: z
    .enum(["true", "false"])
    .default("true")
    .transform((v) => v === "true"),
  CACHE_TTL_SECONDS: z.coerce.number().int().positive().default(86_400),
  CACHE_MAX_ENTRIES: z.coerce.number().int().positive().default(500),
  RATE_LIMIT_TTL_SECONDS: z.coerce.number().int().positive().default(60),
  RATE_LIMIT_MAX: z.coerce.number().int().positive().default(10),
  HISTORY_PERSISTENCE: z.enum(["file", "memory"]).default("file"),
  CONVERSATIONS_FILE: z.string().default("./data/conversations.json"),
  CONVERSATIONS_MAX_PER_SESSION: z.coerce.number().int().positive().default(50),
});

export type AppConfig = {
  openaiApiKey: string;
  firecrawlApiKey: string;
  port: number;
  webOrigins: string[];
  textModel: string;
  visionModel: string;
  cacheEnabled: boolean;
  cacheTtlMs: number;
  cacheMaxEntries: number;
  rateLimitTtlMs: number;
  rateLimitMax: number;
  historyPersistence: "file" | "memory";
  conversationsFile: string;
  conversationsMaxPerSession: number;
};

function loadDotEnv(): void {
  const candidates = [
    resolve(process.cwd(), ".env"),
    resolve(process.cwd(), "../../.env"),
    resolve(__dirname, "../../../../.env"),
  ];
  for (const path of candidates) {
    if (existsSync(path)) {
      dotenv.config({ path });
      return;
    }
  }
  dotenv.config();
}

export function loadConfig(): AppConfig {
  loadDotEnv();
  const parsed = EnvSchema.safeParse(process.env);
  if (!parsed.success) {
    const issues = parsed.error.issues
      .map((i) => `  - ${i.path.join(".")}: ${i.message}`)
      .join("\n");
    throw new Error(`Invalid environment configuration:\n${issues}`);
  }
  const env = parsed.data;
  return {
    openaiApiKey: env.OPENAI_API_KEY,
    firecrawlApiKey: env.FIRECRAWL_API_KEY,
    port: env.API_PORT,
    webOrigins: env.WEB_ORIGIN.split(",").map((o) => o.trim()),
    textModel: env.ASO_TEXT_MODEL,
    visionModel: env.ASO_VISION_MODEL,
    cacheEnabled: env.CACHE_ENABLED,
    cacheTtlMs: env.CACHE_TTL_SECONDS * 1000,
    cacheMaxEntries: env.CACHE_MAX_ENTRIES,
    rateLimitTtlMs: env.RATE_LIMIT_TTL_SECONDS * 1000,
    rateLimitMax: env.RATE_LIMIT_MAX,
    historyPersistence: env.HISTORY_PERSISTENCE,
    conversationsFile: resolve(process.cwd(), env.CONVERSATIONS_FILE),
    conversationsMaxPerSession: env.CONVERSATIONS_MAX_PER_SESSION,
  };
}
