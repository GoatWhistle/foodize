import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";

const backButtonSentinel = { name: "back-button" };
const getBackButton = vi.fn(() => backButtonSentinel as unknown);
vi.mock("../../telegram/sdk", () => ({
  getBackButton: () => getBackButton(),
}));

interface SharedProps {
  BackButton: unknown;
  pageSize: number;
  showPagination: boolean;
}
let lastProps: SharedProps | null = null;
vi.mock("@shared/pages/FavoritesPage/FavoritesPage", () => ({
  FavoritesPage: (props: SharedProps) => {
    lastProps = props;
    return <div data-testid="shared-favorites" />;
  },
}));

import { FavoritesPage } from "../../pages/profile/FavoritesPage";

beforeEach(() => {
  vi.clearAllMocks();
  lastProps = null;
});

describe("FavoritesPage", () => {
  it("renders the shared favorites page", () => {
    render(<FavoritesPage />);
    expect(screen.getByTestId("shared-favorites")).toBeInTheDocument();
  });

  it("passes the back button and paging config", () => {
    render(<FavoritesPage />);
    expect(lastProps?.BackButton).toBe(backButtonSentinel);
    expect(lastProps?.pageSize).toBe(100);
    expect(lastProps?.showPagination).toBe(false);
  });
});
