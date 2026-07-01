import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import {
  BowlFood,
  Clock,
  Minus,
  Plus,
  X,
  Fire,
  Hamburger,
  Pizza,
  Leaf,
  Cookie,
  Coffee,
  DotsThree,
} from "@phosphor-icons/react";
import s from "./ProductSheet.module.css";

const CATEGORY_ICONS = {
  SHAURMA: <Fire size={52} />,
  BURGER: <Hamburger size={52} />,
  PIZZA: <Pizza size={52} />,
  SUSHI: <BowlFood size={52} />,
  SALAD: <Leaf size={52} />,
  SNACK: <Cookie size={52} />,
  DRINK: <Coffee size={52} />,
  OTHER: <DotsThree size={52} />,
  DEFAULT: <BowlFood size={52} />,
};

const formatPrice = (value) => `${value} ₽`;

const getActiveOptionGroups = (item) =>
  (item?.option_groups || [])
    .filter((group) => group.is_active !== false)
    .map((group) => ({
      ...group,
      options: (group.options || []).filter((o) => o.is_available !== false),
    }))
    .filter((group) => group.options.length > 0);

const getSelectedOptions = (groups, ids) => {
  const idsSet = new Set(ids);
  return groups.flatMap((g) => g.options).filter((o) => idsSet.has(o.id));
};

const getMinSelected = (group) =>
  group.is_required ? Math.max(1, Number(group.min_selected) || 0) : Number(group.min_selected) || 0;

const getGroupHint = (group) => {
  const max = group.selection_type === "single" ? 1 : group.max_selected;
  const min = getMinSelected(group);
  if (group.selection_type === "single") {
    return group.is_required ? "Обязательно выбрать 1" : "Можно выбрать 1";
  }
  if (group.is_required && max) {
    return min === max ? `Выберите ${min}` : `Выберите от ${min} до ${max}`;
  }
  if (group.is_required) return `Выберите минимум ${min}`;
  if (max) return `Можно выбрать до ${max}`;
  return "Можно выбрать несколько";
};

const ProductSheet = ({ item, onClose, onAdd, isRestaurantOpen = true }) => {
  const [selectedOptionIds, setSelectedOptionIds] = useState([]);
  const [quantity, setQuantity] = useState(1);
  const [error, setError] = useState("");
  const groups = useMemo(() => getActiveOptionGroups(item), [item]);
  const isClosed = isRestaurantOpen === false;
  const categoryKey = (item?.category_name ?? item?.category ?? "").toUpperCase();
  const icon = CATEGORY_ICONS[categoryKey] || CATEGORY_ICONS.DEFAULT;

  useEffect(() => {
    if (!item) return;
    setSelectedOptionIds(
      groups.flatMap((group) =>
        group.is_required && group.selection_type === "single"
          ? [group.options[0].id]
          : [],
      ),
    );
    setQuantity(1);
    setError("");
  }, [item, groups]);

  useEffect(() => {
    const handler = (e) => e.key === "Escape" && onClose?.();
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [onClose]);

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
    (Number(item.price) || 0) +
    selectedOptions.reduce((sum, o) => sum + (Number(o.price_delta) || 0), 0);

  const toggleOption = (group, option) => {
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
    if (isClosed) { setError("Заведение сейчас закрыто и не принимает заказы"); return; }
    for (const group of groups) {
      const groupOptionIds = group.options.map((o) => o.id);
      const selectedCount = selectedOptionIds.filter((id) => groupOptionIds.includes(id)).length;
      if (selectedCount < getMinSelected(group)) { setError(`Выберите: ${group.name}`); return; }
    }
    onAdd?.({ item, selectedOptions, quantity });
  };

  const sheet = (
    <div
      className={s.overlay}
      onMouseDown={(e) => { if (e.target === e.currentTarget) onClose?.(); }}
    >
      <section
        className={`${s.sheet}${groups.length === 0 ? ` ${s.compact}` : ""}`}
        role="dialog"
        aria-modal="true"
      >
        <button className={s.close} type="button" onClick={onClose} aria-label="Закрыть">
          <X size={18} weight="bold" />
        </button>
        <div className={s.media}>
          {item.photo_url ? (
            <img src={item.photo_url} alt={item.name} />
          ) : (
            <div className={s.placeholder}>{icon}</div>
          )}
        </div>
        <div className={s.body}>
          <div className={s.head}>
            <h2>{item.name}</h2>
            {item.description && <p>{item.description}</p>}
          </div>
          <div className={s.priceRow}>
            <div className={s.basePrice}>{formatPrice(item.price)}</div>
            <div className={s.meta}>
              <span>
                <Clock size={14} weight="bold" />~{item.prep_time_minutes || 15} мин
              </span>
            </div>
          </div>
          {groups.length > 0 && (
            <div className={s.options}>
              {groups.map((group) => {
                const groupOptionIds = group.options.map((o) => o.id);
                const selectedCount = selectedOptionIds.filter((id) => groupOptionIds.includes(id)).length;
                return (
                  <div key={group.id} className={s.optionGroup}>
                    <div className={s.optionGroupHead}>
                      <strong>{group.name}</strong>
                      <span>{getGroupHint(group)}</span>
                    </div>
                    <div className={s.optionList}>
                      {group.options.map((option) => {
                        const checked = selectedOptionIds.includes(option.id);
                        const disabled =
                          !checked &&
                          group.selection_type !== "single" &&
                          group.max_selected &&
                          selectedCount >= group.max_selected;
                        return (
                          <label
                            key={option.id}
                            className={`${s.option}${checked ? ` ${s.selected}` : ""}`}
                          >
                            <span>
                              <input
                                type={group.selection_type === "single" ? "radio" : "checkbox"}
                                name={`option-group-${group.id}`}
                                checked={checked}
                                disabled={Boolean(disabled)}
                                onChange={() => toggleOption(group, option)}
                              />
                              {option.name}
                            </span>
                            {option.price_delta > 0 && <em>+{formatPrice(option.price_delta)}</em>}
                          </label>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
          {error && <div className="form-error">{error}</div>}
        </div>
        <div className={s.footer}>
          <div className={s.qty}>
            <button type="button" onClick={() => setQuantity((v) => Math.max(1, v - 1))} aria-label="Уменьшить">
              <Minus size={16} weight="bold" />
            </button>
            <span>{quantity}</span>
            <button type="button" onClick={() => setQuantity((v) => Math.min(99, v + 1))} aria-label="Увеличить">
              <Plus size={16} weight="bold" />
            </button>
          </div>
          <button className={s.addBtn} onClick={handleAdd}>
            {isClosed ? "Заведение закрыто" : `Добавить · ${formatPrice(unitPrice * quantity)}`}
          </button>
        </div>
      </section>
    </div>
  );

  return createPortal(sheet, document.body);
};

export default ProductSheet;
