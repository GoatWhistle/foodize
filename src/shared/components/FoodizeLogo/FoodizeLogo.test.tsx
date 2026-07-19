import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { FoodizeLogo } from "@shared/components/FoodizeLogo/FoodizeLogo";

describe("FoodizeLogo", () => {
  it("renders the wordmark with the default color", () => {
    render(<FoodizeLogo />);
    const logo = screen.getByRole("img", { name: "Foodize" });
    expect(logo).toBeInTheDocument();
    expect(screen.getByText("food")).toBeInTheDocument();
    expect(screen.getByText("ize")).toBeInTheDocument();
  });

  it("applies a custom color and size to the serif part", () => {
    render(<FoodizeLogo color="rgb(1, 2, 3)" size={48} />);
    expect(screen.getByText("food")).toHaveStyle({ color: "rgb(1, 2, 3)" });
  });
});
