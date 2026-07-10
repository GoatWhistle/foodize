import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Clock,
  Plus,
  Minus,
  Trash,
  Tag,
  WarningCircle,
  X,
} from "@phosphor-icons/react";
import { useShallow } from "zustand/react/shallow";
import { useOrderStore } from "@shared/store/useOrderStore.instance";
import OrderButton from "@shared/components/OrderButton/OrderButton";
import { promoService } from "@shared/services/promoService";
import { formatOptionsSummary } from "@shared/utils/price";
import { orderService } from "@shared/services/orderService";
import { translateApiError } from "@shared/utils/translateApiError";
import type { CartLine, CartLineOption } from "@shared/store/useOrderStore";
import type { PromoValidate, OrderLoadEstimate } from "@shared/types/models";
import s from "./CartDrawer.module.css";

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

const getSelectedOptions = (item: CartLine): CartLineOption[] =>
  item.selectedOptions ?? item.selected_options ?? [];

const getSelectedOptionIds = (item: CartLine): string[] =>
  (item.selectedOptionIds ??
    item.selected_option_ids ??
    getSelectedOptions(item).map((o) => o.id ?? o.option_id)).filter(
    (id): id is string => Boolean(id),
  );

const getLinePrice = (item: CartLine): number =>
  (Number(item.menuItem.price) || 0) +
  getSelectedOptions(item).reduce((sum, o) => sum + (Number(o.price_delta) || 0), 0);

const CartDrawer = ({ onClose, isRestaurantOpen = true, onHaptic }: CartDrawerProps) => {
  const navigate = useNavigate();
  const { cart, cartRestaurantId, removeFromCart, addToCart, clearCart, placeOrder, orders } =
    useOrderStore(
      useShallow((s) => ({
        cart: s.cart,
        cartRestaurantId: s.cartRestaurantId,
        removeFromCart: s.removeFromCart,
        addToCart: s.addToCart,
        clearCart: s.clearCart,
        placeOrder: s.placeOrder,
        orders: s.orders,
      })),
    );
  const total = useOrderStore((s) => s.cartTotal());
  const isFirstOrder = orders.length === 0;
  const drawerRef = useRef<HTMLDivElement>(null);

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
  const isClosed = isRestaurantOpen === false;

  useEffect(() => {
    const handler = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [onClose]);

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
      .then((res) => { if (!cancelled) setLoadEstimate(res.data?.data || null); })
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
  const orderingUnavailable = Boolean(loadEstimate && loadEstimate.ordering_available === false);
  const hasQueueWarning = Boolean(
    loadEstimate &&
      loadEstimate.ordering_available &&
      (loadEstimate.estimated_wait_min_minutes > loadEstimate.avg_prep_time_minutes + 10 ||
        (loadEstimate.max_active_orders && loadEstimate.active_orders_count >= loadEstimate.max_active_orders)),
  );
  const minPickupDate = new Date(Date.now() + Math.max(loadEstimate?.estimated_wait_min_minutes ?? 15, 1) * 60000);
  const maxPickupDate = new Date(Date.now() + 7 * 24 * 60 * 60000);
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
      <div className={s.drawer} ref={drawerRef}>
        <div className={s.handle} />
        <div className={s.inner}>
          <h2 className={s.title}>Корзина</h2>

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
                    <button className={s.qtyBtn} onClick={() => { void removeFromCart(menuItem.id, selectedOptionIds); }} aria-label="Уменьшить">
                      <Minus size={12} weight="bold" />
                    </button>
                    <span style={{ fontWeight: 700, minWidth: 20, textAlign: "center", fontSize: "0.9rem" }}>{quantity}</span>
                    <button className={s.qtyBtn} onClick={() => { void addToCart(menuItem, cartRestaurantId as string, selectedOptions); }} aria-label="Увеличить">
                      <Plus size={12} weight="bold" />
                    </button>
                  </div>
                  <span style={{ fontWeight: 700, minWidth: 64, textAlign: "right", fontSize: "0.9rem", color: "var(--text-1)" }}>
                    {getLinePrice(cartItem) * quantity} ₽
                  </span>
                </div>
              );
            })}
          </div>

          {!appliedPromo ? (
            <div style={{ marginTop: 16 }}>
              <div style={{ display: "flex", gap: 8 }}>
                <input
                  className="form-input"
                  placeholder="Промокод"
                  value={promoCode}
                  onChange={(e) => setPromoCode(e.target.value.toUpperCase())}
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
                <Tag size={14} weight="fill" />
                {appliedPromo.code}
                {appliedPromo.discount_type === "PERCENT" ? ` −${appliedPromo.discount_value}%` : ` −${appliedPromo.discount_value} ₽`}
              </div>
              <button onClick={handleRemovePromo} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--color-success)", display: "flex" }}>
                <X size={14} weight="bold" />
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
            onChange={(e) => setComment(e.target.value)}
            style={{ marginTop: 14, minHeight: 72, resize: "vertical", fontSize: "0.82rem", lineHeight: 1.45 }}
          />

          <div style={{ marginTop: 14, padding: "12px 14px", border: "1px solid var(--border)", borderRadius: "var(--r-md)", background: "var(--bg-card)" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10, fontSize: "0.86rem", fontWeight: 800, color: "var(--text-1)" }}>
              <Clock size={16} weight="bold" />
              Время получения
            </div>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              <button type="button" className={`category-chip${pickupMode === "asap" ? " active" : ""}`} onClick={() => setPickupMode("asap")}>
                Как можно скорее
              </button>
              <button
                type="button"
                className={`category-chip${pickupMode === "scheduled" ? " active" : ""}`}
                onClick={() => { setPickupMode("scheduled"); setRequestedPickupAt((c) => c || minPickupValue); }}
              >
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
                  onChange={(e) => setRequestedPickupAt(e.target.value)}
                  style={{ height: 40, fontSize: "0.85rem" }}
                />
                <div style={{ marginTop: 6, fontSize: "0.76rem", color: pickupTooSoon ? "var(--error)" : "var(--text-3)" }}>
                  Минимум: {minPickupDate.toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit" })}
                </div>
              </div>
            )}
          </div>

          {estimateLoading && (
            <div style={{ marginTop: 14, padding: "10px 12px", border: "1px solid var(--border)", borderRadius: "var(--r-md)", color: "var(--text-3)", fontSize: "0.85rem", fontWeight: 700 }}>
              Проверяем очередь...
            </div>
          )}

          {loadEstimate && (
            <div style={{ marginTop: 14, padding: "12px 14px", borderRadius: "var(--r-md)", border: orderingUnavailable ? "1px solid var(--error)" : hasQueueWarning ? "1px solid var(--color-warning-border)" : "1px solid var(--border)", background: orderingUnavailable ? "var(--color-error-bg)" : hasQueueWarning ? "var(--color-warning-bg)" : "var(--bg-card)", display: "flex", gap: 10, alignItems: "flex-start" }}>
              {orderingUnavailable ? (
                <WarningCircle size={18} weight="fill" color="var(--error)" />
              ) : (
                <Clock size={18} weight="fill" color={hasQueueWarning ? "var(--color-warning)" : "var(--text-3)"} />
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
          )}

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
            <Trash size={16} />
            Очистить корзину
          </button>
        </div>
      </div>
    </div>
  );
};

export default CartDrawer;
