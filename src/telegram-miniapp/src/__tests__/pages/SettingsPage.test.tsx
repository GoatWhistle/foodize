import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";

const backButtonSentinel = { name: "back-button" };
let initData: string;
const getTelegramInitData = vi.fn(() => initData);
vi.mock("../../telegram/sdk", () => ({
  getBackButton: () => backButtonSentinel,
  getTelegramInitData: () => getTelegramInitData(),
}));

interface SharedProps {
  routes: Record<string, string>;
  BackButton: unknown;
  showPasswordChange: boolean;
}
let lastProps: SharedProps | null = null;
vi.mock("@shared/pages/SettingsPage/SettingsPage", () => ({
  SettingsPage: (props: SharedProps) => {
    lastProps = props;
    return <div data-testid="shared-settings" />;
  },
}));

import { SettingsPage } from "../../pages/profile/SettingsPage";

beforeEach(() => {
  vi.clearAllMocks();
  initData = "";
  lastProps = null;
});

describe("SettingsPage", () => {
  it("renders the shared settings page with the route table", () => {
    render(<SettingsPage />);
    expect(screen.getByTestId("shared-settings")).toBeInTheDocument();
    expect(lastProps?.routes).toMatchObject({
      profile: "/profile",
      terms: "/legal/terms",
      privacy: "/legal/privacy",
    });
    expect(lastProps?.BackButton).toBe(backButtonSentinel);
  });

  it("hides the password change for a Telegram session", () => {
    initData = "tg-init-data";
    render(<SettingsPage />);
    expect(lastProps?.showPasswordChange).toBe(false);
  });

  it("shows the password change when there is no Telegram session", () => {
    initData = "";
    render(<SettingsPage />);
    expect(lastProps?.showPasswordChange).toBe(true);
  });

  it("treats a throwing init data accessor as a non-Telegram session", () => {
    getTelegramInitData.mockImplementationOnce(() => {
      throw new Error("no telegram");
    });
    render(<SettingsPage />);
    expect(lastProps?.showPasswordChange).toBe(true);
  });
});
