import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { CategoryChips } from "@shared/components/CategoryChips/CategoryChips";
import { t } from "@shared/i18n/useTranslation";

describe("CategoryChips", () => {
  it("renders the ALL chip with its translated label", () => {
    render(<CategoryChips categories={["ALL"]} activeCategory="ALL" onSelect={vi.fn()} />);
    expect(screen.getByText(t("catalog.restaurantPage.allCategories"))).toBeInTheDocument();
  });

  it("renders a chip per category", () => {
    render(
      <CategoryChips categories={["ALL", "PIZZA"]} activeCategory="ALL" onSelect={vi.fn()} />,
    );
    expect(screen.getAllByRole("button")).toHaveLength(2);
  });

  it("fires onSelect with the clicked category", () => {
    const onSelect = vi.fn();
    render(
      <CategoryChips categories={["ALL", "PIZZA"]} activeCategory="ALL" onSelect={onSelect} />,
    );
    const buttons = screen.getAllByRole("button");
    fireEvent.click(buttons[1] as HTMLElement);
    expect(onSelect).toHaveBeenCalledWith("PIZZA");
  });

  it("marks the active chip", () => {
    render(
      <CategoryChips categories={["ALL", "PIZZA"]} activeCategory="PIZZA" onSelect={vi.fn()} />,
    );
    const active = screen.getAllByRole("button").filter((b) => b.className.includes("active"));
    expect(active).toHaveLength(1);
  });

  it("renders nothing when there are no categories", () => {
    render(<CategoryChips categories={[]} activeCategory="ALL" onSelect={vi.fn()} />);
    expect(screen.queryAllByRole("button")).toHaveLength(0);
  });
});
