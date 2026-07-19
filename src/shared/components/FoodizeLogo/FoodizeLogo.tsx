interface FoodizeLogoProps {
  size?: number;
  color?: string;
}

export const FoodizeLogo = ({ size = 32, color }: FoodizeLogoProps) => {
  const textColor = color || "currentColor";

  return (
    <div
      role="img"
      aria-label="Foodize"
      style={{
        display: "flex",
        alignItems: "baseline",
        gap: "1px",
        userSelect: "none",
      }}
    >
      <span
        style={{
          fontFamily: "var(--font-serif)",
          fontWeight: 700,
          fontStyle: "italic",
          fontSize: size,
          color: textColor,
          letterSpacing: "-0.04em",
          lineHeight: 1,
        }}
      >
        food
      </span>
      <span
        style={{
          fontFamily: "var(--font-sans)",
          fontWeight: 800,
          fontSize: size * 0.72,
          color: "var(--fire)",
          letterSpacing: "0.02em",
          lineHeight: 1,
          textTransform: "lowercase",
          alignSelf: "flex-end",
          marginBottom: size * 0.04,
        }}
      >
        ize
      </span>
    </div>
  );
};
