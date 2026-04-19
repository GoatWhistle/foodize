import { useEffect, useRef } from "react";
import { Plus, Minus, Trash } from "@phosphor-icons/react";
import { useOrderStore } from "../../store/useOrderStore";
import OrderButton from "./OrderButton";

const CartDrawer = ({ onClose, onCheckout, isLoading, error }) => {
  const { cart, cartRestaurantId, removeFromCart, addToCart, clearCart } =
    useOrderStore();

  const total = useOrderStore((s) => s.cartTotal());
  const drawerRef = useRef(null);

  const handleOverlayClick = (e) => {
    if (drawerRef.current && !drawerRef.current.contains(e.target)) {
      onClose();
    }
  };

  useEffect(() => {
    const handler = (e) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [onClose]);

  if (!cart.length) return null;

  return (
    <div className="cart-overlay" onClick={handleOverlayClick}>
      <div className="cart-drawer" ref={drawerRef}>
        <div className="cart-handle" />
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
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <Minus size={14} weight="bold" />
                </button>
                <span
                  style={{ fontWeight: 700, minWidth: 20, textAlign: "center" }}
                >
                  {quantity}
                </span>
                <button
                  className="qty-btn"
                  onClick={() => addToCart(menuItem, cartRestaurantId)}
                  aria-label="Увеличить"
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <Plus size={14} weight="bold" />
                </button>
              </div>
              <span
                style={{ fontWeight: 700, minWidth: 60, textAlign: "right" }}
              >
                {menuItem.price * quantity} ₽
              </span>
            </div>
          ))}
        </div>

        <div className="cart-total">
          <span className="cart-total-label">Итого</span>
          <span className="cart-total-value">{total} ₽</span>
        </div>

        <OrderButton
          className="btn-full"
          onClick={onCheckout}
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
            marginTop: 8,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "8px",
          }}
          onClick={clearCart}
        >
          <Trash size={18} />
          Очистить корзину
        </button>
      </div>
    </div>
  );
};

export default CartDrawer;
