import { describe, expect, it } from "vitest";
import { AuditIdParamSchema, AuditRequestSchema } from "./audit.dto";

describe("AuditRequestSchema", () => {
  it("accepts a valid App Store URL and defaults refresh to false", () => {
    const parsed = AuditRequestSchema.parse({
      url: "https://apps.apple.com/us/app/foo/id123456789",
    });
    expect(parsed.refresh).toBe(false);
    expect(parsed.url).toContain("id123456789");
  });

  it("trims surrounding whitespace before validating", () => {
    const parsed = AuditRequestSchema.parse({
      url: "  https://apps.apple.com/us/app/foo/id123456789  ",
    });
    expect(parsed.url).toBe("https://apps.apple.com/us/app/foo/id123456789");
  });

  it("rejects a non-App-Store URL", () => {
    expect(() => AuditRequestSchema.parse({ url: "https://example.com/app/id123" })).toThrow();
  });

  it("rejects an empty or non-URL string", () => {
    expect(() => AuditRequestSchema.parse({ url: "" })).toThrow();
    expect(() => AuditRequestSchema.parse({ url: "not a url" })).toThrow();
  });

  it("rejects an absurdly long URL", () => {
    const longUrl = `https://apps.apple.com/us/app/id1?x=${"a".repeat(2100)}`;
    expect(() => AuditRequestSchema.parse({ url: longUrl })).toThrow();
  });

  it("accepts an explicit refresh flag", () => {
    const parsed = AuditRequestSchema.parse({
      url: "https://apps.apple.com/us/app/foo/id1",
      refresh: true,
    });
    expect(parsed.refresh).toBe(true);
  });
});

describe("AuditIdParamSchema", () => {
  it("accepts a UUID", () => {
    expect(() =>
      AuditIdParamSchema.parse("d939c186-e120-4211-8e2f-cd70fe95d287"),
    ).not.toThrow();
  });

  it("rejects a non-UUID id", () => {
    expect(() => AuditIdParamSchema.parse("not-a-uuid")).toThrow();
    expect(() => AuditIdParamSchema.parse("123")).toThrow();
  });
});
