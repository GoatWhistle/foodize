import { fireEvent, render, screen } from "@testing-library/react-native";
import { Button } from "@/components/ui/Button";

describe("Button", () => {
  it("renders the title and fires onPress", () => {
    const onPress = jest.fn();
    render(<Button title="Заказать" onPress={onPress} />);
    fireEvent.press(screen.getByText("Заказать"));
    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it("does not fire onPress when disabled", () => {
    const onPress = jest.fn();
    render(<Button title="Заказать" onPress={onPress} disabled />);
    fireEvent.press(screen.getByText("Заказать"));
    expect(onPress).not.toHaveBeenCalled();
  });

  it("shows a spinner and hides the title when loading", () => {
    render(<Button title="Заказать" loading testID="btn" />);
    expect(screen.queryByText("Заказать")).toBeNull();
  });

  it("renders each variant and size without crashing", () => {
    const variants = ["primary", "secondary", "ghost", "danger"] as const;
    const sizes = ["sm", "md", "lg"] as const;
    variants.forEach((variant) => {
      sizes.forEach((size) => {
        const view = render(
          <Button title="X" variant={variant} size={size} fullWidth={false} />,
        );
        expect(view.getByText("X")).toBeTruthy();
        view.unmount();
      });
    });
  });

  it("renders a left icon when provided", () => {
    render(<Button title="Icon" leftIcon={<></>} />);
    expect(screen.getByText("Icon")).toBeTruthy();
  });
});
