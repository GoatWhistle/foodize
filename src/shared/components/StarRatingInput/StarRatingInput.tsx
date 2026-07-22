import { StarIcon } from "@phosphor-icons/react";
import { useTranslation } from "@shared/i18n/useTranslation";

interface StarRatingInputProps {
  value?: number;
  onChange?: (value: number) => void;
  size?: number;
  readOnly?: boolean;
  activeColor?: string;
  inactiveColor?: string;
  gap?: number;
}

export const StarRatingInput = ({
  value = 0,
  onChange,
  size = 24,
  readOnly = false,
  activeColor = "var(--star)",
  inactiveColor = "var(--border-mid)",
  gap = 6,
}: StarRatingInputProps) => {
  const { t } = useTranslation();
  return (
  <div style={{ display: "flex", gap, justifyContent: "center", alignItems: "center" }}>
    {[1, 2, 3, 4, 5].map((s) => {
      const filled = s <= value;
      const star = (
        <StarIcon
          size={size}
          weight={filled ? "fill" : "regular"}
          color={filled ? activeColor : inactiveColor}
        />
      );
      if (readOnly) {
        return <span key={s} style={{ display: "inline-flex" }}>{star}</span>;
      }
      return (
        <span
          key={s}
          role="button"
          tabIndex={0}
          aria-label={t("catalog.reviews.ratingAria", { value: s })}
          style={{ cursor: "pointer", display: "inline-flex" }}
          onClick={() => onChange?.(s)}
          onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && onChange?.(s)}
        >
          {star}
        </span>
      );
    })}
  </div>
  );
};
