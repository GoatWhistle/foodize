import { describe, it, expect, vi, beforeEach } from "vitest";

const instances: unknown[][] = [];

vi.mock("@shared/services/reliableWebSocket", () => ({
  ReliableWebSocket: vi.fn((...args: unknown[]) => {
    instances.push(args);
  }),
}));

import { createWebSocketFactories } from "@shared/services/wsFactories";

const lastUrl = (): string => {
  const args = instances[instances.length - 1] ?? [];
  return (args[0] as () => string)();
};

describe("createWebSocketFactories", () => {
  beforeEach(() => {
    instances.length = 0;
  });

  it("builds the order websocket url and forwards the token getter", () => {
    const getToken = vi.fn(() => "t");
    const factories = createWebSocketFactories(getToken);
    const onMessage = vi.fn();
    factories.createOrderWebSocket("o1", onMessage);
    const args = instances[0] ?? [];
    expect(lastUrl()).toMatch(/\/api\/v1\/ws\/orders\/o1$/);
    expect(args[1]).toBe(onMessage);
    expect(args[4]).toBe(getToken);
  });

  it("builds the notification websocket url", () => {
    createWebSocketFactories().createNotificationWebSocket("u1", vi.fn());
    expect(lastUrl()).toMatch(/\/ws\/notifications\/u1$/);
  });

  it("builds the restaurant orders websocket url", () => {
    createWebSocketFactories().createRestaurantOrdersWebSocket("r1", vi.fn());
    expect(lastUrl()).toMatch(/\/ws\/restaurants\/r1\/orders$/);
  });

  it("builds the display board websocket url", () => {
    createWebSocketFactories().createDisplayBoardWebSocket("r1", vi.fn());
    expect(lastUrl()).toMatch(/\/ws\/restaurants\/r1\/display-board$/);
  });
});
