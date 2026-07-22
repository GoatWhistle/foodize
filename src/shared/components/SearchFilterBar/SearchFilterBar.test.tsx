import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi } from "vitest";
import { SearchFilterBar } from "./SearchFilterBar";
import { t } from "@shared/i18n/useTranslation";

const makeProps = (overrides: Record<string, unknown> = {}) => ({
  search: "",
  setSearch: vi.fn(),
  onlyOpen: false,
  setOnlyOpen: vi.fn(),
  sort: "default",
  setSort: vi.fn(),
  direction: "desc",
  setDirection: vi.fn(),
  ...overrides,
});

describe("SearchFilterBar", () => {
  it("renders the search input with placeholder", () => {
    render(<SearchFilterBar {...makeProps({ placeholder: "Найти" })} />);
    expect(screen.getByPlaceholderText("Найти")).toBeInTheDocument();
  });

  it("calls setSearch on typing", async () => {
    const user = userEvent.setup();
    const setSearch = vi.fn();
    render(<SearchFilterBar {...makeProps({ setSearch })} />);
    await user.type(screen.getByLabelText(t("catalog.search.ariaLabel")), "a");
    expect(setSearch).toHaveBeenCalledWith("a");
  });

  it("opens the filter dropdown and toggles onlyOpen", async () => {
    const user = userEvent.setup();
    const setOnlyOpen = vi.fn();
    render(<SearchFilterBar {...makeProps({ setOnlyOpen })} />);
    await user.click(screen.getByLabelText(t("catalog.search.openFilters")));
    expect(screen.getByRole("checkbox")).toBeInTheDocument();
    await user.click(screen.getByRole("checkbox"));
    expect(setOnlyOpen).toHaveBeenCalled();
  });

  it("selects a sort option", async () => {
    const user = userEvent.setup();
    const setSort = vi.fn();
    render(<SearchFilterBar {...makeProps({ setSort })} />);
    await user.click(screen.getByLabelText(t("catalog.search.openFilters")));
    await user.click(screen.getByText(t("catalog.search.sortRating")));
    expect(setSort).toHaveBeenCalledWith("rating");
  });

  it("toggles direction when the active sort is clicked again", async () => {
    const user = userEvent.setup();
    const setDirection = vi.fn();
    render(<SearchFilterBar {...makeProps({ sort: "rating", setDirection })} />);
    await user.click(screen.getByLabelText(t("catalog.search.openFilters")));
    await user.click(screen.getByText(t("catalog.search.sortRating")));
    expect(setDirection).toHaveBeenCalled();
  });

  it("shows the searching spinner", () => {
    const { container } = render(<SearchFilterBar {...makeProps({ searching: true })} />);
    expect(container.querySelector('[aria-hidden="true"]')).toBeInTheDocument();
  });
});
