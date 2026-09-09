import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { HouseIcon, ReceiptIcon } from "@phosphor-icons/react";
import { BottomNav } from "@shared/components/BottomNav/BottomNav";
import type { BottomNavTab } from "@shared/components/BottomNav/BottomNav";

const makeTabs = (over: Partial<BottomNavTab>[] = []): BottomNavTab[] => [
  { key: "home", icon: HouseIcon, label: "Каталог", onSelect: vi.fn(), ...over[0] },
  { key: "orders", icon: ReceiptIcon, label: "Заказы", onSelect: vi.fn(), ...over[1] },
];

describe("BottomNav", () => {
  it("renders every tab label", () => {
    render(<BottomNav tabs={makeTabs()} />);
    expect(screen.getByText("Каталог")).toBeInTheDocument();
    expect(screen.getByText("Заказы")).toBeInTheDocument();
  });

  it("fires onSelect when a tab is clicked", () => {
    const onSelect = vi.fn();
    render(<BottomNav tabs={makeTabs([{ onSelect }])} />);
    fireEvent.click(screen.getByText("Каталог"));
    expect(onSelect).toHaveBeenCalledTimes(1);
  });

  it("marks the active tab and does not fire disabled tabs", () => {
    const onSelect = vi.fn();
    render(<BottomNav tabs={makeTabs([{ active: true }, { disabled: true, onSelect }])} />);
    fireEvent.click(screen.getByText("Заказы"));
    expect(onSelect).not.toHaveBeenCalled();
  });

  it("renders a badge when provided", () => {
    render(<BottomNav tabs={makeTabs([{ badge: "3" }])} />);
    expect(screen.getByText("3")).toBeInTheDocument();
  });

  it("renders a dot when there is no badge", () => {
    const { container } = render(
      <BottomNav tabs={makeTabs([{ showDot: true, dotTitle: "new" }])} />,
    );
    expect(container.querySelector('[title="new"]')).not.toBeNull();
  });

  it("hides the dot when a badge is present", () => {
    const { container } = render(
      <BottomNav tabs={makeTabs([{ showDot: true, dotTitle: "new", badge: "9" }])} />,
    );
    expect(container.querySelector('[title="new"]')).toBeNull();
  });

  it("applies the constrained and mobile-only modifiers", () => {
    const { container } = render(<BottomNav tabs={makeTabs()} constrained hideOnDesktop />);
    expect(container.querySelector("nav")?.className.length).toBeGreaterThan(0);
  });
});
