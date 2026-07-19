import { describe, it, expect } from "vitest";
import {
  ReliableWebSocket,
  createApi,
  cookieRefresh,
  createWebSocketFactories,
} from "@shared/services/api";

describe("services/api barrel", () => {
  it("re-exports the websocket, api, refresh and factory helpers", () => {
    expect(ReliableWebSocket).toBeTypeOf("function");
    expect(createApi).toBeTypeOf("function");
    expect(cookieRefresh).toBeTypeOf("function");
    expect(createWebSocketFactories).toBeTypeOf("function");
  });
});
