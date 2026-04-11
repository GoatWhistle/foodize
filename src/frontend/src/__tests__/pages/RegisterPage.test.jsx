import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { BrowserRouter } from "react-router-dom";
import RegisterPage from "../../pages/auth/RegisterPage";
import { useAuthStore } from "../../store/useAuthStore";

// Mock useAuthStore
vi.mock("../../store/useAuthStore", () => ({
  useAuthStore: vi.fn((sel) => {
    const state = {
      register: vi.fn(),
      login: vi.fn(),
    };
    return sel ? sel(state) : state;
  }),
}));

const mockNavigate = vi.fn();
vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual("react-router-dom");
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

describe("RegisterPage", () => {
  const registerMock = vi.fn();
  const loginMock = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useAuthStore).mockImplementation((sel) => {
      const state = {
        register: registerMock,
        login: loginMock,
      };
      return sel ? sel(state) : state;
    });
  });

  it("renders registration form", () => {
    render(
      <BrowserRouter>
        <RegisterPage />
      </BrowserRouter>,
    );

    expect(screen.getByLabelText("Имя")).toBeDefined();
    expect(screen.getByLabelText("Телефон")).toBeDefined();
    expect(screen.getByLabelText("Пароль")).toBeDefined();
    expect(
      screen.getByRole("button", { name: "Создать аккаунт" }),
    ).toBeDefined();
  });

  it("switches roles", () => {
    render(
      <BrowserRouter>
        <RegisterPage />
      </BrowserRouter>,
    );

    const vendorOption = screen.getByText("Вендор");
    fireEvent.click(vendorOption);

    expect(vendorOption.parentElement.className).toContain("selected");
  });

  it("registers and logs in on submit", async () => {
    registerMock.mockResolvedValueOnce();
    loginMock.mockResolvedValueOnce();

    render(
      <BrowserRouter>
        <RegisterPage />
      </BrowserRouter>,
    );

    fireEvent.change(screen.getByLabelText("Имя"), {
      target: { value: "Ivan" },
    });
    fireEvent.change(screen.getByLabelText("Телефон"), {
      target: { value: "111" },
    });
    fireEvent.change(screen.getByLabelText("Пароль"), {
      target: { value: "pw123456" },
    });

    fireEvent.click(screen.getByRole("button", { name: "Создать аккаунт" }));

    await waitFor(() => {
      expect(registerMock).toHaveBeenCalledWith(
        expect.objectContaining({
          name: "Ivan",
          phone_number: "111",
          user_role: "CUSTOMER",
        }),
      );
      expect(loginMock).toHaveBeenCalled();
      expect(mockNavigate).toHaveBeenCalledWith("/");
    });
  });
});
