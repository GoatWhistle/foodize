const FoodizeLogo = ({ size = 32, color, animated = false }) => {
  const textColor = color || "currentColor";
  const pin = "#FF4F1F";

  // Всё в одном SVG viewBox — обходим проблемы font-metrics
  // path данные для "foodize" с пином вместо "i" не зависят от загрузки шрифта
  return (
    <svg
      height={size}
      viewBox="0 0 220 48"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="Foodize"
      role="img"
      style={{ display: "block", width: "auto" }}
    >
      {/* Текст "food" */}
      <text
        y="42"
        fontFamily="Manrope, 'Helvetica Neue', Arial, sans-serif"
        fontWeight="800"
        fontSize="44"
        letterSpacing="-2"
        fill={textColor}
      >
        food
      </text>

      {/* Геопин вместо "i" — позиция ~x=128, по высоте cap-height (~42px) */}
      <g
        style={{ transformOrigin: "140px 16px" }}
        className={animated ? "pin-drop" : undefined}
      >
        {/* Голова пина — круг */}
        <circle cx="140" cy="16" r="10" fill={pin} />
        {/* Хвост пина — треугольник вниз */}
        <polygon points="131,22 140,46 149,22" fill={pin} />
      </g>

      {/* Текст "ze" */}
      <text
        x="153"
        y="42"
        fontFamily="Manrope, 'Helvetica Neue', Arial, sans-serif"
        fontWeight="800"
        fontSize="44"
        letterSpacing="-2"
        fill={textColor}
      >
        ze
      </text>
    </svg>
  );
};

export default FoodizeLogo;
