import { useEffect, useRef, useState } from 'react';
import { Plus, Minus, Trash, Tag, X } from '@phosphor-icons/react';
import { useOrderStore } from '../../store/useOrderStore';
import { useRestaurantStore } from '../../store/useRestaurantStore';
import { useShallow } from 'zustand/react/shallow';
import OrderButton from './OrderButton';
import ProductSheet from './ProductSheet';
import { promoService } from '../../services/promoService';
import { translateApiError } from '../../utils/translateApiError';

const CartDrawer = ({ onClose, onCheckout, isLoading, error }) => {
  const { cart, cartRestaurantId, removeFromCart, addToCart, clearCart } =
    useOrderStore(
      useShallow((s) => ({
        cart: s.cart,
        cartRestaurantId: s.cartRestaurantId,
        removeFromCart: s.removeFromCart,
        addToCart: s.addToCart,
        clearCart: s.clearCart,
      }))
    );
  const total = useOrderStore((s) => s.cartTotal());
  const menu = useRestaurantStore((s) => s.menus[cartRestaurantId]) || [];
  const drawerRef = useRef(null);

  const [promoCode, setPromoCode] = useState('');
  const [appliedPromo, setAppliedPromo] = useState(null);
  const [promoError, setPromoError] = useState('');
  const [promoLoading, setPromoLoading] = useState(false);
  const [comment, setComment] = useState('');
  const [upsellProduct, setUpsellProduct] = useState(null);

  const handleOverlayClick = (e) => {
    if (drawerRef.current && !drawerRef.current.contains(e.target)) onClose();
  };

  useEffect(() => {
    const handler = (e) => e.key === 'Escape' && onClose();
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [onClose]);

  useEffect(() => {
    setAppliedPromo(null);
    setPromoCode('');
    setPromoError('');
    setComment('');
  }, [cartRestaurantId]);

  const handleApplyPromo = async () => {
    if (!promoCode.trim() || !cartRestaurantId) return;
    setPromoLoading(true);
    setPromoError('');
    try {
      const res = await promoService.validate(
        promoCode.trim(),
        cartRestaurantId
      );
      setAppliedPromo({ ...res.data.data, originalTotal: total });
    } catch (err) {
      setPromoError(translateApiError(err, 'Неверный промокод'));
      setAppliedPromo(null);
    } finally {
      setPromoLoading(false);
    }
  };

  const handleRemovePromo = () => {
    setAppliedPromo(null);
    setPromoCode('');
    setPromoError('');
  };

  const finalTotal =
    appliedPromo?.discounted_amount != null
      ? appliedPromo.discounted_amount
      : total;
  const discountAmount = Math.max(0, total - finalTotal);

  const getSelectedOptionIds = (item) =>
    item.selectedOptionIds ??
    item.selected_option_ids ??
    getSelectedOptions(item).map((option) => option.id ?? option.option_id);

  const getSelectedOptions = (item) =>
    item.selectedOptions ?? item.selected_options ?? [];

  const getLinePrice = (item) =>
    (Number(item.menuItem.price) || 0) +
    getSelectedOptions(item).reduce(
      (sum, option) => sum + (Number(option.price_delta) || 0),
      0
    );

  const cartItemIds = new Set(cart.map((i) => i.menuItem.id));
  const upsellItems = menu
    .filter(
      (i) =>
        !cartItemIds.has(i.id) &&
        i.is_available !== false &&
        (i.category === 'DRINK' ||
          i.category === 'SNACK' ||
          Number(i.price) <= 250)
    )
    .sort(() => Math.random() - 0.5)
    .slice(0, 3);

  if (!cart.length) return null;

  return (
    <div className="cart-overlay" onClick={handleOverlayClick}>
      <div className="cart-drawer" ref={drawerRef}>
        <div className="cart-handle" />

        {/* Scrollable items area */}
        <div className="cart-inner">
          <div className="cart-header">
            <div>
              <h2 className="cart-title">Корзина</h2>
              <p>
                {cart.length} позиций · {total} ₽
              </p>
            </div>
            <button
              type="button"
              className="cart-close-btn"
              onClick={onClose}
              aria-label="Закрыть корзину"
            >
              <X size={18} weight="bold" />
            </button>
          </div>

          <div className="cart-items">
            {cart.map((cartItem) => {
              const { menuItem, quantity } = cartItem;
              const selectedOptions = getSelectedOptions(cartItem);
              const selectedOptionIds = getSelectedOptionIds(cartItem);
              const lineKey = `${menuItem.id}:${selectedOptionIds.join(',')}`;

              return (
                <div key={lineKey} className="cart-item">
                  <div className="cart-item-thumb">
                    {menuItem.photo_url || menuItem.image_url ? (
                      <img
                        src={menuItem.photo_url || menuItem.image_url}
                        alt={menuItem.name}
                      />
                    ) : (
                      <span>{menuItem.name?.slice(0, 1) || 'F'}</span>
                    )}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <span className="cart-item-name">{menuItem.name}</span>
                    <span className="cart-item-unit">
                      {getLinePrice(cartItem)} ₽ за шт.
                    </span>
                    {selectedOptions.length > 0 && (
                      <div className="cart-item-options">
                        {selectedOptions.map((option) => (
                          <span key={option.id ?? option.option_id}>
                            {option.name}
                            {option.price_delta
                              ? ` +${option.price_delta} ₽`
                              : ''}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="cart-item-controls">
                    <button
                      className="qty-btn"
                      onClick={() =>
                        removeFromCart(menuItem.id, selectedOptionIds)
                      }
                      aria-label="Уменьшить"
                    >
                      <Minus size={12} weight="bold" />
                    </button>
                    <span
                      style={{
                        fontWeight: 700,
                        minWidth: 20,
                        textAlign: 'center',
                        fontSize: '0.9rem',
                      }}
                    >
                      {quantity}
                    </span>
                    <button
                      className="qty-btn"
                      onClick={() =>
                        addToCart(menuItem, cartRestaurantId, selectedOptions)
                      }
                      aria-label="Увеличить"
                    >
                      <Plus size={12} weight="bold" />
                    </button>
                  </div>

                  <span className="cart-item-line-total">
                    {getLinePrice(cartItem) * quantity} ₽
                  </span>
                </div>
              );
            })}
          </div>

          {upsellItems.length > 0 && (
            <div style={{ marginBottom: 20 }}>
              <h3
                style={{
                  fontSize: '0.9rem',
                  fontWeight: 700,
                  marginBottom: 12,
                  color: 'var(--text-2)',
                }}
              >
                Не забудьте добавить
              </h3>
              <div
                style={{
                  display: 'flex',
                  gap: 10,
                  overflowX: 'auto',
                  paddingBottom: 8,
                  scrollbarWidth: 'none',
                }}
              >
                {upsellItems.map((item) => (
                  <div
                    key={item.id}
                    style={{
                      flex: '0 0 auto',
                      width: 140,
                      border: '1px solid var(--border)',
                      borderRadius: 'var(--r-sm)',
                      padding: 10,
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 6,
                    }}
                  >
                    <div
                      style={{
                        fontSize: '0.8rem',
                        fontWeight: 600,
                        color: 'var(--text-1)',
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                      }}
                    >
                      {item.name}
                    </div>
                    <div style={{ fontSize: '0.85rem', fontWeight: 800 }}>
                      {item.price} ₽
                    </div>
                    <button
                      className="btn btn-secondary btn-sm"
                      style={{
                        marginTop: 'auto',
                        fontSize: '0.75rem',
                        padding: '4px 8px',
                      }}
                      onClick={() => setUpsellProduct(item)}
                    >
                      <Plus size={12} /> Выбрать
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Promo code */}
          {!appliedPromo ? (
            <div style={{ marginTop: 16 }}>
              <div style={{ display: 'flex', gap: 8 }}>
                <input
                  className="form-input"
                  placeholder="Промокод"
                  value={promoCode}
                  onChange={(e) => setPromoCode(e.target.value.toUpperCase())}
                  onKeyDown={(e) => e.key === 'Enter' && handleApplyPromo()}
                  style={{
                    flex: 1,
                    height: 40,
                    fontSize: '0.85rem',
                    borderRadius: 'var(--r-md)',
                    letterSpacing: '0.05em',
                  }}
                />
                <button
                  className="btn btn-secondary"
                  onClick={handleApplyPromo}
                  disabled={promoLoading || !promoCode.trim()}
                  style={{ height: 40, padding: '0 14px', fontSize: '0.8rem' }}
                >
                  {promoLoading ? '...' : 'Применить'}
                </button>
              </div>
              {promoError && (
                <div
                  className="form-error"
                  style={{ marginTop: 6, fontSize: '0.8rem' }}
                >
                  {promoError}
                </div>
              )}
            </div>
          ) : (
            <div
              className="promo-success-badge"
              style={{
                marginTop: 16,
                padding: '10px 14px',
                background: 'var(--color-success-bg)',
                border: '1px solid var(--color-success-border)',
                borderRadius: 'var(--r-md)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  fontSize: '0.85rem',
                  color: 'var(--color-success)',
                  fontWeight: 700,
                }}
              >
                <Tag size={14} weight="fill" />
                {appliedPromo.code}
                {appliedPromo.discount_type === 'PERCENT'
                  ? ` −${appliedPromo.discount_value}%`
                  : ` −${appliedPromo.discount_value} ₽`}
              </div>
              <button
                onClick={handleRemovePromo}
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  color: 'var(--color-success)',
                  display: 'flex',
                }}
              >
                <X size={14} weight="bold" />
              </button>
            </div>
          )}

          <textarea
            className="form-input"
            placeholder="Комментарий к заказу: побольше соуса, без острого..."
            value={comment}
            maxLength={500}
            onChange={(e) => setComment(e.target.value)}
            style={{
              marginTop: 16,
              minHeight: 72,
              resize: 'vertical',
              fontSize: '0.82rem',
              lineHeight: 1.45,
            }}
          />

          <button
            className="btn btn-ghost btn-full"
            style={{
              marginTop: 8,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              fontSize: '0.8rem',
            }}
            onClick={clearCart}
          >
            <Trash size={16} />
            Очистить корзину
          </button>
        </div>

        {/* Sticky footer: total + checkout */}
        <div className="cart-footer">
          <div className="cart-summary">
            {appliedPromo && (
              <div>
                <span>Скидка</span>
                <strong style={{ color: 'var(--color-success)' }}>
                  −{discountAmount} ₽
                </strong>
              </div>
            )}
            <div className="cart-total">
              <span className="cart-total-label">Итого</span>
              <span
                className="cart-total-value"
                style={
                  appliedPromo ? { color: 'var(--color-success)' } : undefined
                }
              >
                {finalTotal} ₽
              </span>
            </div>
          </div>

          <OrderButton
            className="btn-full"
            onClick={() => onCheckout(appliedPromo?.code ?? null, comment)}
            isLoading={isLoading}
          >
            Оформить заказ
          </OrderButton>

          {error && (
            <div className="form-error" style={{ marginTop: '10px' }}>
              {error}
            </div>
          )}
        </div>

        {upsellProduct && (
          <ProductSheet
            item={upsellProduct}
            onClose={() => setUpsellProduct(null)}
            onAdd={({ item, selectedOptions, quantity }) => {
              addToCart(item, cartRestaurantId, selectedOptions, quantity);
              setUpsellProduct(null);
            }}
          />
        )}
      </div>
    </div>
  );
};

export default CartDrawer;
