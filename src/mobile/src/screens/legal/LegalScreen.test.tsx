import { render, screen } from "@testing-library/react-native";
import { LegalScreen } from "@/screens/legal/LegalScreen";

describe("LegalScreen", () => {
  it("renders the terms document", () => {
    render(<LegalScreen doc="terms" />);
    expect(screen.getByText("Условия сервиса")).toBeTruthy();
    expect(screen.getByText("1. Общие положения")).toBeTruthy();
  });

  it("renders the privacy document", () => {
    render(<LegalScreen doc="privacy" />);
    expect(screen.getByText("Политика конфиденциальности")).toBeTruthy();
  });

  it("shows a not-found state for an unknown document", () => {
    render(<LegalScreen doc="unknown" />);
    expect(screen.getByText("Страница не найдена")).toBeTruthy();
  });
});
