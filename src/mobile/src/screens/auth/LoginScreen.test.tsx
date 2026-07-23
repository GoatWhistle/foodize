import { fireEvent, render, screen, waitFor } from "@testing-library/react-native";
import { LoginScreen } from "@/screens/auth/LoginScreen";

const mockReplace = jest.fn();
const mockLogin = jest.fn<Promise<void>, [unknown]>();

jest.mock("expo-router", () => ({
  useRouter: () => ({ replace: mockReplace, push: jest.fn(), back: jest.fn() }),
  Link: ({ children }: { children: React.ReactNode }) => children,
}));

jest.mock("@/store/useAuthStore", () => ({
  useAuthStore: (selector: (s: { login: unknown }) => unknown) => selector({ login: mockLogin }),
}));

describe("LoginScreen", () => {
  beforeEach(() => {
    mockReplace.mockClear();
    mockLogin.mockReset();
    mockLogin.mockResolvedValue(undefined);
  });

  it("shows an error when phone or password is empty", () => {
    render(<LoginScreen />);
    fireEvent.press(screen.getByTestId("login-submit"));
    expect(screen.getByTestId("login-error")).toBeTruthy();
    expect(mockLogin).not.toHaveBeenCalled();
  });

  it("shows an error for an invalid phone", () => {
    render(<LoginScreen />);
    fireEvent.changeText(screen.getByTestId("login-phone"), "123");
    fireEvent.changeText(screen.getByTestId("login-password"), "secret12");
    fireEvent.press(screen.getByTestId("login-submit"));
    expect(screen.getByText("Введите корректный номер телефона")).toBeTruthy();
    expect(mockLogin).not.toHaveBeenCalled();
  });

  it("logs in and redirects on success", async () => {
    render(<LoginScreen />);
    fireEvent.changeText(screen.getByTestId("login-phone"), "+79991234567");
    fireEvent.changeText(screen.getByTestId("login-password"), "secret12");
    fireEvent.press(screen.getByTestId("login-submit"));
    await waitFor(() => {
      expect(mockLogin).toHaveBeenCalledWith({ phone_number: "+79991234567", password: "secret12" });
    });
    await waitFor(() => {
      expect(mockReplace).toHaveBeenCalledWith("/(tabs)");
    });
  });

  it("shows a translated error when login fails", async () => {
    mockLogin.mockRejectedValueOnce({ response: { status: 401 } });
    render(<LoginScreen />);
    fireEvent.changeText(screen.getByTestId("login-phone"), "+79991234567");
    fireEvent.changeText(screen.getByTestId("login-password"), "secret12");
    fireEvent.press(screen.getByTestId("login-submit"));
    await waitFor(() => {
      expect(screen.getByTestId("login-error")).toBeTruthy();
    });
    expect(mockReplace).not.toHaveBeenCalled();
  });
});
