import { fireEvent, render, screen } from "@testing-library/react-native";
import { AppText } from "@/components/AppText";
import { IconButton } from "@/components/ui/IconButton";

describe("IconButton", () => {
  it("fires onPress", () => {
    const onPress = jest.fn();
    render(
      <IconButton accessibilityLabel="close" onPress={onPress} testID="ib">
        <AppText>x</AppText>
      </IconButton>,
    );
    fireEvent.press(screen.getByTestId("ib"));
    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it("renders the plain variant", () => {
    render(
      <IconButton accessibilityLabel="plain" variant="plain" testID="plain">
        <AppText>y</AppText>
      </IconButton>,
    );
    expect(screen.getByTestId("plain")).toBeTruthy();
  });
});
