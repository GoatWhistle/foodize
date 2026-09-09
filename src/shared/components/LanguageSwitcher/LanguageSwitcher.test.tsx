import { describe, it, expect, afterEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { LanguageSwitcher } from "@shared/components/LanguageSwitcher/LanguageSwitcher";
import { useLanguageStore } from "@shared/store/useLanguageStore";

afterEach(() => {
  useLanguageStore.getState().setLanguage("ru");
});

describe("LanguageSwitcher", () => {
  it("renders a button per supported language", () => {
    render(<LanguageSwitcher />);
    expect(screen.getAllByRole("button")).toHaveLength(2);
  });

  it("switches the language when a button is clicked", () => {
    useLanguageStore.getState().setLanguage("ru");
    render(<LanguageSwitcher />);
    const buttons = screen.getAllByRole("button");
    fireEvent.click(buttons[1] as HTMLElement);
    expect(useLanguageStore.getState().language).toBe("en");
  });

  it("highlights the active language", () => {
    useLanguageStore.getState().setLanguage("en");
    render(<LanguageSwitcher />);
    const active = screen
      .getAllByRole("button")
      .filter((b) => b.style.background !== "transparent");
    expect(active).toHaveLength(1);
  });
});
