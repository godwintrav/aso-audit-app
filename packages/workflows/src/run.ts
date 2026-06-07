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

/**
 * Thin driver that runs the Mastra ASO audit workflow: it builds the run-scoped
 * context (gateway, progress emitter, result accumulator), executes the
 * workflow, and returns the assembled report. All analysis/scoring logic lives
 * in the workflow steps and the pure functions they call — this just wires
 * dependencies in and reads the result out.
 */
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
