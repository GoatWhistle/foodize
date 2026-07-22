import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, beforeEach } from "vitest";
import { ThemeSwitcher } from "@shared/components/ThemeSwitcher/ThemeSwitcher";
import { useThemeStore } from "@shared/store/useThemeStore";
import { t } from "@shared/i18n/useTranslation";

describe("ThemeSwitcher", () => {
  beforeEach(() => {
    useThemeStore.setState({ theme: "system" });
  });

  it("renders all three theme options", () => {
    render(<ThemeSwitcher />);
    expect(screen.getByRole("button", { name: t("profile.theme.light") })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: t("profile.theme.system") })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: t("profile.theme.dark") })).toBeInTheDocument();
  });

  it("updates the store theme when an option is clicked", async () => {
    const user = userEvent.setup();
    render(<ThemeSwitcher />);
    await user.click(screen.getByRole("button", { name: t("profile.theme.dark") }));
    expect(useThemeStore.getState().theme).toBe("dark");
    await user.click(screen.getByRole("button", { name: t("profile.theme.light") }));
    expect(useThemeStore.getState().theme).toBe("light");
  });
});
