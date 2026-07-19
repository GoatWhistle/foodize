import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi } from "vitest";
import { SearchFilterBar } from "./SearchFilterBar";

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
    await user.type(screen.getByLabelText("Поиск заведения"), "a");
    expect(setSearch).toHaveBeenCalledWith("a");
  });

  it("opens the filter dropdown and toggles onlyOpen", async () => {
    const user = userEvent.setup();
    const setOnlyOpen = vi.fn();
    render(<SearchFilterBar {...makeProps({ setOnlyOpen })} />);
    await user.click(screen.getByLabelText("Открыть фильтры"));
    expect(screen.getByRole("checkbox")).toBeInTheDocument();
    await user.click(screen.getByRole("checkbox"));
    expect(setOnlyOpen).toHaveBeenCalled();
  });

  it("selects a sort option", async () => {
    const user = userEvent.setup();
    const setSort = vi.fn();
    render(<SearchFilterBar {...makeProps({ setSort })} />);
    await user.click(screen.getByLabelText("Открыть фильтры"));
    await user.click(screen.getByText("Оценка"));
    expect(setSort).toHaveBeenCalledWith("rating");
  });

  it("toggles direction when the active sort is clicked again", async () => {
    const user = userEvent.setup();
    const setDirection = vi.fn();
    render(<SearchFilterBar {...makeProps({ sort: "rating", setDirection })} />);
    await user.click(screen.getByLabelText("Открыть фильтры"));
    await user.click(screen.getByText("Оценка"));
    expect(setDirection).toHaveBeenCalled();
  });

  it("shows the searching spinner", () => {
    const { container } = render(<SearchFilterBar {...makeProps({ searching: true })} />);
    expect(container.querySelector('[aria-hidden="true"]')).toBeInTheDocument();
  });
});
