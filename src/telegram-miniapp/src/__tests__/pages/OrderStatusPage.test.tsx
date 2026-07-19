import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import type { ReliableWebSocket } from "@shared/services/reliableWebSocket";

const createOrderWebSocket = vi.fn();
vi.mock("../../services/api", () => ({
  createOrderWebSocket: (...a: unknown[]) =>
    createOrderWebSocket(...a) as ReliableWebSocket,
}));

interface SharedProps {
  createOrderWebSocket: unknown;
  onBack: string;
  showDetails: boolean;
}
let lastProps: SharedProps | null = null;
vi.mock("@shared/pages/OrderStatusPage/OrderStatusPage", () => ({
  OrderStatusPage: (props: SharedProps) => {
    lastProps = props;
    return <div data-testid="shared-order-status" />;
  },
}));

import { OrderStatusPage } from "../../pages/orders/OrderStatusPage";

beforeEach(() => {
  vi.clearAllMocks();
  lastProps = null;
});

describe("OrderStatusPage", () => {
  it("renders the shared order status page", () => {
    render(<OrderStatusPage />);
    expect(screen.getByTestId("shared-order-status")).toBeInTheDocument();
  });

  it("wires the websocket factory and back route into the shared page", () => {
    render(<OrderStatusPage />);
    expect(lastProps?.onBack).toBe("/orders");
    expect(lastProps?.showDetails).toBe(false);
    expect(typeof lastProps?.createOrderWebSocket).toBe("function");
  });
});
