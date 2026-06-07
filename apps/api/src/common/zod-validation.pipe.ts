import {
  type ArgumentMetadata,
  BadRequestException,
  type PipeTransform,
} from "@nestjs/common";
import type { ZodType } from "zod";

/**
 * Validates and narrows request payloads (body, params, query) against a Zod
 * schema, turning schema violations into a clean 400 with actionable detail.
 */
export class ZodValidationPipe<T> implements PipeTransform<unknown, T> {
  constructor(private readonly schema: ZodType<T>) {}

  transform(value: unknown, metadata?: ArgumentMetadata): T {
    const result = this.schema.safeParse(value);
    if (!result.success) {
      // Label issues by the parameter name (e.g. "id") or its kind ("body").
      const fallback = metadata?.data ?? metadata?.type ?? "value";
      const detail = result.error.issues
        .map((i) => `${i.path.join(".") || fallback}: ${i.message}`)
        .join("; ");
      throw new BadRequestException(`Invalid request: ${detail}`);
    }
    return result.data;
  }
}
