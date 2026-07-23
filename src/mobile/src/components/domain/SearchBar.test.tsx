import { fireEvent, render, screen } from "@testing-library/react-native";
import { SearchBar } from "@/components/domain/SearchBar";

describe("SearchBar", () => {
  it("renders placeholder and forwards text changes", () => {
    const onChangeText = jest.fn();
    render(<SearchBar value="" onChangeText={onChangeText} testID="search" placeholder="Поиск" />);
    fireEvent.changeText(screen.getByPlaceholderText("Поиск"), "burger");
    expect(onChangeText).toHaveBeenCalledWith("burger");
  });

  it("shows a clear button when there is a value and clears it", () => {
    const onChangeText = jest.fn();
    render(<SearchBar value="pizza" onChangeText={onChangeText} testID="search" />);
    fireEvent.press(screen.getByTestId("search-clear"));
    expect(onChangeText).toHaveBeenCalledWith("");
  });

  it("shows a loading indicator and hides the clear button when loading", () => {
    render(<SearchBar value="pizza" onChangeText={jest.fn()} loading testID="search" />);
    expect(screen.queryByTestId("search-clear")).toBeNull();
  });

  it("does not show the clear button when empty", () => {
    render(<SearchBar value="" onChangeText={jest.fn()} testID="search" />);
    expect(screen.queryByTestId("search-clear")).toBeNull();
  });

  it("uses the default testID when none is provided", () => {
    const onChangeText = jest.fn();
    render(<SearchBar value="pizza" onChangeText={onChangeText} />);
    fireEvent.press(screen.getByTestId("search-clear"));
    expect(onChangeText).toHaveBeenCalledWith("");
  });
});
