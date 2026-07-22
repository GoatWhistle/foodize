import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { OrderStatusBadge } from "@shared/components/OrderStatusBadge/OrderStatusBadge";
import { t } from "@shared/i18n/useTranslation";

describe("OrderStatusBadge", () => {
  it("renders the pending state", () => {
    render(<OrderStatusBadge status="PENDING" />);
    expect(screen.getByText(t("order.badge.pendingTitle"))).toBeInTheDocument();
    expect(screen.getByText(t("order.badge.pendingSubtitle"))).toBeInTheDocument();
  });

  it("renders the accepted state", () => {
    render(<OrderStatusBadge status="ACCEPTED" />);
    expect(screen.getByText(t("order.badge.acceptedTitle"))).toBeInTheDocument();
    expect(screen.getByText(t("order.badge.acceptedSubtitle"))).toBeInTheDocument();
  });

  it("renders the ready state", () => {
    render(<OrderStatusBadge status="READY" />);
    expect(screen.getByText(t("order.badge.readyTitle"))).toBeInTheDocument();
    expect(screen.getByText(t("order.badge.readySubtitle"))).toBeInTheDocument();
  });

  it("renders the completed state", () => {
    render(<OrderStatusBadge status="COMPLETED" />);
    expect(screen.getByText(t("order.badge.completedTitle"))).toBeInTheDocument();
    expect(screen.getByText(t("order.badge.completedSubtitle"))).toBeInTheDocument();
  });

  it("renders the cancelled state with a default reason", () => {
    render(<OrderStatusBadge status="CANCELLED" />);
    expect(screen.getByText(t("order.badge.cancelledTitle"))).toBeInTheDocument();
    expect(screen.getByText(t("order.badge.cancelledSubtitle"))).toBeInTheDocument();
  });

  it("renders a custom cancellation reason", () => {
    render(<OrderStatusBadge status="CANCELLED" cancellationReason="Нет ингредиентов" />);
    expect(screen.getByText("Нет ингредиентов")).toBeInTheDocument();
  });
});
