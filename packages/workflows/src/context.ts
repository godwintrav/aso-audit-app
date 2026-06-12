import type { RuntimeContext } from "@mastra/core/runtime-context";
import type { AuditStage } from "@aso/schemas";

export type ProgressStatus = "started" | "completed" | "failed";

export type ProgressEmitter = (
  stage: AuditStage,
  status: ProgressStatus,
  message?: string,
) => void;


export const PROGRESS_EMITTER_KEY = "progressEmitter";

const NOOP_EMITTER: ProgressEmitter = () => {};

export function resolveEmit(runtimeContext: RuntimeContext): ProgressEmitter {
  return (
    (runtimeContext.get(PROGRESS_EMITTER_KEY) as ProgressEmitter | undefined) ??
    NOOP_EMITTER
  );
}
