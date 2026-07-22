import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { MemoryRouter, Routes, Route } from "react-router-dom";
import { LegalPage } from "@shared/components/LegalPage/LegalPage";
import { t } from "@shared/i18n/useTranslation";

const navigate = vi.fn();

vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual<typeof import("react-router-dom")>(
    "react-router-dom",
  );
  return { ...actual, useNavigate: () => navigate };
});

const bodyLines = (key: string): string[] => t(key).trim().split("\n");

const firstHeading = (key: string): string =>
  (bodyLines(key).find((line) => line.startsWith("## ")) ?? "").slice(3);

const firstListItem = (key: string): string =>
  (bodyLines(key).find((line) => line.startsWith("- ")) ?? "").slice(2);

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
    expect(screen.getByText(t("legal.terms.title"))).toBeInTheDocument();
    expect(screen.getByText(firstHeading("legal.terms.body"))).toBeInTheDocument();
    expect(screen.getByText(firstListItem("legal.terms.body"))).toBeInTheDocument();
    expect(screen.getByText("support@foodize.app")).toBeInTheDocument();
  });

  it("renders the privacy document", () => {
    renderAt("/legal/privacy");
    expect(screen.getByText(t("legal.privacy.title"))).toBeInTheDocument();
  });

  it("redirects to home for an unknown document", () => {
    renderAt("/legal/unknown");
    expect(screen.getByText("home")).toBeInTheDocument();
  });

  it("navigates back when the back button is pressed", () => {
    navigate.mockClear();
    renderAt("/legal/terms");
    fireEvent.click(screen.getByRole("button", { name: t("legal.backLabel") }));
    expect(navigate).toHaveBeenCalledWith(-1);
  });
});
