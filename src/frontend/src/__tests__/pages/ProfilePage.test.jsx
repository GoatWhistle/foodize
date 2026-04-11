import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { BrowserRouter } from "react-router-dom";
import ProfilePage from "../../pages/profile/ProfilePage";
import { useAuthStore } from "../../store/useAuthStore";

vi.mock("../../store/useAuthStore", () => ({
  useAuthStore: vi.fn((sel) => {
    const state = {
      user: { name: "Ivan Ivanov", phone_number: "+7999" },
      logout: vi.fn(),
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

describe("ProfilePage", () => {
  const logoutMock = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useAuthStore).mockImplementation((sel) => {
      const state = {
        user: { name: "Ivan Ivanov", phone_number: "+7999" },
        logout: logoutMock,
      };
      return sel ? sel(state) : state;
    });
  });

  it("renders user info and initials", () => {
    render(
      <BrowserRouter>
        <ProfilePage />
      </BrowserRouter>,
    );

    expect(screen.getByText("Ivan Ivanov")).toBeDefined();
    expect(screen.getByText("+7999")).toBeDefined();
    expect(screen.getByText("II")).toBeDefined(); // Initials
  });

  it("calls logout and navigates on click", async () => {
    render(
      <BrowserRouter>
        <ProfilePage />
      </BrowserRouter>,
    );

    fireEvent.click(screen.getByText(/Выйти/));
    expect(logoutMock).toHaveBeenCalled();
    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith("/login");
    });
  });

  it("navigates to orders from menu", () => {
    render(
      <BrowserRouter>
        <ProfilePage />
      </BrowserRouter>,
    );

    fireEvent.click(screen.getByText(/Мои заказы/));
    expect(mockNavigate).toHaveBeenCalledWith("/orders");
  });
});
