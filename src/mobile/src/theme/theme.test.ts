import { theme } from "@/theme/theme";

describe("theme", () => {
  it("exposes the expected top-level sections", () => {
    expect(theme).toHaveProperty("colors");
    expect(theme).toHaveProperty("spacing");
    expect(theme).toHaveProperty("radius");
    expect(theme).toHaveProperty("typography");
  });

  it("defines the brand accent color", () => {
    expect(typeof theme.colors.accent).toBe("string");
    expect(theme.colors.accent.length).toBeGreaterThan(0);
  });

  it("defines the spacing scale", () => {
    expect(theme.spacing.md).toBe(16);
    expect(theme.spacing.lg).toBeGreaterThan(theme.spacing.sm);
  });

  it("defines typography variants", () => {
    expect(theme.typography.title.fontSize).toBeGreaterThan(theme.typography.body.fontSize);
  });
});
