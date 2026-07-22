import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { BottomNav } from "../../components/BottomNav/BottomNav";
import { t } from "@shared/i18n/useTranslation";
const navigateMock = vi.fn();

vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual<typeof import("react-router-dom")>("react-router-dom");
  return {
    ...actual,
    useNavigate: () => navigateMock,
  };
});

const selectionChanged = vi.fn();
vi.mock("../../telegram/sdk", () => ({
  getHapticFeedback: () => ({ selectionChanged }),
}));

interface NotificationStoreState {
  unreadCount: number;
  connectionStatus: string;
  wasEverConnected: boolean;
}

let storeState: NotificationStoreState;

vi.mock("../../store/useNotificationStore", () => ({
  useNotificationStore: vi.fn((sel?: (s: NotificationStoreState) => unknown) =>
    sel ? sel(storeState) : storeState,
  ),
}));

const makeStore = (o: Partial<NotificationStoreState> = {}): NotificationStoreState => ({
  unreadCount: 0,
  connectionStatus: "connected",
  wasEverConnected: false,
  ...o,
});

const renderAt = (path = "/") =>
  render(
    <MemoryRouter initialEntries={[path]}>
      <BottomNav />
    </MemoryRouter>,
  );

beforeEach(() => {
  storeState = makeStore();
});

afterEach(() => {
  vi.clearAllMocks();
});

describe("BottomNav", () => {
  it("renders all three tabs", () => {
    renderAt();
    expect(screen.getByText(t("profile.nav.restaurants"))).toBeInTheDocument();
    expect(screen.getByText(t("profile.nav.orders"))).toBeInTheDocument();
    expect(screen.getByText(t("profile.nav.profile"))).toBeInTheDocument();
  });

  it("shows no unread badge when count is 0", () => {
    renderAt();
    expect(screen.queryByText("1")).not.toBeInTheDocument();
  });

  it("shows the unread badge when unreadCount > 0", () => {
    storeState = makeStore({ unreadCount: 3 });
    renderAt();
    expect(screen.getByText("3")).toBeInTheDocument();
  });

  it("caps the unread badge at 9+", () => {
    storeState = makeStore({ unreadCount: 42 });
    renderAt();
    expect(screen.getByText("9+")).toBeInTheDocument();
  });

  it("shows a connection-issue badge when reconnecting after a prior connection", () => {
    storeState = makeStore({
      connectionStatus: "reconnecting",
      wasEverConnected: true,
    });
    renderAt();
    expect(screen.getByTitle(t("profile.notifications.connectionIssue"))).toBeInTheDocument();
  });

  it("navigates to the orders tab on click", async () => {
    renderAt("/");
    await userEvent.click(screen.getByText(t("profile.nav.orders")));
    expect(navigateMock).toHaveBeenCalledWith("/orders");
  });

  it("fires haptic feedback when navigating to an inactive tab", async () => {
    renderAt("/");
    await userEvent.click(screen.getByText(t("profile.nav.profile")));
    expect(selectionChanged).toHaveBeenCalled();
  });

  it("does not fire haptic feedback when clicking the already-active tab", async () => {
    renderAt("/orders");
    await userEvent.click(screen.getByText(t("profile.nav.orders")));
    expect(selectionChanged).not.toHaveBeenCalled();
  });
});
