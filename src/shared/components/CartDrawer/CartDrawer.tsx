import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { TrashIcon, TagIcon, XIcon } from "@phosphor-icons/react";
import { useShallow } from "zustand/react/shallow";
import { useCartStore } from "@shared/store/useCartStore.instance";
import { useOrdersStore } from "@shared/store/useOrdersStore.instance";
import OrderButton from "@shared/components/OrderButton/OrderButton";
import { promoService } from "@shared/services/promoService";
import { orderService } from "@shared/services/orderService";
import { translateApiError } from "@shared/utils/translateApiError";
import { useFocusTrap } from "@shared/hooks/useFocusTrap";
import type { PromoValidate, OrderLoadEstimate } from "@shared/types/models";
import {
  CartItemsList,
  PickupTimeSection,
  LoadEstimateSection,
} from "./CartDrawerSections";
import s from "./CartDrawer.module.css";

const DEFAULT_WAIT_MINUTES = 15;
const QUEUE_WARNING_EXTRA_MINUTES = 10;
const MAX_PICKUP_DAYS = 7;
const MS_PER_MINUTE = 60_000;
const MS_PER_DAY = 24 * 60 * MS_PER_MINUTE;

type AppliedPromo = PromoValidate & { originalTotal: number };

interface CartDrawerProps {
  onClose: () => void;
  isRestaurantOpen?: boolean;
  onHaptic?: () => void;
}

const toDateTimeLocalValue = (date: Date): string => {
  const local = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
  return local.toISOString().slice(0, 16);
};

const fromDateTimeLocalValue = (value: string): string | null => {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
};

