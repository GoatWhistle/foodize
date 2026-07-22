import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi } from "vitest";
import { Pagination } from "@shared/components/Pagination/Pagination";
import { t } from "@shared/i18n/useTranslation";

describe("Pagination", () => {
  it("renders nothing when there is a single page or fewer", () => {
    const { container } = render(
      <Pagination page={1} totalPages={1} onPageChange={vi.fn()} />,
    );
    expect(container).toBeEmptyDOMElement();
  });

  it("shows current page and total", () => {
    render(<Pagination page={2} totalPages={5} onPageChange={vi.fn()} />);
    expect(screen.getByText("2 / 5")).toBeInTheDocument();
  });

  it("disables the previous button on the first page", () => {
    render(<Pagination page={1} totalPages={3} onPageChange={vi.fn()} />);
    expect(screen.getByRole("button", { name: t("catalog.pagination.goToPage", { page: 0 }) })).toBeDisabled();
    expect(screen.getByRole("button", { name: t("catalog.pagination.goToPage", { page: 2 }) })).toBeEnabled();
  });

  it("disables the next button on the last page", () => {
    render(<Pagination page={3} totalPages={3} onPageChange={vi.fn()} />);
    expect(screen.getByRole("button", { name: t("catalog.pagination.goToPage", { page: 4 }) })).toBeDisabled();
    expect(screen.getByRole("button", { name: t("catalog.pagination.goToPage", { page: 2 }) })).toBeEnabled();
  });

  it("calls onPageChange with the next page when clicking forward", async () => {
    const user = userEvent.setup();
    const onPageChange = vi.fn();
    render(<Pagination page={2} totalPages={5} onPageChange={onPageChange} />);
    await user.click(screen.getByRole("button", { name: t("catalog.pagination.goToPage", { page: 3 }) }));
    expect(onPageChange).toHaveBeenCalledWith(3);
  });

  it("calls onPageChange with the previous page when clicking back", async () => {
    const user = userEvent.setup();
    const onPageChange = vi.fn();
    render(<Pagination page={2} totalPages={5} onPageChange={onPageChange} />);
    await user.click(screen.getByRole("button", { name: t("catalog.pagination.goToPage", { page: 1 }) }));
    expect(onPageChange).toHaveBeenCalledWith(1);
  });

  it("does not fire onPageChange when a bounded button is disabled", async () => {
    const user = userEvent.setup();
    const onPageChange = vi.fn();
    render(<Pagination page={1} totalPages={3} onPageChange={onPageChange} />);
    await user.click(screen.getByRole("button", { name: t("catalog.pagination.goToPage", { page: 0 }) }));
    expect(onPageChange).not.toHaveBeenCalled();
  });
});
