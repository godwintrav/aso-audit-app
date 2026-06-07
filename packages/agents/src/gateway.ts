import type { z } from "zod";

/**
 * Identifies which analysis is being requested. Real gateways ignore this;
 * test stubs use it to return canned, schema-valid responses.
 */
export type AnalysisKind =
  | "title"
  | "subtitle"
  | "description"
  | "screenshots"
  | "reviews"
  | "competitors"
  | "recommendations";

export interface GenerateStructuredInput<T> {
  kind: AnalysisKind;
  system: string;
  prompt: string;
  schema: z.ZodType<T>;
  /** Image URLs to attach for vision models (screenshot analysis). */
  images?: string[];
}

/**
 * The single seam between the application and the LLM. The rest of the system
 * depends only on this interface, so the model is a swappable, testable
 * dependency — exactly how an unreliable external service should be treated.
 *
 * Implementations MUST return data already validated against `input.schema`.
 */
export interface AnalysisGateway {
  generateStructured<T>(input: GenerateStructuredInput<T>): Promise<T>;
}
