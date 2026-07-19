import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, beforeEach } from "vitest";
import { ThemeSwitcher } from "@shared/components/ThemeSwitcher/ThemeSwitcher";
import { useThemeStore } from "@shared/store/useThemeStore";

describe("ThemeSwitcher", () => {
  beforeEach(() => {
    useThemeStore.setState({ theme: "system" });
  });

  it("renders all three theme options", () => {
    render(<ThemeSwitcher />);
    expect(screen.getByRole("button", { name: "Светлая" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Системная" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Тёмная" })).toBeInTheDocument();
  });

  it("updates the store theme when an option is clicked", async () => {
    const user = userEvent.setup();
    render(<ThemeSwitcher />);
    await user.click(screen.getByRole("button", { name: "Тёмная" }));
    expect(useThemeStore.getState().theme).toBe("dark");
    await user.click(screen.getByRole("button", { name: "Светлая" }));
    expect(useThemeStore.getState().theme).toBe("light");
  });
});
