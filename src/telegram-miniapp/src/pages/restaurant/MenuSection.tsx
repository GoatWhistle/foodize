import { ListIcon } from "@phosphor-icons/react";
import { MenuItemCard } from "@shared/components/MenuItemCard/MenuItemCard";
import { hapticSelection } from "../../telegram/sdk";
import s from "./RestaurantPage.module.css";
import { getCategoryIcon } from "@shared/utils/categoryIcons";
import type { MenuItem } from "@shared/types/models";
import { categoryLabel } from "@shared/utils/locales";
import { useTranslation } from "@shared/i18n/useTranslation";

interface MenuSectionProps {
  isRestaurantOpen: boolean;
  loading: boolean;
  categories: string[];
  activeCategory: string;
  setActiveCategory: (category: string) => void;
  filteredMenuItems: MenuItem[];
  onSelectProduct: (item: MenuItem) => void;
}

export const MenuSection = ({
  isRestaurantOpen,
  loading,
  categories,
  activeCategory,
  setActiveCategory,
  filteredMenuItems,
  onSelectProduct,
}: MenuSectionProps) => {
  const { t } = useTranslation();
  return (
  <div className={s['content']}>
    {!isRestaurantOpen && (
      <div
        style={{
          padding: "12px 14px",
          background: "var(--color-error-bg)",
          border: "1px solid var(--color-error-border)",
          borderRadius: "var(--r-md)",
          color: "var(--danger)",
          fontSize: "var(--text-base)",
          fontWeight: 800,
          marginBottom: 14,
        }}
      >
        {t("catalog.restaurantPage.closedBannerMiniapp")}
      </div>
    )}
    <div className={s['categoriesScroll']}>
      {categories.map((cat) => (
        <button
          key={cat}
          className={`category-chip${activeCategory === cat ? " active" : ""}`}
          onClick={() => { setActiveCategory(cat); }}
          style={{ display: "flex", alignItems: "center", gap: 5 }}
        >
          {cat === "ALL" ? <ListIcon size={14} /> : getCategoryIcon(cat, { size: 14 })}
          {cat === "ALL" ? t("catalog.restaurantPage.allCategories") : categoryLabel(cat)}
        </button>
      ))}
    </div>

    {loading ? (
      <div className={s['menuList']}>
        {[1, 2, 3, 4, 5].map((i) => (
          <div
            key={i}
            className="skeleton-wrap"
            style={{ pointerEvents: "none", display: "flex", background: "var(--bg-card)", borderRadius: "var(--r-md)", border: "1px solid var(--border)", overflow: "hidden" }}
          >
            <div className="skeleton" style={{ width: 100, minHeight: 90, flexShrink: 0 }} />
            <div style={{ flex: 1, padding: "10px 12px", display: "flex", flexDirection: "column", gap: 8 }}>
              <div className="skeleton" style={{ width: "65%", height: 14 }} />
              <div className="skeleton" style={{ width: "85%", height: 11 }} />
              <div className="skeleton" style={{ width: "35%", height: 14, marginTop: 4 }} />
            </div>
          </div>
        ))}
      </div>
    ) : (
      <div className={s['menuList']}>
        {filteredMenuItems.map((item) => (
          <MenuItemCard
            key={item.id}
            item={item}
            onSelect={onSelectProduct}
            isRestaurantOpen={isRestaurantOpen}
            onHaptic={hapticSelection}
          />
        ))}
      </div>
    )}
  </div>
  );
};
