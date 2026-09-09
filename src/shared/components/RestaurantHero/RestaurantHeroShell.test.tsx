import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { RestaurantHeroShell } from "@shared/components/RestaurantHero/RestaurantHeroShell";

describe("RestaurantHeroShell", () => {
  it("renders the restaurant name", () => {
    render(<RestaurantHeroShell name="Пиццерия" />);
    expect(screen.getByText("Пиццерия")).toBeInTheDocument();
  });

  it("renders a placeholder when there is no photo", () => {
    const { container } = render(<RestaurantHeroShell name="Пиццерия" photoUrl={null} />);
    expect(container.querySelector("img")).toBeNull();
  });

  it("renders the photo when a url is given", () => {
    render(<RestaurantHeroShell name="Пиццерия" photoUrl="https://example.com/p.jpg" />);
    const img = screen.getByAltText("Пиццерия");
    expect(img).toHaveAttribute("src", "https://example.com/p.jpg");
  });

  it("applies a view transition name to the photo", () => {
    render(
      <RestaurantHeroShell
        name="Пиццерия"
        photoUrl="https://example.com/p.jpg"
        viewTransitionName="hero-1"
      />,
    );
    expect(screen.getByAltText("Пиццерия").style.viewTransitionName).toBe("hero-1");
  });

  it("renders children and the top-right slot", () => {
    render(
      <RestaurantHeroShell name="Пиццерия" topRight={<span>fav</span>}>
        <span>4.5</span>
      </RestaurantHeroShell>,
    );
    expect(screen.getByText("4.5")).toBeInTheDocument();
    expect(screen.getByText("fav")).toBeInTheDocument();
  });
});
