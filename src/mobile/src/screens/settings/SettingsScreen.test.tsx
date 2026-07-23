import { fireEvent, render, screen, waitFor } from "@testing-library/react-native";
import { SettingsScreen } from "@/screens/settings/SettingsScreen";
import { useThemeStore } from "@shared/store/useThemeStore";
import { useLanguageStore } from "@/i18n";
import { registerDeviceToken } from "@/services/push";

const mockSetTheme = jest.fn();
const mockSetLanguage = jest.fn();

jest.mock("@shared/store/useThemeStore", () => ({
  useThemeStore: jest.fn(),
}));

jest.mock("@/i18n", () => {
  const actual = jest.requireActual<Record<string, unknown>>("@/i18n");
  return { ...actual, useLanguageStore: jest.fn() };
});

jest.mock("@/services/push", () => ({
  registerDeviceToken: jest.fn(),
}));

const mockedTheme = jest.mocked(useThemeStore) as unknown as jest.Mock;
const mockedLanguage = jest.mocked(useLanguageStore) as unknown as jest.Mock;
const mockedRegister = jest.mocked(registerDeviceToken);

describe("SettingsScreen", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockedTheme.mockImplementation(
      (selector: (s: { theme: string; setTheme: unknown }) => unknown) =>
        selector({ theme: "system", setTheme: mockSetTheme }),
    );
    mockedLanguage.mockImplementation(
      (selector: (s: { language: string; setLanguage: unknown }) => unknown) =>
        selector({ language: "ru", setLanguage: mockSetLanguage }),
    );
  });

  it("renders theme and language options", () => {
    render(<SettingsScreen />);
    expect(screen.getByTestId("theme-light")).toBeTruthy();
    expect(screen.getByTestId("theme-dark")).toBeTruthy();
    expect(screen.getByTestId("language-ru")).toBeTruthy();
    expect(screen.getByTestId("language-en")).toBeTruthy();
  });

  it("changes the theme", () => {
    render(<SettingsScreen />);
    fireEvent.press(screen.getByTestId("theme-dark"));
    expect(mockSetTheme).toHaveBeenCalledWith("dark");
  });

  it("changes the language", () => {
    render(<SettingsScreen />);
    fireEvent.press(screen.getByTestId("language-en"));
    expect(mockSetLanguage).toHaveBeenCalledWith("en");
  });

  it("enables push when a token is returned", async () => {
    mockedRegister.mockResolvedValueOnce({ token: "ExponentPushToken[x]", registered: true });
    render(<SettingsScreen />);
    fireEvent.press(screen.getByTestId("push-enable"));
    await waitFor(() => {
      expect(screen.getByTestId("push-enabled")).toBeTruthy();
    });
    expect(mockedRegister).toHaveBeenCalledWith("ru");
  });

  it("shows a loading label while enabling push", async () => {
    let resolveToken: (value: { token: string | null; registered: boolean }) => void = () => {};
    mockedRegister.mockReturnValueOnce(
      new Promise((resolve) => {
        resolveToken = resolve;
      }),
    );
    render(<SettingsScreen />);
    fireEvent.press(screen.getByTestId("push-enable"));
    await waitFor(() => {
      expect(screen.getByText("Загрузка...")).toBeTruthy();
    });
    resolveToken({ token: "ExponentPushToken[x]", registered: true });
    await waitFor(() => {
      expect(screen.getByTestId("push-enabled")).toBeTruthy();
    });
  });

  it("ignores repeated taps while push is loading", async () => {
    let resolveToken: (value: { token: string | null; registered: boolean }) => void = () => {};
    mockedRegister.mockReturnValueOnce(
      new Promise((resolve) => {
        resolveToken = resolve;
      }),
    );
    render(<SettingsScreen />);
    fireEvent.press(screen.getByTestId("push-enable"));
    fireEvent.press(screen.getByTestId("push-enable"));
    resolveToken({ token: "ExponentPushToken[x]", registered: true });
    await waitFor(() => {
      expect(screen.getByTestId("push-enabled")).toBeTruthy();
    });
    expect(mockedRegister).toHaveBeenCalledTimes(1);
  });

  it("shows a denied message when no token is returned", async () => {
    mockedRegister.mockResolvedValueOnce({ token: null, registered: false });
    render(<SettingsScreen />);
    fireEvent.press(screen.getByTestId("push-enable"));
    await waitFor(() => {
      expect(screen.getByTestId("push-denied")).toBeTruthy();
    });
  });
});
