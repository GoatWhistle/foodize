import { useEffect, useRef, useState } from "react";
import { Plus, Minus, Trash, Tag, X } from "@phosphor-icons/react";
import { useOrderStore } from "../../store/useOrderStore";
import OrderButton from "./OrderButton";
import { promoService } from "../../services/promoService";
import { translateApiError } from "../../utils/translateApiError";

const CartDrawer = ({ onClose, onCheckout, isLoading, error }) => {
  const { cart, cartRestaurantId, removeFromCart, addToCart, clearCart } =
    useOrderStore();
  const total = useOrderStore((s) => s.cartTotal());
  const drawerRef = useRef(null);

  const [promoCode, setPromoCode] = useState("");
  const [appliedPromo, setAppliedPromo] = useState(null);
  const [promoError, setPromoError] = useState("");
  const [promoLoading, setPromoLoading] = useState(false);

  const handleOverlayClick = (e) => {
    if (drawerRef.current && !drawerRef.current.contains(e.target)) onClose();
  };

  useEffect(() => {
    const handler = (e) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [onClose]);

  useEffect(() => {
    setAppliedPromo(null);
    setPromoCode("");
    setPromoError("");
  }, [cartRestaurantId]);

  const handleApplyPromo = async () => {
    if (!promoCode.trim() || !cartRestaurantId) return;
    setPromoLoading(true);
    setPromoError("");
    try {
      const res = await promoService.validate(
        promoCode.trim(),
        cartRestaurantId,
      );
      setAppliedPromo({ ...res.data.data, originalTotal: total });
    } catch (err) {
      setPromoError(translateApiError(err, "Неверный промокод"));
      setAppliedPromo(null);
    } finally {
      setPromoLoading(false);
    }
  };

  const handleRemovePromo = () => {
    setAppliedPromo(null);
    setPromoCode("");
    setPromoError("");
  };

  const finalTotal =
    appliedPromo?.discounted_amount != null
      ? appliedPromo.discounted_amount
      : total;

  if (!cart.length) return null;

  return (
    <div className="cart-overlay" onClick={handleOverlayClick}>
      <div className="cart-drawer" ref={drawerRef}>
        <div className="cart-handle" />

        <div className="cart-inner">
          <h2 className="cart-title">Корзина</h2>

          <div className="cart-items">
            {cart.map(({ menuItem, quantity }) => (
              <div key={menuItem.id} className="cart-item">
                <span className="cart-item-name">{menuItem.name}</span>

                <div className="cart-item-controls">
                  <button
                    className="qty-btn"
                    onClick={() => removeFromCart(menuItem.id)}
                    aria-label="Уменьшить"
                  >
                    <Minus size={12} weight="bold" />
                  </button>
                  <span
                    style={{
                      fontWeight: 700,
                      minWidth: 20,
                      textAlign: "center",
                      fontSize: "0.9rem",
                    }}
                  >
                    {quantity}
                  </span>
                  <button
                    className="qty-btn"
                    onClick={() => addToCart(menuItem, cartRestaurantId)}
                    aria-label="Увеличить"
                  >
                    <Plus size={12} weight="bold" />
                  </button>
                </div>

                <span
                  style={{
                    fontWeight: 700,
                    minWidth: 64,
                    textAlign: "right",
                    fontSize: "0.9rem",
                    color: "var(--text-1)",
                  }}
                >
                  {menuItem.price * quantity} ₽
                </span>
              </div>
            ))}
          </div>

          {/* Promo code */}
          {!appliedPromo ? (
            <div style={{ marginTop: 16 }}>
              <div style={{ display: "flex", gap: 8 }}>
                <input
                  className="form-input"
                  placeholder="Промокод"
                  value={promoCode}
                  onChange={(e) => setPromoCode(e.target.value.toUpperCase())}
                  onKeyDown={(e) => e.key === "Enter" && handleApplyPromo()}
                  style={{
                    flex: 1,
                    height: 40,
                    fontSize: "0.85rem",
                    borderRadius: "var(--r-md)",
                    letterSpacing: "0.05em",
                  }}
                />
                <button
                  className="btn btn-secondary"
                  onClick={handleApplyPromo}
                  disabled={promoLoading || !promoCode.trim()}
                  style={{ height: 40, padding: "0 14px", fontSize: "0.8rem" }}
                >
                  {promoLoading ? "..." : "Применить"}
                </button>
              </div>
              {promoError && (
                <div
                  className="form-error"
                  style={{ marginTop: 6, fontSize: "0.8rem" }}
                >
                  {promoError}
                </div>
              )}
            </div>
          ) : (
            <div
              style={{
                marginTop: 16,
                padding: "10px 14px",
                background: "rgba(34,197,94,0.08)",
                border: "1px solid rgba(34,197,94,0.3)",
                borderRadius: "var(--r-md)",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  fontSize: "0.85rem",
                  color: "#22c55e",
                  fontWeight: 700,
                }}
              >
                <Tag size={14} weight="fill" />
                {appliedPromo.code}
                {appliedPromo.discount_type === "PERCENT"
                  ? ` −${appliedPromo.discount_value}%`
                  : ` −${appliedPromo.discount_value} ₽`}
              </div>
              <button
                onClick={handleRemovePromo}
                style={{
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  color: "#22c55e",
                  display: "flex",
                }}
              >
                <X size={14} weight="bold" />
              </button>
            </div>
          )}

          <div className="cart-total" style={{ marginTop: 16 }}>
            {appliedPromo && (
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  fontSize: "0.85rem",
                  color: "var(--text-3)",
                  marginBottom: 6,
                  textDecoration: "line-through",
                }}
              >
                <span>Без скидки</span>
                <span>{total} ₽</span>
              </div>
            )}
            <span className="cart-total-label">
              {appliedPromo ? "Итого со скидкой" : "Итого"}
            </span>
            <span
              className="cart-total-value"
              style={appliedPromo ? { color: "#22c55e" } : undefined}
            >
              {finalTotal} ₽
            </span>
          </div>

          <OrderButton
            className="btn-full"
            onClick={() => onCheckout(appliedPromo?.code ?? null)}
            isLoading={isLoading}
          >
            Оформить заказ
          </OrderButton>

          {error && (
            <div className="form-error" style={{ marginTop: "12px" }}>
              {error}
            </div>
          )}

          <button
            className="btn btn-ghost btn-full"
            style={{
              marginTop: 10,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "8px",
              fontSize: "0.8rem",
            }}
            onClick={clearCart}
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
