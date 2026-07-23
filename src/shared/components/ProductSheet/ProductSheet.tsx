import { useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import { createPortal } from "react-dom";
import { ClockIcon, MinusIcon, PlusIcon, XIcon } from "@phosphor-icons/react";
import { getCategoryIcon } from "@shared/utils/categoryIcons";
import { formatPrice } from "@shared/utils/price";
import { useFocusTrap } from "@shared/hooks/useFocusTrap";
import { useTranslation } from "@shared/i18n/useTranslation";
import {
  ProductSheetOptionGroups,
  getActiveOptionGroups,
  getSelectedOptions,
  getMinSelected,
} from "./ProductSheetOptions";
import type { Option, OptionGroup, SheetItem } from "./ProductSheetOptions";
import s from "./ProductSheet.module.css";
import c from "./ProductSheetControls.module.css";

interface AddPayload {
  item: SheetItem;
  selectedOptions: Option[];
  quantity: number;
}

interface ProductSheetProps {
  item: SheetItem | null;
  onClose?: () => void;
  onAdd?: (payload: AddPayload) => void;
  isRestaurantOpen?: boolean;
}

export const ProductSheet = ({ item, onClose, onAdd, isRestaurantOpen = true }: ProductSheetProps) => {
  const { t } = useTranslation();
  const [selectedOptionIds, setSelectedOptionIds] = useState<string[]>([]);
  const [quantity, setQuantity] = useState(1);
  const [error, setError] = useState("");
  const groups = useMemo(() => getActiveOptionGroups(item), [item]);
  const isClosed = !isRestaurantOpen;
  const categoryKey = item?.category_name ?? item?.category;
  const icon = getCategoryIcon(categoryKey, { size: 52 });
  const sheetRef = useFocusTrap<HTMLElement>({
    active: Boolean(item),
    onEscape: () => onClose?.(),
  });

  useEffect(() => {
    if (!item) return;
    setSelectedOptionIds(
      groups.flatMap((group) => {
        const firstOption = group.options[0];
        return group.is_required &&
          group.selection_type === "single" &&
          firstOption
          ? [firstOption.id]
          : [];
      }),
    );
    setQuantity(1);
    setError("");
  }, [item, groups]);

  useEffect(() => {
    if (!item) return;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prevOverflow;
    };
  }, [item]);

  if (!item) return null;

  const selectedOptions = getSelectedOptions(groups, selectedOptionIds);
  const unitPrice =
    (item.price || 0) +
    selectedOptions.reduce((sum, o) => sum + (o.price_delta || 0), 0);

  const toggleOption = (group: OptionGroup, option: Option) => {
    setError("");
    setSelectedOptionIds((current) => {
      const groupOptionIds = group.options.map((e) => e.id);
      const hasOption = current.includes(option.id);
      if (group.selection_type === "single") {
        return [...current.filter((id) => !groupOptionIds.includes(id)), option.id];
      }
      if (hasOption) return current.filter((id) => id !== option.id);
      if (group.max_selected) {
        const selectedInGroup = current.filter((id) => groupOptionIds.includes(id));
        if (selectedInGroup.length >= group.max_selected) return current;
      }
      return [...current, option.id];
    });
  };

  const handleAdd = () => {
    if (isClosed) { setError(t("catalog.product.closed")); return; }
    for (const group of groups) {
      const groupOptionIds = group.options.map((o) => o.id);
      const selectedCount = selectedOptionIds.filter((id) => groupOptionIds.includes(id)).length;
      if (selectedCount < getMinSelected(group)) { setError(t("catalog.product.selectGroup", { group: group.name })); return; }
    }
    onAdd?.({ item, selectedOptions, quantity });
  };

  const sheet: ReactNode = (
    <div
      className={s['overlay']}
      onMouseDown={(e) => { if (e.target === e.currentTarget) onClose?.(); }}
    >
      <section
        ref={sheetRef}
        className={`${s['sheet']}${groups.length === 0 ? ` ${s['compact']}` : ""}`}
        role="dialog"
        aria-modal="true"
        aria-label={item.name}
        tabIndex={-1}
      >
        <button className={s['close']} type="button" onClick={onClose} aria-label={t("common.actions.close")}>
          <XIcon size={18} weight="bold" />
        </button>
        <div className={s['media']}>
          {item.photo_url ? (
            <img src={item.photo_url} alt={item.name} loading="lazy" />
          ) : (
            <div className={s['placeholder']}>{icon}</div>
          )}
        </div>
        <div className={s['body']}>
          <div className={s['head']}>
            <h2>{item.name}</h2>
            {item.description && <p>{item.description}</p>}
          </div>
          <div className={s['priceRow']}>
            <div className={s['basePrice']}>{formatPrice(item.price)}</div>
            <div className={s['meta']}>
              <span>
                <ClockIcon size={14} weight="bold" />{t("catalog.product.prepTime", { minutes: item.prep_time_minutes || 15 })}
              </span>
            </div>
          </div>
          <ProductSheetOptionGroups
            groups={groups}
            selectedOptionIds={selectedOptionIds}
            onToggle={toggleOption}
          />
          {error && <div className="form-error">{error}</div>}
        </div>
        <div className={c['footer']}>
          <div className={c['qty']}>
            <button type="button" onClick={() => { setQuantity((v) => Math.max(1, v - 1)); }} aria-label={t("catalog.product.decrease")}>
              <MinusIcon size={16} weight="bold" />
            </button>
            <span>{quantity}</span>
            <button type="button" onClick={() => { setQuantity((v) => Math.min(99, v + 1)); }} aria-label={t("catalog.product.increase")}>
              <PlusIcon size={16} weight="bold" />
            </button>
          </div>
          <button className={c['addBtn']} onClick={handleAdd}>
            {isClosed
              ? t("catalog.product.venueClosed")
              : t("catalog.product.add", { total: formatPrice(unitPrice * quantity) })}
          </button>
        </div>
      </section>
    </div>
  );

  return createPortal(sheet, document.body);
};
