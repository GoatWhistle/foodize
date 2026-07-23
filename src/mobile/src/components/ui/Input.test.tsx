import { fireEvent, render, screen } from "@testing-library/react-native";
import { Input } from "@/components/ui/Input";

describe("Input", () => {
  it("renders a label and reacts to text changes", () => {
    const onChangeText = jest.fn();
    render(<Input label="Телефон" placeholder="+7" onChangeText={onChangeText} />);
    expect(screen.getByText("Телефон")).toBeTruthy();
    fireEvent.changeText(screen.getByPlaceholderText("+7"), "999");
    expect(onChangeText).toHaveBeenCalledWith("999");
  });

  it("renders an error message", () => {
    render(<Input placeholder="p" error="Неверный номер" />);
    expect(screen.getByText("Неверный номер")).toBeTruthy();
  });

  it("renders left and right icons", () => {
    render(<Input placeholder="p" leftIcon={<></>} rightIcon={<></>} />);
    expect(screen.getByPlaceholderText("p")).toBeTruthy();
  });

  it("renders without label or error", () => {
    render(<Input placeholder="bare" />);
    expect(screen.getByPlaceholderText("bare")).toBeTruthy();
  });
});
