import { fireEvent, render, screen } from "@testing-library/react-native";
import { AppText } from "@/components/AppText";
import { Card } from "@/components/ui/Card";

describe("Card", () => {
  it("renders children", () => {
    render(
      <Card>
        <AppText>Контент</AppText>
      </Card>,
    );
    expect(screen.getByText("Контент")).toBeTruthy();
  });

  it("acts as a button when onPress is provided", () => {
    const onPress = jest.fn();
    render(
      <Card onPress={onPress} testID="card">
        <AppText>Tap</AppText>
      </Card>,
    );
    fireEvent.press(screen.getByTestId("card"));
    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it("renders unpadded static variant", () => {
    render(
      <Card padded={false} testID="static">
        <AppText>Plain</AppText>
      </Card>,
    );
    expect(screen.getByTestId("static")).toBeTruthy();
  });
});
