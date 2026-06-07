import type { z } from "zod";

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

export interface AnalysisGateway {
  generateStructured<T>(input: GenerateStructuredInput<T>): Promise<T>;
}
