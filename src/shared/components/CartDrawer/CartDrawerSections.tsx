import { ClockIcon, WarningCircleIcon, PlusIcon, MinusIcon } from "@phosphor-icons/react";
import { formatOptionsSummary } from "@shared/utils/price";
import {
  getSelectedOptions,
  getLinePrice,
  type CartLine,
  type CartMenuItem,
} from "@shared/utils/cartLine";
import type { OrderLoadEstimate } from "@shared/types/models";
import s from "./CartDrawer.module.css";

interface CartItemsListProps {
  cart: CartLine[];
  onDecrease: (menuItemId: string, selectedOptionIds: string[]) => void;
  onIncrease: (menuItem: CartMenuItem, selectedOptions: CartLine["selectedOptions"]) => void;
}

const getSelectedOptionIds = (item: CartLine): string[] =>
  item.selectedOptionIds.filter((id): id is string => Boolean(id));

export const CartItemsList = ({
  cart,
  onDecrease,
  onIncrease,
}: CartItemsListProps) => (
  <div className={s.items}>
    {cart.map((cartItem) => {
      const { menuItem, quantity } = cartItem;
      const selectedOptions = getSelectedOptions(cartItem);
      const selectedOptionIds = getSelectedOptionIds(cartItem);
      const lineKey = `${menuItem.id}:${selectedOptionIds.join(",")}`;
      return (
        <div key={lineKey} className={s.item}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <span className={s.itemName}>{menuItem.name}</span>
            {selectedOptions.length > 0 && (
              <div style={{ marginTop: 3, fontSize: "0.72rem", lineHeight: 1.35, color: "var(--text-3)" }}>
                {formatOptionsSummary(selectedOptions)}
              </div>
            )}
          </div>
          <div className={s.itemControls}>
            <button className={s.qtyBtn} onClick={() => { onDecrease(menuItem.id, selectedOptionIds); }} aria-label="Уменьшить">
              <MinusIcon size={12} weight="bold" />
            </button>
            <span style={{ fontWeight: 700, minWidth: 20, textAlign: "center", fontSize: "0.9rem" }}>{quantity}</span>
            <button className={s.qtyBtn} onClick={() => { onIncrease(menuItem, selectedOptions); }} aria-label="Увеличить">
              <PlusIcon size={12} weight="bold" />
            </button>
          </div>
          <span style={{ fontWeight: 700, minWidth: 64, textAlign: "right", fontSize: "0.9rem", color: "var(--text-1)" }}>
            {getLinePrice(cartItem) * quantity} ₽
          </span>
        </div>
      );
    })}
  </div>
);

interface PickupTimeSectionProps {
  pickupMode: "asap" | "scheduled";
  onSelectAsap: () => void;
  onSelectScheduled: () => void;
  requestedPickupAt: string;
  onChangePickupAt: (value: string) => void;
  minPickupValue: string;
  maxPickupValue: string;
  minPickupDate: Date;
  pickupTooSoon: boolean;
}

export const PickupTimeSection = ({
  pickupMode,
  onSelectAsap,
  onSelectScheduled,
  requestedPickupAt,
  onChangePickupAt,
  minPickupValue,
  maxPickupValue,
  minPickupDate,
  pickupTooSoon,
}: PickupTimeSectionProps) => (
  <div style={{ marginTop: 14, padding: "12px 14px", border: "1px solid var(--border)", borderRadius: "var(--r-md)", background: "var(--bg-card)" }}>
    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10, fontSize: "0.86rem", fontWeight: 800, color: "var(--text-1)" }}>
      <ClockIcon size={16} weight="bold" />
      Время получения
    </div>
    <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
      <button type="button" className={`category-chip${pickupMode === "asap" ? " active" : ""}`} onClick={onSelectAsap}>
        Как можно скорее
      </button>
      <button type="button" className={`category-chip${pickupMode === "scheduled" ? " active" : ""}`} onClick={onSelectScheduled}>
        Ко времени
      </button>
    </div>
    {pickupMode === "scheduled" && (
      <div style={{ marginTop: 10 }}>
        <input
          className="form-input"
          type="datetime-local"
          value={requestedPickupAt}
          min={minPickupValue}
          max={maxPickupValue}
          onChange={(e) => { onChangePickupAt(e.target.value); }}
          style={{ height: 40, fontSize: "0.85rem" }}
        />
        <div style={{ marginTop: 6, fontSize: "0.76rem", color: pickupTooSoon ? "var(--error)" : "var(--text-3)" }}>
          Минимум: {minPickupDate.toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit" })}
        </div>
      </div>
    )}
  </div>
);

interface LoadEstimateSectionProps {
  estimateLoading: boolean;
  loadEstimate: OrderLoadEstimate | null;
  orderingUnavailable: boolean;
  hasQueueWarning: boolean;
}

export const LoadEstimateSection = ({
  estimateLoading,
  loadEstimate,
  orderingUnavailable,
  hasQueueWarning,
}: LoadEstimateSectionProps) => {
  if (estimateLoading) {
    return (
      <div style={{ marginTop: 14, padding: "10px 12px", border: "1px solid var(--border)", borderRadius: "var(--r-md)", color: "var(--text-3)", fontSize: "0.85rem", fontWeight: 700 }}>
        Проверяем очередь...
      </div>
    );
  }
  if (!loadEstimate) return null;
  return (
    <div style={{ marginTop: 14, padding: "12px 14px", borderRadius: "var(--r-md)", border: orderingUnavailable ? "1px solid var(--error)" : hasQueueWarning ? "1px solid var(--color-warning-border)" : "1px solid var(--border)", background: orderingUnavailable ? "var(--color-error-bg)" : hasQueueWarning ? "var(--color-warning-bg)" : "var(--bg-card)", display: "flex", gap: 10, alignItems: "flex-start" }}>
      {orderingUnavailable ? (
        <WarningCircleIcon size={18} weight="fill" color="var(--error)" />
      ) : (
        <ClockIcon size={18} weight="fill" color={hasQueueWarning ? "var(--color-warning)" : "var(--text-3)"} />
      )}
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: "0.86rem", fontWeight: 800, color: orderingUnavailable ? "var(--error)" : "var(--text-1)", marginBottom: 2 }}>
          {orderingUnavailable ? "Заведение временно не принимает заказы" : `Ожидание примерно ${loadEstimate.estimated_wait_min_minutes}-${loadEstimate.estimated_wait_max_minutes} мин.`}
        </div>
        {!orderingUnavailable && (
          <div style={{ fontSize: "0.78rem", color: "var(--text-3)" }}>
            Активных заказов в очереди: {loadEstimate.active_orders_count}
          </div>
        )}
      </div>
    </div>
  );
};
