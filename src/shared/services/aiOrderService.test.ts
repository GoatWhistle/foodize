import { describe, it, expect, vi, beforeEach } from "vitest";

const streamSseRequest = vi.fn((..._args: unknown[]) => Promise.resolve());

vi.mock("@shared/services/streamRequest", () => ({
  streamSseRequest: (...args: unknown[]) => streamSseRequest(...args),
}));

import { aiOrderService } from "@shared/services/aiOrderService";

describe("aiOrderService", () => {
  beforeEach(() => {
    streamSseRequest.mockClear();
  });

  it("streamChat delegates to streamSseRequest with the chat url and messages", async () => {
    const options = { onChunk: () => {} };
    await aiOrderService.streamChat([{ role: "user", content: "hi" }], options);
    expect(streamSseRequest).toHaveBeenCalledTimes(1);
    const call = streamSseRequest.mock.calls[0] ?? [];
    expect(call[0]).toMatch(/\/ai\/order\/chat$/);
    expect(call[1]).toEqual({ messages: [{ role: "user", content: "hi" }] });
    expect(call[2]).toBe(options);
  });

  it("streamChat defaults options to an empty object", async () => {
    await aiOrderService.streamChat([]);
    expect(streamSseRequest.mock.calls[0]?.[2]).toEqual({});
  });
});
