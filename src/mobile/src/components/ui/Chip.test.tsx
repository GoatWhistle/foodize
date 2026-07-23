import { fireEvent, render, screen } from "@testing-library/react-native";
import { Chip } from "@/components/ui/Chip";

describe("Chip", () => {
  it("fires onPress and reflects selected state", () => {
    const onPress = jest.fn();
    render(<Chip label="Пицца" selected onPress={onPress} testID="chip" />);
    fireEvent.press(screen.getByTestId("chip"));
    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it("renders unselected by default", () => {
    render(<Chip label="Суши" />);
    expect(screen.getByText("Суши")).toBeTruthy();
  });
});
