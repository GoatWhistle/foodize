import { ListIcon } from "@phosphor-icons/react";
import { getCategoryIcon } from "@shared/utils/categoryIcons";
import { categoryLabel } from "@shared/utils/locales";
import { useTranslation } from "@shared/i18n/useTranslation";
import s from "./CategoryChips.module.css";

interface CategoryChipsProps {
  categories: string[];
  activeCategory: string;
  onSelect: (category: string) => void;
}

export const CategoryChips = ({ categories, activeCategory, onSelect }: CategoryChipsProps) => {
  const { t } = useTranslation();
  return (
    <div className={s["scroll"]}>
      {categories.map((cat) => (
        <button
          key={cat}
          className={`category-chip ${s["chip"]}${activeCategory === cat ? " active" : ""}`}
          onClick={() => { onSelect(cat); }}
        >
          {cat === "ALL" ? <ListIcon size={14} /> : getCategoryIcon(cat, { size: 15 })}
          {cat === "ALL" ? t("catalog.restaurantPage.allCategories") : categoryLabel(cat)}
        </button>
      ))}
    </div>
  );
};
