import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import type { Order } from "@shared/types/models";
import { HorizontalSteps } from "./HorizontalSteps";

const makeOrder = (status: string): Order => ({ status } as unknown as Order);

describe("HorizontalSteps", () => {
  it("renders all status labels", () => {
    render(<HorizontalSteps order={makeOrder("PENDING")} />);
    expect(screen.getByText("Ожидается")).toBeInTheDocument();
    expect(screen.getByText("Принят")).toBeInTheDocument();
    expect(screen.getByText("Готов к выдаче")).toBeInTheDocument();
    expect(screen.getByText("Выдан")).toBeInTheDocument();
  });

  it("renders for an intermediate status", () => {
    render(<HorizontalSteps order={makeOrder("READY")} />);
    expect(screen.getByText("Готов к выдаче")).toBeInTheDocument();
  });

  it("renders for a completed order", () => {
    render(<HorizontalSteps order={makeOrder("COMPLETED")} />);
    expect(screen.getByText("Выдан")).toBeInTheDocument();
  });

  it("renders for a cancelled order without throwing", () => {
    render(<HorizontalSteps order={makeOrder("CANCELLED")} />);
    expect(screen.getByText("Ожидается")).toBeInTheDocument();
  });
});
