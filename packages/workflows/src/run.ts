import { RuntimeContext } from "@mastra/core/runtime-context";
import type { AnalysisGateway } from "@aso/agents";
import { ANALYSIS_GATEWAY_KEY } from "@aso/tools";
import type { AppListing, AuditReport } from "@aso/schemas";
import { PROGRESS_EMITTER_KEY, type ProgressEmitter } from "./context";
import { asoAuditWorkflow } from "./workflow";

export interface RunAuditInput {
  listing: AppListing;
  gateway: AnalysisGateway;
  emit?: ProgressEmitter;
}


export async function runAudit(input: RunAuditInput): Promise<AuditReport> {
  const runtimeContext = new RuntimeContext();
  runtimeContext.set(ANALYSIS_GATEWAY_KEY, input.gateway);
  if (input.emit) runtimeContext.set(PROGRESS_EMITTER_KEY, input.emit);

  const run = await asoAuditWorkflow.createRunAsync();
  const result = await run.start({ inputData: input.listing, runtimeContext });

  if (result.status === "success") return result.result;
  if (result.status === "failed") throw result.error;
  throw new Error(`Audit workflow ended in unexpected state: ${result.status}`);
}
