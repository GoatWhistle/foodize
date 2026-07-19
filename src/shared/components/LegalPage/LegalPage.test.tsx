import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { MemoryRouter, Routes, Route } from "react-router-dom";
import { LegalPage } from "@shared/components/LegalPage/LegalPage";

const navigate = vi.fn();

vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual<typeof import("react-router-dom")>(
    "react-router-dom",
  );
  return { ...actual, useNavigate: () => navigate };
});

const renderAt = (path: string) =>
  render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route path="/legal/:doc" element={<LegalPage />} />
        <Route path="/" element={<div>home</div>} />
      </Routes>
    </MemoryRouter>,
  );

describe("LegalPage", () => {
  it("renders the terms document with headings, list items and bold text", () => {
    renderAt("/legal/terms");
    expect(screen.getByText("Условия сервиса")).toBeInTheDocument();
    expect(screen.getByText("1. Общие положения")).toBeInTheDocument();
    expect(screen.getByText("просматривать меню ресторанов и заведений;")).toBeInTheDocument();
    expect(screen.getByText("support@foodize.app")).toBeInTheDocument();
  });

  it("renders the privacy document", () => {
    renderAt("/legal/privacy");
    expect(screen.getByText("Политика конфиденциальности")).toBeInTheDocument();
  });

  it("redirects to home for an unknown document", () => {
    renderAt("/legal/unknown");
    expect(screen.getByText("home")).toBeInTheDocument();
  });

  it("navigates back when the back button is pressed", () => {
    navigate.mockClear();
    renderAt("/legal/terms");
    fireEvent.click(screen.getByRole("button", { name: "Назад" }));
    expect(navigate).toHaveBeenCalledWith(-1);
  });
});
