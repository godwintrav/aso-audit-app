import { BadRequestException } from "@nestjs/common";
import { describe, expect, it } from "vitest";
import { z } from "zod";
import { ZodValidationPipe } from "./zod-validation.pipe";

const schema = z.object({
  name: z.string().min(1),
  age: z.number().int().nonnegative(),
});

describe("ZodValidationPipe", () => {
  it("returns the parsed value for valid input", () => {
    const pipe = new ZodValidationPipe(schema);
    expect(pipe.transform({ name: "Ada", age: 30 })).toEqual({ name: "Ada", age: 30 });
  });

  it("applies schema transforms/defaults", () => {
    const pipe = new ZodValidationPipe(z.object({ flag: z.boolean().default(true) }));
    expect(pipe.transform({})).toEqual({ flag: true });
  });

  it("throws a BadRequestException for invalid input", () => {
    const pipe = new ZodValidationPipe(schema);
    expect(() => pipe.transform({ name: "", age: -1 })).toThrow(BadRequestException);
  });

  it("includes the field path in the error message", () => {
    const pipe = new ZodValidationPipe(schema);
    try {
      pipe.transform({ name: "Ada", age: -1 });
      throw new Error("expected pipe to throw");
    } catch (err) {
      expect(err).toBeInstanceOf(BadRequestException);
      expect((err as BadRequestException).message).toContain("age");
    }
  });

  it("falls back to metadata data/type when an issue has no path", () => {
    const pipe = new ZodValidationPipe(z.string());
    try {
      pipe.transform(123, { type: "body", data: "payload" });
      throw new Error("expected pipe to throw");
    } catch (err) {
      expect((err as BadRequestException).message).toContain("payload");
    }
  });

  it("falls back to 'value' when there is no path and no metadata", () => {
    const pipe = new ZodValidationPipe(z.string());
    try {
      pipe.transform(123);
      throw new Error("expected pipe to throw");
    } catch (err) {
      expect((err as BadRequestException).message).toContain("value");
    }
  });
});
