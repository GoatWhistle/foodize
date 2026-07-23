import { fireEvent, render, screen } from "@testing-library/react-native";
import { AppText } from "@/components/AppText";
import { Sheet } from "@/components/ui/Sheet";

describe("Sheet", () => {
  it("renders children and title when visible", () => {
    render(
      <Sheet visible title="Корзина" onClose={jest.fn()}>
        <AppText>Позиция</AppText>
      </Sheet>,
    );
    expect(screen.getByText("Корзина")).toBeTruthy();
    expect(screen.getByText("Позиция")).toBeTruthy();
  });

  it("calls onClose when the backdrop is pressed", () => {
    const onClose = jest.fn();
    render(
      <Sheet visible onClose={onClose}>
        <AppText>X</AppText>
      </Sheet>,
    );
    fireEvent.press(screen.getByLabelText("close"));
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
