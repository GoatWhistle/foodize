import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { TelegramLogo } from "@shared/components/BrandIcons/TelegramLogo";

describe("TelegramLogo", () => {
  it("renders the color variant by default with the default size", () => {
    const { container } = render(<TelegramLogo />);
    const svg = container.querySelector("svg");
    expect(svg).toHaveAttribute("width", "24");
    expect(svg?.querySelector("linearGradient")).toBeTruthy();
  });

  it("renders the mono variant with a role and custom size", () => {
    render(<TelegramLogo variant="mono" size={40} />);
    const svg = screen.getByRole("img", { name: "Telegram" });
    expect(svg).toHaveAttribute("width", "40");
    expect(svg).toHaveAttribute("fill", "currentColor");
  });
});
