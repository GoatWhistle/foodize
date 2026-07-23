import { render, screen } from "@testing-library/react-native";
import { AppText } from "@/components/AppText";

describe("AppText", () => {
  it("renders its children", () => {
    render(<AppText>Foodize</AppText>);
    expect(screen.getByText("Foodize")).toBeTruthy();
  });

  it("renders with a variant and color without crashing", () => {
    render(
      <AppText variant="title" color="accent">
        Заголовок
      </AppText>,
    );
    expect(screen.getByText("Заголовок")).toBeTruthy();
  });
});
