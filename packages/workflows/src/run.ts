import { RuntimeContext } from "@mastra/core/runtime-context";
import type { AnalysisGateway } from "@aso/agents";
import type { AppListing, AuditReport } from "@aso/schemas";
import { AUDIT_CONTEXT_KEY, createRunContext, type ProgressEmitter } from "./context";
import { asoAuditWorkflow } from "./workflow";

export interface RunAuditInput {
  listing: AppListing;
  gateway: AnalysisGateway;
  /** Called as each stage starts/completes/fails — wire this to SSE. */
  emit?: ProgressEmitter;
}

export async function runAudit(input: RunAuditInput): Promise<AuditReport> {
  const ctx = createRunContext(input);

  const runtimeContext = new RuntimeContext();
  runtimeContext.set(AUDIT_CONTEXT_KEY, ctx);

  const run = await asoAuditWorkflow.createRunAsync();
  await run.start({ inputData: {}, runtimeContext });

  if (!ctx.report) {
    throw new Error("Audit workflow completed without producing a report.");
  }
  return ctx.report;
}
