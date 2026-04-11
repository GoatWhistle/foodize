import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import FoodizeLogo from "../../components/ui/FoodizeLogo";

describe("FoodizeLogo", () => {
  it("renders the SVG logo", () => {
    const { container } = render(<FoodizeLogo />);
    const svg = container.querySelector("svg");
    expect(svg).toBeDefined();
    expect(svg.getAttribute("aria-label")).toBe("Foodize");
  });

  it("applies the correct size", () => {
    const { container } = render(<FoodizeLogo size={64} />);
    const svg = container.querySelector("svg");
    expect(svg.getAttribute("height")).toBe("64");
  });

  it("renders 'food' and 'ze' text parts", () => {
    render(<FoodizeLogo />);
    const food = screen.getByText("food");
    const ze = screen.getByText("ze");
    expect(food).toBeDefined();
    expect(ze).toBeDefined();
  });
});
