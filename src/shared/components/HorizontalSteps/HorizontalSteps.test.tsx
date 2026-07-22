import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import type { Order } from "@shared/types/models";
import { HorizontalSteps } from "./HorizontalSteps";
import { t } from "@shared/i18n/useTranslation";

const makeOrder = (status: string): Order => ({ status } as unknown as Order);

describe("HorizontalSteps", () => {
  it("renders all status labels", () => {
    render(<HorizontalSteps order={makeOrder("PENDING")} />);
    expect(screen.getByText(t("enums.orderStatus.PENDING"))).toBeInTheDocument();
    expect(screen.getByText(t("enums.orderStatus.ACCEPTED"))).toBeInTheDocument();
    expect(screen.getByText(t("enums.orderStatus.READY"))).toBeInTheDocument();
    expect(screen.getByText(t("enums.orderStatus.COMPLETED"))).toBeInTheDocument();
  });

  it("renders for an intermediate status", () => {
    render(<HorizontalSteps order={makeOrder("READY")} />);
    expect(screen.getByText(t("enums.orderStatus.READY"))).toBeInTheDocument();
  });

  it("renders for a completed order", () => {
    render(<HorizontalSteps order={makeOrder("COMPLETED")} />);
    expect(screen.getByText(t("enums.orderStatus.COMPLETED"))).toBeInTheDocument();
  });

  it("renders for a cancelled order without throwing", () => {
    render(<HorizontalSteps order={makeOrder("CANCELLED")} />);
    expect(screen.getByText(t("enums.orderStatus.PENDING"))).toBeInTheDocument();
  });
});
