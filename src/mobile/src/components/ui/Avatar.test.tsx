import { render, screen } from "@testing-library/react-native";
import { Avatar } from "@/components/ui/Avatar";

describe("Avatar", () => {
  it("renders initials from a name", () => {
    render(<Avatar name="Иван Петров" />);
    expect(screen.getByText("ИП")).toBeTruthy();
  });

  it("renders a placeholder when name is missing", () => {
    render(<Avatar />);
    expect(screen.getByText("?")).toBeTruthy();
  });

  it("renders an image when uri is provided", () => {
    render(<Avatar uri="https://example.com/a.png" name="Иван" />);
    expect(screen.queryByText("И")).toBeNull();
  });
});
