import { memo } from "react";
import { ProhibitInsetIcon, PlusIcon } from "@phosphor-icons/react";
import { getCategoryIcon } from "@shared/utils/categoryIcons";
import { categoryLabel } from "@shared/utils/locales";
import { formatPrice } from "@shared/utils/price";
import { activateOnKey } from "@shared/utils/a11y";
import type { MenuItem } from "@shared/types/models";
import { useTranslation } from "@shared/i18n/useTranslation";
import s from "./MenuItemCard.module.css";

interface MenuItemCardProps {
  item: MenuItem;
  onSelect?: (item: MenuItem) => void;
  isRestaurantOpen?: boolean;
  onHaptic?: () => void;
}

const MenuItemCardBase = ({ item, onSelect, isRestaurantOpen = true, onHaptic }: MenuItemCardProps) => {
  const { t } = useTranslation();
  const icon = getCategoryIcon(item.category, { size: 28, fallback: "cooking" });
  const isClosed = !isRestaurantOpen;
  const unavailable = !item.is_available || isClosed;

  const handleClick = () => {
    if (unavailable) return;
    onHaptic?.();
    onSelect?.(item);
  };

  return (
    <div
      className={s['item']}
      style={unavailable ? { opacity: 0.5 } : {}}
      onClick={handleClick}
      role="button"
      tabIndex={unavailable ? -1 : 0}
      onKeyDown={activateOnKey(handleClick)}
      aria-label={t("catalog.menuItem.openAria", { name: item.name })}
    >
      <div className={s['img']}>
        {item.photo_url ? (
          <img src={item.photo_url} alt={item.name} loading="lazy" />
        ) : (
          <div className={s['imgPlaceholder']}>{icon}</div>
        )}

        <span className={s['categoryTag']}>{categoryLabel(item.category)}</span>

        {unavailable && (
          <div className={s['unavailableOverlay']}>
            <ProhibitInsetIcon size={24} color="var(--on-photo-dim)" weight="bold" />
          </div>
        )}
      </div>

      <div className={s['info']}>
        <div className={s['name']}>{item.name}</div>
        {item.description && <div className={s['desc']}>{item.description}</div>}

        <div className={s['footer']}>
          <span className={s['price']}>{formatPrice(item.price)}</span>
          {!unavailable && (
            <button
              className={s['addBtn']}
              onClick={handleClick}
              aria-label={t("catalog.menuItem.addAria", { name: item.name })}
            >
              <PlusIcon size={14} weight="bold" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export const MenuItemCard = memo(MenuItemCardBase);
