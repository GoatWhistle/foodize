import { ClockIcon, WarningCircleIcon, PlusIcon, MinusIcon } from "@phosphor-icons/react";
import { formatOptionsSummary } from "@shared/utils/price";
import {
  getSelectedOptions,
  getLinePrice,
  type CartLine,
  type CartMenuItem,
} from "@shared/utils/cartLine";
import type { OrderLoadEstimate } from "@shared/types/models";
import { useTranslation } from "@shared/i18n/useTranslation";
import s from "./CartDrawer.module.css";
import { formatPrice } from "@shared/utils/price";

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
}: CartItemsListProps) => {
  const { t } = useTranslation();
  return (
    <div className={s['items']}>
    {cart.map((cartItem) => {
      const { menuItem, quantity } = cartItem;
      const selectedOptions = getSelectedOptions(cartItem);
      const selectedOptionIds = getSelectedOptionIds(cartItem);
      const lineKey = `${menuItem.id}:${selectedOptionIds.join(",")}`;
      return (
        <div key={lineKey} className={s['item']}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <span className={s['itemName']}>{menuItem.name}</span>
            {selectedOptions.length > 0 && (
              <div style={{ marginTop: 3, fontSize: "var(--text-sm)", lineHeight: 1.35, color: "var(--text-3)" }}>
                {formatOptionsSummary(selectedOptions)}
              </div>
            )}
          </div>
          <div className={s['itemControls']}>
            <button className={s['qtyBtn']} onClick={() => { onDecrease(menuItem.id, selectedOptionIds); }} aria-label={t("order.cart.decrease")}>
              <MinusIcon size={12} weight="bold" />
            </button>
            <span style={{ fontWeight: 700, minWidth: 20, textAlign: "center", fontSize: "var(--text-base)" }}>{quantity}</span>
            <button className={s['qtyBtn']} onClick={() => { onIncrease(menuItem, selectedOptions); }} aria-label={t("order.cart.increase")}>
              <PlusIcon size={12} weight="bold" />
            </button>
          </div>
          <span style={{ fontWeight: 700, minWidth: 64, textAlign: "right", fontSize: "var(--text-base)", color: "var(--text-1)" }}>
            {formatPrice(getLinePrice(cartItem) * quantity)}
          </span>
        </div>
      );
    })}
    </div>
  );
};

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
}: PickupTimeSectionProps) => {
  const { t } = useTranslation();
  return (
  <div style={{ marginTop: 14, padding: "12px 14px", border: "1px solid var(--border)", borderRadius: "var(--r-md)", background: "var(--bg-card)" }}>
    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10, fontSize: "var(--text-base)", fontWeight: 800, color: "var(--text-1)" }}>
      <ClockIcon size={16} weight="bold" />
      {t("order.pickup.title")}
    </div>
    <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
      <button type="button" className={`category-chip${pickupMode === "asap" ? " active" : ""}`} onClick={onSelectAsap}>
        {t("order.pickup.asap")}
      </button>
      <button type="button" className={`category-chip${pickupMode === "scheduled" ? " active" : ""}`} onClick={onSelectScheduled}>
        {t("order.pickup.scheduled")}
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
          style={{ height: 40, fontSize: "var(--text-base)" }}
        />
        <div style={{ marginTop: 6, fontSize: "var(--text-sm)", color: pickupTooSoon ? "var(--error)" : "var(--text-3)" }}>
          {t("order.pickup.minimum", { time: minPickupDate.toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit" }) })}
        </div>
      </div>
    )}
  </div>
  );
};

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
  const { t } = useTranslation();
  if (estimateLoading) {
    return (
      <div style={{ marginTop: 14, padding: "10px 12px", border: "1px solid var(--border)", borderRadius: "var(--r-md)", color: "var(--text-3)", fontSize: "var(--text-base)", fontWeight: 700 }}>
        {t("order.estimate.checkingQueue")}
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
        <div style={{ fontSize: "var(--text-base)", fontWeight: 800, color: orderingUnavailable ? "var(--error)" : "var(--text-1)", marginBottom: 2 }}>
          {orderingUnavailable
            ? t("order.estimate.unavailable")
            : t("order.estimate.waitRange", {
                min: loadEstimate.estimated_wait_min_minutes,
                max: loadEstimate.estimated_wait_max_minutes,
              })}
        </div>
        {!orderingUnavailable && (
          <div style={{ fontSize: "var(--text-sm)", color: "var(--text-3)" }}>
            {t("order.estimate.activeInQueue", { count: loadEstimate.active_orders_count })}
          </div>
        )}
      </div>
    </div>
  );
};
