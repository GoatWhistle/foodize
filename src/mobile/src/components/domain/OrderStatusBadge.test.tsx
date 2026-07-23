import { render, screen } from "@testing-library/react-native";
import { OrderStatusBadge } from "@/components/domain/OrderStatusBadge";
import type { OrderStatus } from "@shared/types/models";

describe("OrderStatusBadge", () => {
  const cases: { status: OrderStatus; title: string }[] = [
    { status: "PENDING", title: "Ожидается" },
    { status: "ACCEPTED", title: "Принят" },
    { status: "READY", title: "Забирай!" },
    { status: "COMPLETED", title: "Приятного аппетита!" },
    { status: "CANCELLED", title: "Отменён" },
  ];

  it.each(cases)("renders the $status status", ({ status, title }) => {
    render(<OrderStatusBadge status={status} />);
    expect(screen.getByTestId(`order-status-${status}`)).toBeTruthy();
    expect(screen.getByText(title)).toBeTruthy();
  });

  it("shows the cancellation reason when cancelled", () => {
    render(<OrderStatusBadge status="CANCELLED" cancellationReason="Нет ингредиентов" />);
    expect(screen.getByText("Нет ингредиентов")).toBeTruthy();
  });

  it("falls back to the default cancelled subtitle", () => {
    render(<OrderStatusBadge status="CANCELLED" cancellationReason={null} />);
    expect(screen.getByText("Заказ был отменён")).toBeTruthy();
  });
});
