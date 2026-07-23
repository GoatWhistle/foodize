import { Alert } from "react-native";
import { fireEvent, render, screen } from "@testing-library/react-native";
import { ProfileScreen } from "@/screens/profile/ProfileScreen";
import { useProfilePage } from "@shared/hooks/useProfilePage";
import type { UseProfilePageResult } from "@shared/hooks/useProfilePage";
import type { AuthUser } from "@shared/store/createAuthStore";

const mockPush = jest.fn();
jest.mock("expo-router", () => ({
  useRouter: () => ({ push: mockPush }),
}));

jest.mock("@shared/hooks/useProfilePage", () => ({
  useProfilePage: jest.fn(),
}));

const mockLogout = jest.fn();
const mockedHook = jest.mocked(useProfilePage);

const makeUser = () =>
  ({
    id: "u1",
    name: "Иван",
    phone_number: "+79990001122",
    permissions: [],
    has_password: true,
  }) as AuthUser;

const baseResult = {
  user: makeUser(),
  logout: mockLogout,
  displayName: "Иван Петров",
} as unknown as UseProfilePageResult;

describe("ProfileScreen", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockLogout.mockResolvedValue(undefined);
    mockedHook.mockReturnValue(baseResult);
  });

  it("renders the display name and phone", () => {
    render(<ProfileScreen />);
    expect(screen.getByText("Иван Петров")).toBeTruthy();
    expect(screen.getByText("+79990001122")).toBeTruthy();
  });

  it("navigates to notifications", () => {
    render(<ProfileScreen />);
    fireEvent.press(screen.getByTestId("profile-link-notifications"));
    expect(mockPush).toHaveBeenCalledWith("/notifications");
  });

  it("navigates to settings", () => {
    render(<ProfileScreen />);
    fireEvent.press(screen.getByTestId("profile-link-settings"));
    expect(mockPush).toHaveBeenCalledWith("/settings");
  });

  it("navigates to the terms legal document", () => {
    render(<ProfileScreen />);
    fireEvent.press(screen.getByTestId("profile-link-terms"));
    expect(mockPush).toHaveBeenCalledWith({
      pathname: "/legal/[doc]",
      params: { doc: "terms" },
    });
  });

  it("navigates to the privacy legal document", () => {
    render(<ProfileScreen />);
    fireEvent.press(screen.getByTestId("profile-link-privacy"));
    expect(mockPush).toHaveBeenCalledWith({
      pathname: "/legal/[doc]",
      params: { doc: "privacy" },
    });
  });

  it("confirms and logs out", () => {
    const alertSpy = jest.spyOn(Alert, "alert");
    render(<ProfileScreen />);
    fireEvent.press(screen.getByTestId("profile-logout"));
    expect(alertSpy).toHaveBeenCalled();
    const buttons = alertSpy.mock.calls[0]?.[2];
    const confirm = buttons?.find((b) => b.style === "destructive");
    confirm?.onPress?.();
    expect(mockLogout).toHaveBeenCalled();
    alertSpy.mockRestore();
  });

  it("navigates to orders", () => {
    render(<ProfileScreen />);
    fireEvent.press(screen.getByTestId("profile-link-orders"));
    expect(mockPush).toHaveBeenCalledWith("/(tabs)/orders");
  });

  it("navigates to favorites", () => {
    render(<ProfileScreen />);
    fireEvent.press(screen.getByTestId("profile-link-favorites"));
    expect(mockPush).toHaveBeenCalledWith("/(tabs)/favorites");
  });

  it("renders without a phone number", () => {
    mockedHook.mockReturnValue({
      ...baseResult,
      user: { ...makeUser(), phone_number: "" },
    });
    render(<ProfileScreen />);
    expect(screen.getByText("Иван Петров")).toBeTruthy();
  });
});
