import { render, screen } from "@testing-library/react-native";
import { Rating } from "@/components/ui/Rating";

describe("Rating", () => {
  it("shows the formatted value", () => {
    render(<Rating value={4.5} />);
    expect(screen.getByText("4.5")).toBeTruthy();
  });

  it("hides the value when showValue is false", () => {
    render(<Rating value={4.5} showValue={false} />);
    expect(screen.queryByText("4.5")).toBeNull();
  });
});
