import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { OrderStatusBadge } from "@shared/components/OrderStatusBadge/OrderStatusBadge";

describe("OrderStatusBadge", () => {
  it("renders the pending state", () => {
    render(<OrderStatusBadge status="PENDING" />);
    expect(screen.getByText("Ожидается")).toBeInTheDocument();
    expect(screen.getByText("Ожидаем подтверждения ресторана")).toBeInTheDocument();
  });

  it("renders the accepted state", () => {
    render(<OrderStatusBadge status="ACCEPTED" />);
    expect(screen.getByText("Принят")).toBeInTheDocument();
    expect(screen.getByText("Ресторан подтвердил заказ")).toBeInTheDocument();
  });

  it("renders the ready state", () => {
    render(<OrderStatusBadge status="READY" />);
    expect(screen.getByText("Забирай!")).toBeInTheDocument();
    expect(screen.getByText("Заказ ждёт тебя на кассе")).toBeInTheDocument();
  });

  it("renders the completed state", () => {
    render(<OrderStatusBadge status="COMPLETED" />);
    expect(screen.getByText("Приятного аппетита!")).toBeInTheDocument();
    expect(screen.getByText("Заказ уже получен")).toBeInTheDocument();
  });

  it("renders the cancelled state with a default reason", () => {
    render(<OrderStatusBadge status="CANCELLED" />);
    expect(screen.getByText("Отменён")).toBeInTheDocument();
    expect(screen.getByText("Заказ был отменён")).toBeInTheDocument();
  });

  it("renders a custom cancellation reason", () => {
    render(<OrderStatusBadge status="CANCELLED" cancellationReason="Нет ингредиентов" />);
    expect(screen.getByText("Нет ингредиентов")).toBeInTheDocument();
  });
});