const CartDrawer = ({ onClose, isRestaurantOpen = true, onHaptic }: CartDrawerProps) => {
  const navigate = useNavigate();
  const { cart, cartRestaurantId, removeFromCart, addToCart, clearCart, placeOrder } =
    useCartStore(
      useShallow((s) => ({
        cart: s.cart,
        cartRestaurantId: s.cartRestaurantId,
        removeFromCart: s.removeFromCart,
        addToCart: s.addToCart,
        clearCart: s.clearCart,
        placeOrder: s.placeOrder,
      })),
    );
  const total = useCartStore((s) => s.cartTotal());
  const orders = useOrdersStore((s) => s.orders);
  const isFirstOrder = orders.length === 0;
  const drawerRef = useFocusTrap<HTMLDivElement>({ onEscape: onClose });

  const [promoCode, setPromoCode] = useState("");
  const [appliedPromo, setAppliedPromo] = useState<AppliedPromo | null>(null);
  const [promoError, setPromoError] = useState("");
  const [promoLoading, setPromoLoading] = useState(false);
  const [comment, setComment] = useState("");
  const [pickupMode, setPickupMode] = useState<"asap" | "scheduled">("asap");
  const [requestedPickupAt, setRequestedPickupAt] = useState("");
  const [placing, setPlacing] = useState(false);
  const [error, setError] = useState("");
  const [loadEstimate, setLoadEstimate] = useState<OrderLoadEstimate | null>(null);
  const [estimateLoading, setEstimateLoading] = useState(false);
  const isClosed = !isRestaurantOpen;

  useEffect(() => {
    setAppliedPromo(null);
    setPromoCode("");
    setPromoError("");
    setComment("");
    setPickupMode("asap");
    setRequestedPickupAt("");
  }, [cartRestaurantId]);

  useEffect(() => {
    if (appliedPromo) setAppliedPromo(null);
  }, [cart, appliedPromo]);

  useEffect(() => {
    if (!cartRestaurantId) { setLoadEstimate(null); return; }
    let cancelled = false;
    setEstimateLoading(true);
    orderService
      .getEstimate(cartRestaurantId)
      .then((res) => { if (!cancelled) setLoadEstimate(res.data.data); })
      .catch(() => { if (!cancelled) setLoadEstimate(null); })
      .finally(() => { if (!cancelled) setEstimateLoading(false); });
    return () => { cancelled = true; };
  }, [cartRestaurantId]);

  const handleApplyPromo = async () => {
    if (!promoCode.trim() || !cartRestaurantId) return;
    setPromoLoading(true);
    setPromoError("");
    try {
      const res = await promoService.validate(promoCode.trim(), cartRestaurantId, total, isFirstOrder);
      setAppliedPromo({ ...res.data.data, originalTotal: total });
    } catch (err) {
      setPromoError(translateApiError(err, "Неверный промокод"));
      setAppliedPromo(null);
    } finally {
      setPromoLoading(false);
    }
  };

  const handleRemovePromo = () => { setAppliedPromo(null); setPromoCode(""); setPromoError(""); };

  const finalTotal = appliedPromo?.discounted_amount != null ? appliedPromo.discounted_amount : total;
  const orderingUnavailable = Boolean(loadEstimate && !loadEstimate.ordering_available);
  const hasQueueWarning = Boolean(
    loadEstimate &&
      loadEstimate.ordering_available &&
      (loadEstimate.estimated_wait_min_minutes >
        loadEstimate.avg_prep_time_minutes + QUEUE_WARNING_EXTRA_MINUTES ||
        (loadEstimate.max_active_orders && loadEstimate.active_orders_count >= loadEstimate.max_active_orders)),
  );
  const minPickupDate = new Date(
    Date.now() +
      Math.max(loadEstimate?.estimated_wait_min_minutes ?? DEFAULT_WAIT_MINUTES, 1) *
        MS_PER_MINUTE,
  );
  const maxPickupDate = new Date(Date.now() + MAX_PICKUP_DAYS * MS_PER_DAY);
  const minPickupValue = toDateTimeLocalValue(minPickupDate);
  const maxPickupValue = toDateTimeLocalValue(maxPickupDate);
  const selectedPickupIso = pickupMode === "scheduled" ? fromDateTimeLocalValue(requestedPickupAt) : null;
  const pickupTooSoon = pickupMode === "scheduled" && Boolean(requestedPickupAt) && new Date(requestedPickupAt) < minPickupDate;

  const handlePlaceOrder = async () => {
    if (isClosed) { setError("Заведение сейчас закрыто и не принимает заказы"); return; }
    onHaptic?.();
    setPlacing(true);
    setError("");
    try {
      const order = await placeOrder(appliedPromo?.code ?? null, comment, selectedPickupIso);
      onClose();
      if (order) void navigate(`/orders/${order.display_id}`);
    } catch (err) {
      setError(translateApiError(err, "Ошибка при оформлении заказа"));
    } finally {
      setPlacing(false);
    }
  };

  const handleOverlayClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (drawerRef.current && !drawerRef.current.contains(e.target as Node)) onClose();
  };

  if (!cart.length) return null;

  return (
    <div className={s.overlay} onClick={handleOverlayClick}>
      <div
        className={s.drawer}
        ref={drawerRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="cart-drawer-title"
        tabIndex={-1}
      >
        <div className={s.handle} />
        <div className={s.inner}>
          <h2 id="cart-drawer-title" className={s.title}>Корзина</h2>

          <CartItemsList
            cart={cart}
            onDecrease={(menuItemId, selectedOptionIds) => { void removeFromCart(menuItemId, selectedOptionIds); }}
            onIncrease={(menuItem, selectedOptions) => { void addToCart(menuItem, cartRestaurantId as string, selectedOptions); }}
          />

          {!appliedPromo ? (
            <div style={{ marginTop: 16 }}>
              <div style={{ display: "flex", gap: 8 }}>
                <input
                  className="form-input"
                  placeholder="Промокод"
                  value={promoCode}
                  onChange={(e) => { setPromoCode(e.target.value.toUpperCase()); }}
                  onKeyDown={(e) => { if (e.key === "Enter") void handleApplyPromo(); }}
                  style={{ flex: 1, height: 40, fontSize: "0.85rem", borderRadius: "var(--r-md)", letterSpacing: "0.05em" }}
                />
                <button
                  className="btn btn-secondary"
                  onClick={() => { void handleApplyPromo(); }}
                  disabled={promoLoading || !promoCode.trim()}
                  style={{ height: 40, padding: "0 14px", fontSize: "0.8rem" }}
                >
                  {promoLoading ? "..." : "Применить"}
                </button>
              </div>
              {promoError && <div className="form-error" style={{ marginTop: 6, fontSize: "0.8rem" }}>{promoError}</div>}
            </div>
          ) : (
            <div style={{ marginTop: 16, padding: "10px 14px", background: "var(--color-success-bg)", border: "1px solid var(--color-success-border)", borderRadius: "var(--r-md)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: "0.85rem", color: "var(--color-success)", fontWeight: 700 }}>
                <TagIcon size={14} weight="fill" />
                {appliedPromo.code}
                {appliedPromo.discount_type === "PERCENT" ? ` −${appliedPromo.discount_value}%` : ` −${appliedPromo.discount_value} ₽`}
              </div>
              <button onClick={handleRemovePromo} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--color-success)", display: "flex" }}>
                <XIcon size={14} weight="bold" />
              </button>
            </div>
          )}

          <div className={s.total} style={{ marginTop: 16 }}>
            {appliedPromo && (
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.85rem", color: "var(--text-3)", marginBottom: 6, textDecoration: "line-through" }}>
                <span>Без скидки</span>
                <span>{total} ₽</span>
              </div>
            )}
            <span className={s.totalLabel}>{appliedPromo ? "Итого со скидкой" : "Итого"}</span>
            <span className={s.totalValue} style={appliedPromo ? { color: "var(--color-success)" } : undefined}>{finalTotal} ₽</span>
          </div>

          <textarea
            className="form-input"
            placeholder="Комментарий к заказу: побольше соуса, без острого..."
            value={comment}
            maxLength={500}
            onChange={(e) => { setComment(e.target.value); }}
            style={{ marginTop: 14, minHeight: 72, resize: "vertical", fontSize: "0.82rem", lineHeight: 1.45 }}
          />

          <PickupTimeSection
            pickupMode={pickupMode}
            onSelectAsap={() => { setPickupMode("asap"); }}
            onSelectScheduled={() => { setPickupMode("scheduled"); setRequestedPickupAt((c) => c || minPickupValue); }}
            requestedPickupAt={requestedPickupAt}
            onChangePickupAt={setRequestedPickupAt}
            minPickupValue={minPickupValue}
            maxPickupValue={maxPickupValue}
            minPickupDate={minPickupDate}
            pickupTooSoon={pickupTooSoon}
          />

          <LoadEstimateSection
            estimateLoading={estimateLoading}
            loadEstimate={loadEstimate}
            orderingUnavailable={orderingUnavailable}
            hasQueueWarning={hasQueueWarning}
          />

          <OrderButton
            className="btn-full"
            style={{ marginTop: 16 }}
            onClick={() => { void handlePlaceOrder(); }}
            isLoading={placing}
            disabled={isClosed || orderingUnavailable || (pickupMode === "scheduled" && (!selectedPickupIso || pickupTooSoon))}
          >
            {isClosed || orderingUnavailable ? "Приём заказов на паузе" : `Оформить заказ · ${finalTotal} ₽`}
          </OrderButton>

          {error && <div className="form-error" style={{ marginTop: "12px" }}>{error}</div>}

          <button
            className="btn btn-ghost btn-full"
            style={{ marginTop: 10, display: "flex", alignItems: "center", justifyContent: "center", gap: "8px", fontSize: "0.8rem" }}
            onClick={() => { void clearCart(); }}
          >
            <TrashIcon size={16} />
            Очистить корзину
          </button>
        </div>
      </div>
    </div>
  );
};

export default CartDrawer;
