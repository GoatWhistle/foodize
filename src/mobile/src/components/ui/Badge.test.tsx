import { render } from "@testing-library/react-native";
import { Badge } from "@/components/ui/Badge";

describe("Badge", () => {
  it("renders each tone", () => {
    const tones = ["neutral", "accent", "success", "warning", "error"] as const;
    tones.forEach((tone) => {
      const view = render(<Badge label={tone} tone={tone} />);
      expect(view.getByText(tone)).toBeTruthy();
      view.unmount();
    });
  });

  it("defaults to the neutral tone", () => {
    const { getByText } = render(<Badge label="Готов" />);
    expect(getByText("Готов")).toBeTruthy();
  });
});
