import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { OrderButton } from "@shared/components/OrderButton/OrderButton";
import { t } from "@shared/i18n/useTranslation";

describe("OrderButton", () => {
  it("renders children in the idle state and fires onClick", () => {
    const onClick = vi.fn();
    render(<OrderButton onClick={onClick}>Заказать</OrderButton>);
    const btn = screen.getByRole("button", { name: "Заказать" });
    fireEvent.click(btn);
    expect(onClick).toHaveBeenCalled();
    expect(btn).not.toBeDisabled();
  });

  it("shows a spinner and disables the button while loading", () => {
    render(<OrderButton isLoading>Заказать</OrderButton>);
    expect(screen.getByText(t("order.checkout.placing"))).toBeInTheDocument();
    expect(screen.getByRole("button")).toBeDisabled();
  });

  it("shows the success label", () => {
    render(<OrderButton isSuccess>Заказать</OrderButton>);
    expect(screen.getByText(t("order.checkout.success"))).toBeInTheDocument();
  });

  it("respects an explicit disabled prop and merges styles", () => {
    render(
      <OrderButton disabled style={{ color: "red" }}>
        Заказать
      </OrderButton>,
    );
    const btn = screen.getByRole("button");
    expect(btn).toBeDisabled();
    expect(btn).toHaveStyle({ color: "rgb(255, 0, 0)" });
  });
});
