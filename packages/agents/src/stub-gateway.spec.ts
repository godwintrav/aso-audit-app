import { TitleAnalysisSchema } from "@aso/schemas";
import { describe, expect, it } from "vitest";
import type { AnalysisKind } from "./gateway";
import { createStubGateway } from "./stub-gateway";

const titleInput = {
  kind: "title" as const,
  system: "sys",
  prompt: "prompt",
  schema: TitleAnalysisSchema,
};

describe("createStubGateway", () => {
  it("returns schema-valid canned data for a known kind", async () => {
    const gateway = createStubGateway();
    const result = await gateway.generateStructured(titleInput);
    expect(result.score).toBe(72);
    expect(() => TitleAnalysisSchema.parse(result)).not.toThrow();
  });

  it("prefers an override over the canned payload", async () => {
    const gateway = createStubGateway({
      overrides: { title: { score: 10, findings: [], recommendations: [] } },
    });
    const result = await gateway.generateStructured(titleInput);
    expect(result.score).toBe(10);
  });

  it("throws for a kind listed in failOn", async () => {
    const gateway = createStubGateway({ failOn: ["title"] });
    await expect(gateway.generateStructured(titleInput)).rejects.toThrow(
      /forced failure for kind "title"/,
    );
  });

  it("does not fail kinds that are not listed in failOn", async () => {
    const gateway = createStubGateway({ failOn: ["subtitle"] as AnalysisKind[] });
    await expect(gateway.generateStructured(titleInput)).resolves.toBeDefined();
  });

  it("throws when an override does not satisfy the schema", async () => {
    const gateway = createStubGateway({
      overrides: { title: { score: "not-a-number" } },
    });
    await expect(gateway.generateStructured(titleInput)).rejects.toThrow();
  });
});
