import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";

let ordersTotal: number;
vi.mock("../../store/useOrdersStore", () => ({
  useOrdersStore: (sel: (s: { ordersTotal: number }) => unknown) =>
    sel({ ordersTotal }),
}));

let favoriteIds: string[];
vi.mock("@shared/store/useFavoriteStore", () => ({
  useFavoriteStore: (sel: (s: { favoriteIds: string[] }) => unknown) =>
    sel({ favoriteIds }),
}));

let unreadCount: number;
vi.mock("../../store/useNotificationStore", () => ({
  useNotificationStore: (sel: (s: { unreadCount: number }) => unknown) =>
    sel({ unreadCount }),
}));

const backButtonSentinel = { name: "back-button" };
let tgUser: { photo_url?: string } | null;
vi.mock("../../telegram/sdk", () => ({
  getBackButton: () => backButtonSentinel,
  getTelegramUser: () => tgUser,
}));

interface SharedProps {
  ordersTotal: number;
  favoritesCount: number;
  unreadCount: number;
  avatarUrl: string | null;
  routes: Record<string, string>;
  onLogout: () => void;
  BackButton: unknown;
}
let lastProps: SharedProps | null = null;
vi.mock("@shared/pages/ProfilePage/ProfilePage", () => ({
  ProfilePage: (props: SharedProps) => {
    lastProps = props;
    return (
      <div data-testid="shared-profile">
        <span>orders:{props.ordersTotal}</span>
        <span>favs:{props.favoritesCount}</span>
        <span>unread:{props.unreadCount}</span>
      </div>
    );
  },
}));

import { ProfilePage } from "../../pages/profile/ProfilePage";

beforeEach(() => {
  vi.clearAllMocks();
  ordersTotal = 5;
  favoriteIds = ["a", "b", "c"];
  unreadCount = 2;
  tgUser = { photo_url: "https://example.com/me.jpg" };
  lastProps = null;
});

describe("ProfilePage", () => {
  it("renders the shared profile page with aggregated counts", () => {
    render(<ProfilePage />);
    expect(screen.getByTestId("shared-profile")).toBeInTheDocument();
    expect(screen.getByText("orders:5")).toBeInTheDocument();
    expect(screen.getByText("favs:3")).toBeInTheDocument();
    expect(screen.getByText("unread:2")).toBeInTheDocument();
  });

  it("passes the avatar url and route table", () => {
    render(<ProfilePage />);
    expect(lastProps?.avatarUrl).toBe("https://example.com/me.jpg");
    expect(lastProps?.routes).toMatchObject({
      orders: "/orders",
      favorites: "/favorites",
      notifications: "/notifications",
      settings: "/settings",
    });
  });

  it("passes the Telegram back button through to the shared page", () => {
    render(<ProfilePage />);
    expect(lastProps?.BackButton).toBe(backButtonSentinel);
  });

  it("redirects to the home route on logout", () => {
    const assignMock = vi.fn();
    const original = window.location;
    Object.defineProperty(window, "location", {
      configurable: true,
      value: { href: original.href, assign: assignMock },
    });

    render(<ProfilePage />);
    lastProps?.onLogout();
    expect(assignMock).toHaveBeenCalledWith("/");

    Object.defineProperty(window, "location", {
      configurable: true,
      value: original,
    });
  });

  it("defaults counts to zero and avatar to null when data is missing", () => {
    ordersTotal = 0;
    favoriteIds = [];
    unreadCount = 0;
    tgUser = null;
    render(<ProfilePage />);
    expect(screen.getByText("orders:0")).toBeInTheDocument();
    expect(screen.getByText("favs:0")).toBeInTheDocument();
    expect(lastProps?.avatarUrl).toBeNull();
  });
});
