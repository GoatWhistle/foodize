import { fireEvent, render, screen, waitFor } from "@testing-library/react-native";
import { RegisterScreen } from "@/screens/auth/RegisterScreen";

const mockReplace = jest.fn();
const mockRegister = jest.fn<Promise<void>, [unknown]>();
const mockLogin = jest.fn<Promise<void>, [unknown]>();

jest.mock("expo-router", () => ({
  useRouter: () => ({ replace: mockReplace, push: jest.fn(), back: jest.fn() }),
  Link: ({ children }: { children: React.ReactNode }) => children,
}));

jest.mock("@/store/useAuthStore", () => ({
  useAuthStore: (selector: (s: { register: unknown; login: unknown }) => unknown) =>
    selector({ register: mockRegister, login: mockLogin }),
}));

const fillValid = (): void => {
  fireEvent.changeText(screen.getByTestId("register-name"), "Иван");
  fireEvent.changeText(screen.getByTestId("register-phone"), "+79991234567");
  fireEvent.changeText(screen.getByTestId("register-password"), "secret12");
};

describe("RegisterScreen", () => {
  beforeEach(() => {
    mockReplace.mockClear();
    mockRegister.mockReset();
    mockLogin.mockReset();
    mockRegister.mockResolvedValue(undefined);
    mockLogin.mockResolvedValue(undefined);
  });

  it("requires a name", () => {
    render(<RegisterScreen />);
    fireEvent.press(screen.getByTestId("register-submit"));
    expect(screen.getByText("Введите имя")).toBeTruthy();
    expect(mockRegister).not.toHaveBeenCalled();
  });

  it("validates the phone", () => {
    render(<RegisterScreen />);
    fireEvent.changeText(screen.getByTestId("register-name"), "Иван");
    fireEvent.changeText(screen.getByTestId("register-phone"), "12");
    fireEvent.changeText(screen.getByTestId("register-password"), "secret12");
    fireEvent.press(screen.getByTestId("register-submit"));
    expect(screen.getByText("Введите корректный номер телефона")).toBeTruthy();
  });

  it("rejects a too-short password", () => {
    render(<RegisterScreen />);
    fireEvent.changeText(screen.getByTestId("register-name"), "Иван");
    fireEvent.changeText(screen.getByTestId("register-phone"), "+79991234567");
    fireEvent.changeText(screen.getByTestId("register-password"), "ab1");
    fireEvent.press(screen.getByTestId("register-submit"));
    expect(screen.getByText("Пароль должен быть не менее 8 символов")).toBeTruthy();
  });

  it("rejects a password without a letter", () => {
    render(<RegisterScreen />);
    fireEvent.changeText(screen.getByTestId("register-name"), "Иван");
    fireEvent.changeText(screen.getByTestId("register-phone"), "+79991234567");
    fireEvent.changeText(screen.getByTestId("register-password"), "12345678");
    fireEvent.press(screen.getByTestId("register-submit"));
    expect(screen.getByText("Пароль должен содержать хотя бы одну латинскую букву")).toBeTruthy();
  });

  it("rejects a password without a digit or special char", () => {
    render(<RegisterScreen />);
    fireEvent.changeText(screen.getByTestId("register-name"), "Иван");
    fireEvent.changeText(screen.getByTestId("register-phone"), "+79991234567");
    fireEvent.changeText(screen.getByTestId("register-password"), "abcdefgh");
    fireEvent.press(screen.getByTestId("register-submit"));
    expect(
      screen.getByText("Пароль должен содержать хотя бы одну цифру или спецсимвол"),
    ).toBeTruthy();
  });

  it("registers, logs in and redirects on success", async () => {
    render(<RegisterScreen />);
    fillValid();
    fireEvent.press(screen.getByTestId("register-submit"));
    await waitFor(() => {
      expect(mockRegister).toHaveBeenCalledWith({
        name: "Иван",
        phone_number: "+79991234567",
        password: "secret12",
      });
    });
    await waitFor(() => {
      expect(mockLogin).toHaveBeenCalledWith({ phone_number: "+79991234567", password: "secret12" });
    });
    expect(mockReplace).toHaveBeenCalledWith("/(tabs)");
  });

  it("shows an error when registration fails", async () => {
    mockRegister.mockRejectedValueOnce({ response: { status: 400 } });
    render(<RegisterScreen />);
    fillValid();
    fireEvent.press(screen.getByTestId("register-submit"));
    await waitFor(() => {
      expect(screen.getByTestId("register-error")).toBeTruthy();
    });
    expect(mockReplace).not.toHaveBeenCalled();
  });
});
