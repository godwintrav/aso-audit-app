import type { AuditReport, Conversation } from "@aso/schemas";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeAll, describe, expect, it, vi } from "vitest";
import type { AuditPhase, AuditState } from "@/lib/use-audit";
import { ChatPanel } from "./chat-panel";

beforeAll(() => {
  // jsdom does not implement scrollTo; the panel calls it in an effect.
  Element.prototype.scrollTo = vi.fn();
});

const report: AuditReport = {
  appId: "1",
  app: {
    appId: "1",
    title: "DigitPay",
    developer: "Digitpay Finance",
    category: "Finance",
    iconUrl: "https://example.com/icon.png",
    rating: 4.5,
    ratingCount: 120,
  },
  overallScore: 78,
  dimensions: [],
  screenshots: [],
  screenshotAnalysis: null,
  competitorComparison: [],
  quickWins: [],
  highImpact: [],
  strategic: [],
  warnings: [],
  generatedAt: "2026-06-12T00:00:00.000Z",
};

function auditState(phase: AuditPhase, overrides: Partial<AuditState> = {}): AuditState {
  return {
    phase,
    auditId: null,
    url: "https://apps.apple.com/us/app/id1",
    preview: null,
    events: [],
    report: null,
    error: null,
    ...overrides,
  };
}

function renderPanel(props: Partial<Parameters<typeof ChatPanel>[0]> = {}) {
  return render(
    <ChatPanel
      activeConversation={null}
      loadingConversation={false}
      audit={auditState("idle")}
      onSubmitUrl={vi.fn()}
      onConfirm={vi.fn()}
      onCancel={vi.fn()}
      {...props}
    />,
  );
}

describe("ChatPanel live thread", () => {
  it("shows the hero and URL input in the idle phase", () => {
    renderPanel({ audit: auditState("idle", { url: null }) });
    expect(screen.getByRole("heading", { name: "ASO Audit Agent" })).toBeInTheDocument();
    expect(screen.getByRole("textbox")).toBeInTheDocument();
  });

  it("shows a lookup message while previewing", () => {
    renderPanel({ audit: auditState("previewing") });
    expect(screen.getByText("Looking up the app…")).toBeInTheDocument();
  });

  it("shows the confirmation card in the confirm phase", () => {
    renderPanel({
      audit: auditState("confirm", {
        preview: {
          appId: "1",
          country: "us",
          url: "https://apps.apple.com/us/app/id1",
          title: "DigitPay",
          developer: "Digitpay Finance",
          category: "Finance",
          iconUrl: "https://example.com/icon.png",
        },
      }),
    });
    expect(screen.getByText("Is this the app you meant?")).toBeInTheDocument();
  });

  it("shows the progress list while running", () => {
    renderPanel({ audit: auditState("running") });
    expect(screen.getByText(/Running the audit/)).toBeInTheDocument();
    expect(screen.getByText("Fetching app metadata")).toBeInTheDocument();
  });

  it("shows the report when done", () => {
    renderPanel({ audit: auditState("done", { report }) });
    expect(screen.getByText("78")).toBeInTheDocument();
  });

  it("shows the error and calls onCancel from Start over", async () => {
    const onCancel = vi.fn();
    const user = userEvent.setup();
    renderPanel({ audit: auditState("error", { error: "Something broke" }), onCancel });
    expect(screen.getByText("Something broke")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Start over" }));
    expect(onCancel).toHaveBeenCalledTimes(1);
  });
});

describe("ChatPanel history thread", () => {
  const conversation: Conversation = {
    id: "c1",
    sessionId: "s1",
    url: "https://apps.apple.com/us/app/id1",
    title: "DigitPay",
    status: "completed",
    preview: null,
    report,
    error: null,
    createdAt: "2026-06-12T00:00:00.000Z",
    updatedAt: "2026-06-12T00:00:00.000Z",
  };

  it("shows a loading message while a conversation is loading", () => {
    renderPanel({ loadingConversation: true });
    expect(screen.getByText("Loading audit…")).toBeInTheDocument();
  });

  it("renders the stored report for a completed conversation", () => {
    renderPanel({ activeConversation: conversation });
    expect(screen.getByText("https://apps.apple.com/us/app/id1")).toBeInTheDocument();
    expect(screen.getByText("78")).toBeInTheDocument();
  });

  it("renders the error for a failed conversation", () => {
    renderPanel({
      activeConversation: { ...conversation, status: "failed", report: null, error: "It failed" },
    });
    expect(screen.getByText("It failed")).toBeInTheDocument();
  });

  it("renders an in-progress message for an unfinished conversation", () => {
    renderPanel({
      activeConversation: { ...conversation, status: "running", report: null },
    });
    expect(screen.getByText("This audit is still in progress.")).toBeInTheDocument();
  });
});
