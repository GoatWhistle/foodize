import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { TrashIcon } from "@phosphor-icons/react";
import { useShallow } from "zustand/react/shallow";
import { useCartStore } from "@shared/store/useCartStore.instance";
import { useOrdersStore } from "@shared/store/useOrdersStore.instance";
import { useAuthStore } from "@shared/store/useAuthStore.instance";
import { OrderButton } from "@shared/components/OrderButton/OrderButton";
import { orderService } from "@shared/services/orderService";
import { translateApiError } from "@shared/utils/translateApiError";
import { useFocusTrap } from "@shared/hooks/useFocusTrap";
import { useTranslation } from "@shared/i18n/useTranslation";
import type { OrderLoadEstimate } from "@shared/types/models";
import {
  CartItemsList,
  PickupTimeSection,
  LoadEstimateSection,
} from "./CartDrawerSections";
import { useCartPromo, CartPromoSection } from "./CartDrawerPromo";
import { useCartLoyalty, CartLoyaltySections } from "./CartDrawerLoyalty";
import s from "./CartDrawer.module.css";
import { formatPrice } from "@shared/utils/price";

const DEFAULT_WAIT_MINUTES = 15;
const QUEUE_WARNING_EXTRA_MINUTES = 10;
const MAX_PICKUP_DAYS = 7;
const MS_PER_MINUTE = 60_000;
const MS_PER_DAY = 24 * 60 * MS_PER_MINUTE;

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

export const CartDrawer = ({ onClose, isRestaurantOpen = true, onHaptic }: CartDrawerProps) => {
  const { t } = useTranslation();
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
  const authUser = useAuthStore((s) => s.user);
  const canLoyalty = authUser?.permissions.includes("loyalty.read") ?? false;
  const isFirstOrder = orders.length === 0;
  const drawerRef = useFocusTrap<HTMLDivElement>({ onEscape: onClose });

  const [comment, setComment] = useState("");
  const [pickupMode, setPickupMode] = useState<"asap" | "scheduled">("asap");
  const [requestedPickupAt, setRequestedPickupAt] = useState("");
  const [placing, setPlacing] = useState(false);
  const [error, setError] = useState("");
  const [loadEstimate, setLoadEstimate] = useState<OrderLoadEstimate | null>(null);
  const [estimateLoading, setEstimateLoading] = useState(false);
  const isClosed = !isRestaurantOpen;

  const promo = useCartPromo({ cartRestaurantId, cart, total, isFirstOrder });
  const { appliedPromo } = promo;
  const finalTotal = appliedPromo?.discounted_amount != null ? appliedPromo.discounted_amount : total;
  const loyalty = useCartLoyalty({ cartRestaurantId, canLoyalty, cart, finalTotal });
  const { redeemPoints, effectiveRewardId } = loyalty;
  const displayTotal = Math.max(0, finalTotal - redeemPoints);

  useEffect(() => {
    setComment("");
    setPickupMode("asap");
    setRequestedPickupAt("");
  }, [cartRestaurantId]);

  useEffect(() => {
    if (!cartRestaurantId) { setLoadEstimate(null); return; }
    const state = { cancelled: false };
    setEstimateLoading(true);
    void (async () => {
      try {
        const response = await orderService.getEstimate(cartRestaurantId);
        if (!state.cancelled) setLoadEstimate(response.data.data);
      } catch {
        if (!state.cancelled) setLoadEstimate(null);
      } finally {
        if (!state.cancelled) setEstimateLoading(false);
      }
    })();
    return () => { state.cancelled = true; };
  }, [cartRestaurantId]);

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
    if (isClosed) { setError(t("order.checkout.closed")); return; }
    onHaptic?.();
    setPlacing(true);
    setError("");
    try {
      const order = await placeOrder(
        appliedPromo?.code ?? null,
        comment,
        selectedPickupIso,
        redeemPoints,
        effectiveRewardId,
      );
      onClose();
      if (order) void navigate(`/orders/${order.display_id}`);
    } catch (err) {
      setError(translateApiError(err, t("order.checkout.failed")));
    } finally {
      setPlacing(false);
    }
  };

  const handleOverlayClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (drawerRef.current && !drawerRef.current.contains(e.target as Node)) onClose();
  };

  if (!cart.length) return null;

  return (
    <div className={s['overlay']} onClick={handleOverlayClick}>
      <div
        className={s['drawer']}
        ref={drawerRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="cart-drawer-title"
        tabIndex={-1}
      >
        <div className={s['handle']} />
        <div className={s['inner']}>
          <h2 id="cart-drawer-title" className={s['title']}>{t("order.cart.title")}</h2>

          <CartItemsList
            cart={cart}
            onDecrease={(menuItemId, selectedOptionIds) => { void removeFromCart(menuItemId, selectedOptionIds); }}
            onIncrease={(menuItem, selectedOptions) => { void addToCart(menuItem, cartRestaurantId as string, selectedOptions); }}
          />

          <CartPromoSection promo={promo} />

          <CartLoyaltySections loyalty={loyalty} />

          <div className={s['total']} style={{ marginTop: 16 }}>
            {appliedPromo && (
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "var(--text-base)", color: "var(--text-3)", marginBottom: 6, textDecoration: "line-through" }}>
                <span>{t("order.cart.withoutDiscount")}</span>
                <span>{formatPrice(total)}</span>
              </div>
            )}
            <span className={s['totalLabel']}>{appliedPromo || redeemPoints > 0 ? t("order.cart.totalWithDiscount") : t("order.cart.total")}</span>
            <span className={s['totalValue']} style={appliedPromo || redeemPoints > 0 ? { color: "var(--color-success)" } : undefined}>{formatPrice(displayTotal)}</span>
          </div>

          <textarea
            className="form-input"
            placeholder={t("order.cart.commentPlaceholder")}
            value={comment}
            maxLength={500}
            onChange={(e) => { setComment(e.target.value); }}
            style={{ marginTop: 14, minHeight: 72, resize: "vertical", fontSize: "var(--text-md)", lineHeight: 1.45 }}
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
            className={`btn-full ${s['submit'] ?? ''}`}
            style={{ marginTop: 16 }}
            onClick={() => { void handlePlaceOrder(); }}
            isLoading={placing}
            disabled={isClosed || orderingUnavailable || (pickupMode === "scheduled" && (!selectedPickupIso || pickupTooSoon))}
          >
            {isClosed || orderingUnavailable
              ? t("order.checkout.paused")
              : t("order.checkout.submit", { total: formatPrice(displayTotal) })}
          </OrderButton>

          {error && <div className="form-error" style={{ marginTop: "12px" }}>{error}</div>}

          <button
            className="btn btn-ghost btn-full"
            style={{ marginTop: 10, display: "flex", alignItems: "center", justifyContent: "center", gap: "8px", fontSize: "var(--text-base)" }}
            onClick={() => { void clearCart(); }}
          >
            <TrashIcon size={16} />
            {t("order.cart.clear")}
          </button>
        </div>
      </div>
    </div>
  );
};
