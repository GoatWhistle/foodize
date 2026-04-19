import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import OrderStatusBadge from "../../components/ui/OrderStatusBadge";

describe("OrderStatusBadge", () => {
  it("renders pending status with ripple rings", () => {
    const { container } = render(<OrderStatusBadge status="PENDING" />);
    expect(screen.getByText("Принят")).toBeDefined();
    expect(container.querySelectorAll(".ripple-ring")).toHaveLength(3);
  });

  it("renders preparing status with progress circle", () => {
    const { container } = render(
      <OrderStatusBadge status="COOKING" progress={0.5} />,
    );
    expect(screen.getByText("Готовится")).toBeDefined();
    const circles = container.querySelectorAll("circle");
    expect(circles).toHaveLength(2); // Track + Progress
  });

  it("renders ready status with checkmark", () => {
    render(<OrderStatusBadge status="READY" />);
    expect(screen.getByText("Забирай!")).toBeDefined();
  });
});
