import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, it, expect, vi, beforeEach } from "vitest";

const navigateMock = vi.fn();
vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual<typeof import("react-router-dom")>("react-router-dom");
  return { ...actual, useNavigate: () => navigateMock };
});

const backButton = {
  show: vi.fn(),
  hide: vi.fn(),
  onClick: vi.fn(),
  offClick: vi.fn(),
};
let backButtonValue: typeof backButton | null = backButton;
vi.mock("../../telegram/sdk", () => ({
  getBackButton: () => backButtonValue,
}));

interface SharedProps {
  routes: { home: string; orderStatus: string };
  statusFilters: { key: string; labelKey: string }[];
  infiniteScroll: boolean;
}
let lastProps: SharedProps | null = null;
vi.mock("@shared/pages/OrdersPage/OrdersPage", () => ({
  OrdersPage: (props: SharedProps) => {
    lastProps = props;
    return (
      <div data-testid="shared-orders">
        {props.statusFilters.map((f) => (
          <span key={f.key || "all"}>{t(f.labelKey)}</span>
        ))}
      </div>
    );
  },
}));

import { OrdersPage } from "../../pages/orders/OrdersPage";
import { t } from "@shared/i18n/useTranslation";

const renderPage = () =>
  render(
    <MemoryRouter>
      <OrdersPage />
    </MemoryRouter>,
  );

beforeEach(() => {
  vi.clearAllMocks();
  backButtonValue = backButton;
  lastProps = null;
});

describe("OrdersPage", () => {
  it("renders the shared orders page with the status filters", () => {
    renderPage();
    expect(screen.getByTestId("shared-orders")).toBeInTheDocument();
    expect(screen.getByText(t("order.list.filterAll"))).toBeInTheDocument();
    expect(screen.getByText(t("order.list.filterActive"))).toBeInTheDocument();
    expect(screen.getByText(t("order.list.filterCompleted"))).toBeInTheDocument();
  });

  it("passes the home and orderStatus routes to the shared page", () => {
    renderPage();
    expect(lastProps?.routes).toEqual({ home: "/", orderStatus: "/orders/:id" });
    expect(lastProps?.infiniteScroll).toBe(true);
  });

  it("shows the back button and wires it to navigate home", () => {
    renderPage();
    expect(backButton.show).toHaveBeenCalledTimes(1);
    expect(backButton.onClick).toHaveBeenCalledTimes(1);
    const handler = backButton.onClick.mock.calls[0]?.[0] as () => void;
    handler();
    expect(navigateMock).toHaveBeenCalledWith("/");
  });

  it("hides the back button on unmount", () => {
    const { unmount } = renderPage();
    unmount();
    expect(backButton.offClick).toHaveBeenCalledTimes(1);
    expect(backButton.hide).toHaveBeenCalledTimes(1);
  });

  it("renders without a back button when the SDK has none", () => {
    backButtonValue = null;
    renderPage();
    expect(screen.getByTestId("shared-orders")).toBeInTheDocument();
    expect(backButton.show).not.toHaveBeenCalled();
  });
});
