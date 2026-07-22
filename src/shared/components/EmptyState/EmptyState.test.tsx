import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi } from "vitest";
import { EmptyState } from "@shared/components/EmptyState/EmptyState";
import { t } from "@shared/i18n/useTranslation";

describe("EmptyState", () => {
  it("renders the default title", () => {
    render(<EmptyState />);
    expect(screen.getByText(t("common.states.empty"))).toBeInTheDocument();
  });

  it("renders a custom title and subtitle", () => {
    render(<EmptyState title="Нет данных" subtitle="Попробуйте позже" />);
    expect(screen.getByText("Нет данных")).toBeInTheDocument();
    expect(screen.getByText("Попробуйте позже")).toBeInTheDocument();
  });

  it("renders and triggers the action button", async () => {
    const user = userEvent.setup();
    const onClick = vi.fn();
    render(<EmptyState action={{ label: "Обновить", onClick }} />);
    await user.click(screen.getByRole("button", { name: "Обновить" }));
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it("hides the icon when icon is false", () => {
    const { container } = render(<EmptyState icon={false} />);
    expect(container.querySelector(".empty-icon")).not.toBeInTheDocument();
  });

  it("renders a custom icon node", () => {
    render(<EmptyState icon={<span data-testid="custom-icon" />} />);
    expect(screen.getByTestId("custom-icon")).toBeInTheDocument();
  });
});
