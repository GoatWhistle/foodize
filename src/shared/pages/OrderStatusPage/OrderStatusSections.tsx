import { formatOptionsSummary } from "@shared/utils/price";
import type { Order } from "@shared/types/models";

interface OrderStatusSkeletonProps {
  screenClassName: string;
  loadError: string;
}

export const OrderStatusSkeleton = ({ screenClassName, loadError }: OrderStatusSkeletonProps) => (
  <div className={screenClassName}>
    {loadError && (
      <div className="form-error" style={{ marginBottom: 16, maxWidth: 380, width: "100%" }}>{loadError}</div>
    )}
    <div className="skeleton" style={{ width: 60, height: 14, marginBottom: 8, borderRadius: 4 }} />
    <div className="skeleton" style={{ width: 140, height: 72, borderRadius: 8, marginBottom: 16 }} />
    <div className="skeleton" style={{ width: 280, height: 32, borderRadius: 20, marginBottom: 24 }} />
    <div style={{ width: "100%", maxWidth: 380, background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: "var(--r-lg)", padding: 20 }}>
      {[1, 2, 3].map((i) => (
        <div key={i} style={{ display: "flex", justifyContent: "space-between", padding: "9px 0", borderBottom: "1px solid var(--border)" }}>
          <div className="skeleton" style={{ width: "58%", height: 14 }} />
          <div className="skeleton" style={{ width: "18%", height: 14 }} />
        </div>
      ))}
    </div>
  </div>
);

interface OrderDetailsProps {
  order: Order;
}

export const OrderDetails = ({ order }: OrderDetailsProps) => (
  <>
    <div style={{ marginTop: 20, width: "100%", maxWidth: 380, background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: "var(--r-lg)", padding: "16px 18px" }}>
      <div style={{ fontWeight: 700, fontSize: "0.64rem", letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--text-3)", marginBottom: 12 }}>
        Состав заказа
      </div>
      {Array.isArray(order.items) && order.items.map((item) => (
        <div key={item.id} style={{ display: "flex", alignItems: "center", padding: "8px 0", borderBottom: "1px solid var(--border)", fontSize: "0.88rem", gap: 8 }}>
          <span style={{ fontWeight: 700, color: "var(--accent)", minWidth: 24, fontSize: "0.78rem" }}>×{item.quantity}</span>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ color: "var(--text-1)", fontWeight: 600, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
              {item.menu_item_name}
            </div>
            {(item.selected_options?.length ?? 0) > 0 && (
              <div style={{ marginTop: 2, fontSize: "0.7rem", color: "var(--text-3)", lineHeight: 1.35 }}>
                {formatOptionsSummary(item.selected_options)}
              </div>
            )}
          </div>
          <span style={{ fontWeight: 700, flexShrink: 0, color: "var(--text-1)" }}>{item.price_at_purchase * item.quantity} ₽</span>
        </div>
      ))}
      <div style={{ display: "flex", justifyContent: "space-between", marginTop: 12, fontWeight: 800, fontSize: "1rem", letterSpacing: "-0.01em" }}>
        <span style={{ color: "var(--text-2)" }}>Итого</span>
        <span style={{ color: "var(--accent)" }}>{order.total_price} ₽</span>
      </div>
    </div>

    {(order.restaurant_name || order.restaurant_address) && (
      <div style={{ marginTop: 10, width: "100%", maxWidth: 380, background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: "var(--r-lg)", padding: "12px 18px" }}>
        {order.restaurant_name && (
          <div style={{ fontWeight: 700, fontSize: "0.88rem", color: "var(--text-1)" }}>{order.restaurant_name}</div>
        )}
        {order.restaurant_address && (
          <div style={{ fontSize: "0.78rem", color: "var(--text-3)", marginTop: 2 }}>{order.restaurant_address}</div>
        )}
      </div>
    )}
  </>
);
