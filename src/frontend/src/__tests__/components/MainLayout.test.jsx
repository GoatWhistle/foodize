import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { BrowserRouter } from "react-router-dom";
import MainLayout from "../../components/layout/MainLayout";
import { useAuthStore } from "../../store/useAuthStore";

vi.mock("../../store/useAuthStore", () => ({
  useAuthStore: vi.fn((sel) => {
    const state = { isAuthenticated: true };
    return sel ? sel(state) : state;
  }),
}));

vi.mock("../../store/useThemeStore", () => ({
  useThemeStore: vi.fn((sel) => {
    const state = { theme: "light" };
    return sel ? sel(state) : state;
  }),
}));

describe("MainLayout", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders logo and navigation when authenticated", () => {
    render(
      <BrowserRouter>
        <MainLayout />
      </BrowserRouter>,
    );

    expect(screen.getByLabelText("На главную")).toBeDefined();
    expect(screen.getAllByText("Рестораны").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Заказы").length).toBeGreaterThan(0);
  });

  it("shows login button when not authenticated", () => {
    vi.mocked(useAuthStore).mockImplementation((sel) => {
      const state = { isAuthenticated: false };
      return sel ? sel(state) : state;
    });

    render(
      <BrowserRouter>
        <MainLayout />
      </BrowserRouter>,
    );

    expect(screen.getByText("Войти")).toBeDefined();
    expect(screen.queryByText("Рестораны")).toBeNull();
  });
});
