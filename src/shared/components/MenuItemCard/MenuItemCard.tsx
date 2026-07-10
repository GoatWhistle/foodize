import { memo } from "react";
import type { KeyboardEvent } from "react";
import { ProhibitInset, Plus } from "@phosphor-icons/react";
import { getCategoryIcon } from "@shared/utils/categoryIcons";
import { formatPrice } from "@shared/utils/price";
import type { MenuItem } from "@shared/types/models";
import s from "./MenuItemCard.module.css";

interface MenuItemCardProps {
  item: MenuItem;
  onSelect?: (item: MenuItem) => void;
  isRestaurantOpen?: boolean;
  onHaptic?: () => void;
}

const MenuItemCard = ({ item, onSelect, isRestaurantOpen = true, onHaptic }: MenuItemCardProps) => {
  const icon = getCategoryIcon(item.category, { size: 28, fallback: "cooking" });
  const isClosed = isRestaurantOpen === false;
  const unavailable = item.is_available === false || isClosed;

  const handleClick = () => {
    if (unavailable) return;
    onHaptic?.();
    onSelect?.(item);
  };

  return (
    <div
      className={s.item}
      style={unavailable ? { opacity: 0.5 } : {}}
      onClick={handleClick}
      role="button"
      tabIndex={unavailable ? -1 : 0}
      onKeyDown={(e: KeyboardEvent<HTMLDivElement>) => e.key === "Enter" && handleClick()}
      aria-label={`Открыть ${item.name}`}
    >
      <div className={s.img}>
        {item.photo_url ? (
          <img src={item.photo_url} alt={item.name} loading="lazy" />
        ) : (
          <div className={s.imgPlaceholder}>{icon}</div>
        )}

        {item.category && (
          <span className={s.categoryTag}>{item.category}</span>
        )}

        {unavailable && (
          <div className={s.unavailableOverlay}>
            <ProhibitInset size={24} color="var(--on-photo-dim)" weight="bold" />
          </div>
        )}
      </div>

      <div className={s.info}>
        <div className={s.name}>{item.name}</div>
        {item.description && <div className={s.desc}>{item.description}</div>}

        <div className={s.footer}>
          <span className={s.price}>{formatPrice(item.price)}</span>
          {!unavailable && (
            <button
              className={s.addBtn}
              onClick={handleClick}
              aria-label={`Добавить ${item.name}`}
            >
              <Plus size={14} weight="bold" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default memo(MenuItemCard);
