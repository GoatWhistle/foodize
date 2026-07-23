import { fireEvent, render, screen } from "@testing-library/react-native";
import { CategoryChips } from "@/components/domain/CategoryChips";

const items = [
  { value: "a", label: "Alpha" },
  { value: "b", label: "Beta" },
];

describe("CategoryChips", () => {
  it("renders all chips", () => {
    render(<CategoryChips items={items} selected="a" onSelect={jest.fn()} />);
    expect(screen.getByText("Alpha")).toBeTruthy();
    expect(screen.getByText("Beta")).toBeTruthy();
  });

  it("calls onSelect with the chip value", () => {
    const onSelect = jest.fn();
    render(<CategoryChips items={items} selected="a" onSelect={onSelect} />);
    fireEvent.press(screen.getByTestId("chip-b"));
    expect(onSelect).toHaveBeenCalledWith("b");
  });
});
