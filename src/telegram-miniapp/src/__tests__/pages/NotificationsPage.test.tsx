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
let tgValue: { BackButton: typeof backButton } | null = { BackButton: backButton };
vi.mock("../../telegram/sdk", () => ({
  get tg() {
    return tgValue;
  },
}));

vi.mock("../../store/useNotificationStore", () => ({
  useNotificationStore: { name: "notification-store" },
}));

interface SharedProps {
  useNotificationStore: unknown;
  stickyHeader: boolean;
  markAllReadOnOpen: boolean;
}
let lastProps: SharedProps | null = null;
vi.mock("@shared/pages/NotificationsPage/NotificationsPage", () => ({
  NotificationsPage: (props: SharedProps) => {
    lastProps = props;
    return <div data-testid="shared-notifications" />;
  },
}));

import { NotificationsPage } from "../../pages/notifications/NotificationsPage";
import { useNotificationStore } from "../../store/useNotificationStore";

const renderPage = () =>
  render(
    <MemoryRouter>
      <NotificationsPage />
    </MemoryRouter>,
  );

beforeEach(() => {
  vi.clearAllMocks();
  tgValue = { BackButton: backButton };
  lastProps = null;
});

describe("NotificationsPage", () => {
  it("renders the shared notifications page with the store and flags", () => {
    renderPage();
    expect(screen.getByTestId("shared-notifications")).toBeInTheDocument();
    expect(lastProps?.useNotificationStore).toBe(useNotificationStore);
    expect(lastProps?.stickyHeader).toBe(true);
    expect(lastProps?.markAllReadOnOpen).toBe(true);
  });

  it("shows the back button and navigates to profile on click", () => {
    renderPage();
    expect(backButton.show).toHaveBeenCalledTimes(1);
    const handler = backButton.onClick.mock.calls[0]?.[0] as () => void;
    handler();
    expect(navigateMock).toHaveBeenCalledWith("/profile");
  });

  it("cleans up the back button on unmount", () => {
    const { unmount } = renderPage();
    unmount();
    expect(backButton.offClick).toHaveBeenCalledTimes(1);
    expect(backButton.hide).toHaveBeenCalledTimes(1);
  });

  it("renders without a back button when tg is unavailable", () => {
    tgValue = null;
    renderPage();
    expect(screen.getByTestId("shared-notifications")).toBeInTheDocument();
    expect(backButton.show).not.toHaveBeenCalled();
  });
});
