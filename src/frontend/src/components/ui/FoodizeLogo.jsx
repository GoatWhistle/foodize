const FoodizeLogo = ({ size = 32, color, animated = false }) => {
  const textColor = color || "currentColor";

  return (
    <div
      style={{
        fontFamily: "Manrope, 'Helvetica Neue', Arial, sans-serif",
        fontWeight: "800",
        fontSize: size,
        letterSpacing: "-0.05em",
        color: textColor,
      }}
    >
      foodize
    </div>
  );
};

export default FoodizeLogo;
