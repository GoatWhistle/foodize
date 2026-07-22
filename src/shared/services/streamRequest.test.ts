import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { streamSseRequest } from "@shared/services/streamRequest";
import { t } from "@shared/i18n/useTranslation";

const makeStreamResponse = (
  chunks: string[],
  init: { status?: number; withBody?: boolean } = {},
): Response => {
  const encoder = new TextEncoder();
  let i = 0;
  const body = {
    getReader() {
      return {
        read: () =>
          i < chunks.length
            ? Promise.resolve({ done: false, value: encoder.encode(chunks[i++]) })
            : Promise.resolve({ done: true, value: undefined }),
        cancel: () => Promise.resolve(),
      };
    },
  } as unknown as ReadableStream<Uint8Array>;
  return {
    ok: (init.status ?? 200) < 400,
    status: init.status ?? 200,
    body: init.withBody === false ? null : body,
  } as unknown as Response;
};

describe("streamSseRequest", () => {
  const originalFetch = globalThis.fetch;

  beforeEach(() => {
    vi.useRealTimers();
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
    vi.restoreAllMocks();
  });

  it("streams chunks to onChunk and includes auth header", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValue(makeStreamResponse(["hello ", "world"]));
    globalThis.fetch = fetchMock;
    const chunks: string[] = [];
    await streamSseRequest(
      "https://api/chat",
      { messages: [] },
      { onChunk: (t) => chunks.push(t), getToken: () => "tok" },
    );
    expect(chunks).toEqual(["hello ", "world"]);
    const init = (fetchMock.mock.calls[0]?.[1] ?? {}) as RequestInit;
    expect((init.headers as Record<string, string>)["Authorization"]).toBe(
      "Bearer tok",
    );
    expect(init.credentials).toBe("include");
  });

  it("omits credentials when withCredentials is false and skips empty chunks", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValue(makeStreamResponse(["", "x"]));
    globalThis.fetch = fetchMock;
    const chunks: string[] = [];
    await streamSseRequest(
      "https://api/chat",
      {},
      { onChunk: (t) => chunks.push(t), withCredentials: false },
    );
    expect(chunks).toEqual(["x"]);
    const init = (fetchMock.mock.calls[0]?.[1] ?? {}) as RequestInit;
    expect(init.credentials).toBeUndefined();
  });

  it("refreshes and retries on 401", async () => {
    const refreshToken = vi.fn(() => Promise.resolve());
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(makeStreamResponse([], { status: 401 }))
      .mockResolvedValueOnce(makeStreamResponse(["ok"]));
    globalThis.fetch = fetchMock;
    const chunks: string[] = [];
    await streamSseRequest(
      "https://api/chat",
      {},
      { onChunk: (t) => chunks.push(t), refreshToken },
    );
    expect(refreshToken).toHaveBeenCalled();
    expect(chunks).toEqual(["ok"]);
  });

  it("throws when the retry after 401 is not ok", async () => {
    const refreshToken = vi.fn(() => Promise.resolve());
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(makeStreamResponse([], { status: 401 }))
      .mockResolvedValueOnce(makeStreamResponse([], { status: 500 }));
    globalThis.fetch = fetchMock;
    await expect(
      streamSseRequest("https://api/chat", {}, { refreshToken }),
    ).rejects.toThrow(/500/);
  });

  it("throws when the initial response has no body", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValue(makeStreamResponse([], { withBody: false }));
    globalThis.fetch = fetchMock;
    await expect(
      streamSseRequest("https://api/chat", {}),
    ).rejects.toThrow(t("common.errors.requestFailed", { status: 200 }));
  });

  it("rejects with an idle timeout when no chunk arrives in time", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      body: {
        getReader: () => ({
          read: () => new Promise(() => {}),
          cancel: () => Promise.resolve(),
        }),
      },
    });
    globalThis.fetch = fetchMock;
    await expect(
      streamSseRequest("https://api/chat", {}, { idleTimeoutMs: 10 }),
    ).rejects.toThrow(t("common.errors.timeout"));
  });
});
