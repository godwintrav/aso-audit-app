import type { AuditProgressEvent } from "@aso/schemas";
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { ProgressList } from "./progress-list";

function event(overrides: Partial<AuditProgressEvent>): AuditProgressEvent {
  return {
    auditId: "audit-1",
    stage: "acquire_metadata",
    label: "Fetching",
    status: "started",
    at: "2026-06-12T00:00:00.000Z",
    ...overrides,
  };
}

describe("ProgressList", () => {
  it("renders all eight pipeline stages", () => {
    render(<ProgressList events={[]} />);
    expect(screen.getByText("Fetching app metadata")).toBeInTheDocument();
    expect(screen.getByText("Building report")).toBeInTheDocument();
    expect(screen.getAllByRole("listitem")).toHaveLength(8);
  });

  it("marks a completed stage with a check icon", () => {
    render(<ProgressList events={[event({ stage: "acquire_metadata", status: "completed" })]} />);
    expect(screen.getByText("✓")).toBeInTheDocument();
  });

  it("marks a failed stage with an alert icon and rose text", () => {
    render(<ProgressList events={[event({ stage: "analyze_reviews", status: "failed" })]} />);
    expect(screen.getByText("!")).toBeInTheDocument();
    expect(screen.getByText("Analyzing reviews").className).toContain("rose");
  });

  it("prefers completed over started when both exist for a stage", () => {
    render(
      <ProgressList
        events={[
          event({ stage: "generate_scores", status: "started" }),
          event({ stage: "generate_scores", status: "completed" }),
        ]}
      />,
    );
    expect(screen.getByText("✓")).toBeInTheDocument();
  });
});
