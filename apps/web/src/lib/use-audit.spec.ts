import type { AuditPreview, AuditProgressEvent, AuditRecord } from "@aso/schemas";
import { act, renderHook, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useAudit } from "./use-audit";

vi.mock("./api", () => ({
  previewApp: vi.fn(),
  startAudit: vi.fn(),
  getAudit: vi.fn(),
  streamAudit: vi.fn(),
}));

import { getAudit, previewApp, startAudit, streamAudit } from "./api";

const previewAppMock = vi.mocked(previewApp);
const startAuditMock = vi.mocked(startAudit);
const getAuditMock = vi.mocked(getAudit);
const streamAuditMock = vi.mocked(streamAudit);

const URL = "https://apps.apple.com/us/app/digitpay/id1";

function preview(overrides: Partial<AuditPreview> = {}): AuditPreview {
  return {
    appId: "1",
    country: "us",
    url: URL,
    title: "DigitPay",
    developer: "Digitpay Finance",
    category: "Finance",
    iconUrl: "https://example.com/icon.png",
    ...overrides,
  };
}

function event(overrides: Partial<AuditProgressEvent> = {}): AuditProgressEvent {
  return {
    auditId: "audit-1",
    stage: "acquire_metadata",
    label: "Fetching",
    status: "started",
    at: "2026-06-12T00:00:00.000Z",
    ...overrides,
  };
}

function record(overrides: Partial<AuditRecord> = {}): AuditRecord {
  return {
    auditId: "audit-1",
    status: "completed",
    preview: null,
    progress: [],
    report: { overallScore: 80 } as AuditRecord["report"],
    error: null,
    createdAt: "2026-06-12T00:00:00.000Z",
    updatedAt: "2026-06-12T00:00:00.000Z",
    ...overrides,
  };
}

const unsubscribe = vi.fn();
let handlers: Parameters<typeof streamAudit>[1];

beforeEach(() => {
  previewAppMock.mockResolvedValue(preview());
  startAuditMock.mockResolvedValue({ auditId: "audit-1" });
  getAuditMock.mockResolvedValue(record());
  streamAuditMock.mockImplementation((_id, h) => {
    handlers = h;
    return unsubscribe;
  });
});

afterEach(() => {
  vi.clearAllMocks();
});

describe("useAudit.submitUrl", () => {
  it("moves to the confirm phase with a preview on success", async () => {
    const { result } = renderHook(() => useAudit());
    await act(async () => {
      await result.current.submitUrl(URL);
    });
    expect(result.current.state.phase).toBe("confirm");
    expect(result.current.state.preview?.title).toBe("DigitPay");
    expect(result.current.state.url).toBe(URL);
  });

  it("moves to the error phase when preview lookup fails", async () => {
    previewAppMock.mockRejectedValueOnce(new Error("Not found"));
    const { result } = renderHook(() => useAudit());
    await act(async () => {
      await result.current.submitUrl(URL);
    });
    expect(result.current.state.phase).toBe("error");
    expect(result.current.state.error).toBe("Not found");
  });
});

describe("useAudit.confirm", () => {
  it("does nothing when there is no preview", async () => {
    const { result } = renderHook(() => useAudit());
    await act(async () => {
      await result.current.confirm();
    });
    expect(startAuditMock).not.toHaveBeenCalled();
    expect(result.current.state.phase).toBe("idle");
  });

  it("starts the run, subscribes to the stream and notifies onRunStarted", async () => {
    const onRunStarted = vi.fn();
    const { result } = renderHook(() => useAudit({ onRunStarted }));
    await act(async () => {
      await result.current.submitUrl(URL);
    });
    await act(async () => {
      await result.current.confirm();
    });
    expect(result.current.state.phase).toBe("running");
    expect(result.current.state.auditId).toBe("audit-1");
    expect(onRunStarted).toHaveBeenCalledWith("audit-1");
    expect(streamAuditMock).toHaveBeenCalled();
  });

  it("appends streamed events and finishes the run when the report is assembled", async () => {
    const onRunFinished = vi.fn();
    const { result } = renderHook(() => useAudit({ onRunFinished }));
    await act(async () => {
      await result.current.submitUrl(URL);
    });
    await act(async () => {
      await result.current.confirm();
    });
    await act(async () => {
      handlers.onEvent(event({ stage: "acquire_metadata", status: "started" }));
    });
    expect(result.current.state.events).toHaveLength(1);

    await act(async () => {
      handlers.onEvent(event({ stage: "assemble_report", status: "completed" }));
    });
    await waitFor(() => expect(result.current.state.phase).toBe("done"));
    expect(result.current.state.report?.overallScore).toBe(80);
    expect(onRunFinished).toHaveBeenCalledWith("audit-1");
  });

  it("surfaces a failed audit record as an error", async () => {
    getAuditMock.mockResolvedValue(record({ status: "failed", report: null, error: "boom" }));
    const { result } = renderHook(() => useAudit());
    await act(async () => {
      await result.current.submitUrl(URL);
    });
    await act(async () => {
      await result.current.confirm();
    });
    await act(async () => {
      handlers.onEvent(event({ status: "failed" }));
    });
    await waitFor(() => expect(result.current.state.phase).toBe("error"));
    expect(result.current.state.error).toBe("boom");
  });

  it("stays running while the audit record is not yet finished", async () => {
    getAuditMock.mockResolvedValue(record({ status: "running", report: null }));
    const { result } = renderHook(() => useAudit());
    await act(async () => {
      await result.current.submitUrl(URL);
    });
    await act(async () => {
      await result.current.confirm();
    });
    await act(async () => {
      await handlers.onError?.();
    });
    expect(result.current.state.phase).toBe("running");
  });

  it("moves to error when starting the audit throws", async () => {
    startAuditMock.mockRejectedValueOnce(new Error("server error"));
    const { result } = renderHook(() => useAudit());
    await act(async () => {
      await result.current.submitUrl(URL);
    });
    await act(async () => {
      await result.current.confirm();
    });
    expect(result.current.state.phase).toBe("error");
    expect(result.current.state.error).toBe("server error");
  });
});

describe("useAudit.reset", () => {
  it("returns to the initial idle state and unsubscribes from the stream", async () => {
    const { result } = renderHook(() => useAudit());
    await act(async () => {
      await result.current.submitUrl(URL);
    });
    await act(async () => {
      await result.current.confirm();
    });
    act(() => {
      result.current.reset();
    });
    expect(result.current.state.phase).toBe("idle");
    expect(result.current.state.preview).toBeNull();
    expect(unsubscribe).toHaveBeenCalled();
  });
});
