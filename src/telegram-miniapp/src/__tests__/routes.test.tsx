import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi, beforeEach } from "vitest";
import type { RouteObject } from "react-router-dom";

vi.mock("./../pages/home/HomePage", () => ({
  HomePage: () => <div>page-home</div>,
}));
vi.mock("./../pages/restaurant/RestaurantPage", () => ({
  RestaurantPage: () => <div>page-restaurant</div>,
}));
vi.mock("./../pages/orders/OrdersPage", () => ({
  OrdersPage: () => <div>page-orders</div>,
}));
vi.mock("./../pages/orders/OrderStatusPage", () => ({
  OrderStatusPage: () => <div>page-order-status</div>,
}));
vi.mock("./../pages/profile/ProfilePage", () => ({
  ProfilePage: () => <div>page-profile</div>,
}));
vi.mock("./../pages/profile/SettingsPage", () => ({
  SettingsPage: () => <div>page-settings</div>,
}));
vi.mock("./../pages/profile/FavoritesPage", () => ({
  FavoritesPage: () => <div>page-favorites</div>,
}));
vi.mock("./../pages/notifications/NotificationsPage", () => ({
  NotificationsPage: () => <div>page-notifications</div>,
}));
vi.mock("@shared/components/LegalPage/LegalPage", () => ({
  LegalPage: () => <div>page-legal</div>,
}));

vi.mock("../components/BottomNav/BottomNav", () => ({
  BottomNav: () => <div data-testid="bottom-nav" />,
}));
vi.mock("../components/ActiveOrderBanner/ActiveOrderBanner", () => ({
  ActiveOrderBanner: () => null,
}));

const cartMock = vi.hoisted(() => ({
  count: 0,
  restaurantId: null as string | null,
}));
vi.mock("../store/useCartStore", () => ({
  useCartStore: Object.assign(
    (sel: (s: { cartCount: () => number; cartRestaurantId: string | null }) => unknown) =>
      sel({ cartCount: () => cartMock.count, cartRestaurantId: cartMock.restaurantId }),
    { getState: () => ({ cartRestaurantId: cartMock.restaurantId }) },
  ),
}));

const capturedRoutes = vi.hoisted(() => ({ current: [] as RouteObject[] }));
const navigateMock = vi.hoisted(() => vi.fn());
vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual<typeof import("react-router-dom")>("react-router-dom");
  return {
    ...actual,
    useNavigate: () => navigateMock,
    createBrowserRouter: (routes: RouteObject[]) => {
      capturedRoutes.current = routes;
      return actual.createMemoryRouter(routes);
    },
  };
});

import { createMemoryRouter, RouterProvider, Navigate } from "react-router-dom";
import { isValidElement } from "react";
import "../routes";

const renderAt = async (path: string) => {
  const router = createMemoryRouter(capturedRoutes.current, {
    initialEntries: [path],
  });
  render(<RouterProvider router={router} />);
  return screen.findByText(/^page-/);
};

describe("routes", () => {
  beforeEach(() => {
    cartMock.count = 0;
    cartMock.restaurantId = null;
  });

  it("captured the route tree from createBrowserRouter", () => {
    expect(capturedRoutes.current.length).toBeGreaterThan(0);
  });

  it.each([
    ["/", "page-home"],
    ["/restaurant/42", "page-restaurant"],
    ["/orders", "page-orders"],
    ["/orders/7", "page-order-status"],
    ["/profile", "page-profile"],
    ["/settings", "page-settings"],
    ["/favorites", "page-favorites"],
    ["/notifications", "page-notifications"],
    ["/legal/terms", "page-legal"],
  ])("renders %s -> %s", async (path, expected) => {
    const el = await renderAt(path);
    expect(el).toHaveTextContent(expected);
  });

  it("shows the global cart fab with the item count and navigates to the cart restaurant", async () => {
    cartMock.count = 3;
    cartMock.restaurantId = "rest-77";
    const router = createMemoryRouter(capturedRoutes.current, {
      initialEntries: ["/"],
    });
    render(<RouterProvider router={router} />);

    const fab = await screen.findByRole("button", { name: /Корзина/ });
    expect(fab).toHaveTextContent("3");

    await userEvent.click(fab);
    expect(navigateMock).toHaveBeenCalledWith("/restaurant/rest-77");
  });

  it("hides the global cart fab on a restaurant page", async () => {
    cartMock.count = 3;
    cartMock.restaurantId = "rest-77";
    const router = createMemoryRouter(capturedRoutes.current, {
      initialEntries: ["/restaurant/1"],
    });
    render(<RouterProvider router={router} />);

    await screen.findByText("page-restaurant");
    expect(
      screen.queryByRole("button", { name: /Корзина/ }),
    ).not.toBeInTheDocument();
  });

  it("declares a catch-all route that redirects to the home page", () => {
    const catchAll = capturedRoutes.current.find((r) => r.path === "*");
    expect(catchAll).toBeDefined();
    const element = catchAll?.element;
    expect(isValidElement(element)).toBe(true);
    expect((element as { type: unknown }).type).toBe(Navigate);
    expect((element as { props: { to: string; replace?: boolean } }).props.to).toBe("/");
    expect((element as { props: { replace?: boolean } }).props.replace).toBe(true);
  });
});
