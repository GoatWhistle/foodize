import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Package,
  Clock,
  CheckCircle,
  Prohibit,
  CookingPot,
  CaretRight,
  HandPalm,
} from "@phosphor-icons/react";
import { useOrderStore } from "../../store/useOrderStore";
import EmptyState from "../../components/ui/EmptyState";
import { ROUTES } from "../../constants/routes";
import Pagination from "../../components/ui/Pagination";

const STATUS_CONFIG = {
  PENDING: {
    label: "Принят",
    className: "pending",
    icon: <Clock weight="bold" />,
  },
  ACCEPTED: {
    label: "Подтверждён",
    className: "pending",
    icon: <CheckCircle weight="bold" />,
  },
  COOKING: {
    label: "Готовится",
    className: "preparing",
    icon: <CookingPot weight="bold" />,
  },
  READY: {
    label: "Готов",
    className: "ready",
    icon: <HandPalm weight="bold" />,
  },
  COMPLETED: {
    label: "Выдан",
    className: "ready",
    icon: <CheckCircle weight="fill" />,
  },
  CANCELLED: {
    label: "Отменён",
    className: "cancelled",
    icon: <Prohibit weight="bold" />,
  },
};

const OrdersPage = () => {
  const { orders, ordersTotal, fetchMyOrders, ordersLoading } = useOrderStore();
  const navigate = useNavigate();
  const [page, setPage] = useState(1);
  const size = 20;

  useEffect(() => {
    fetchMyOrders({ page, size });
  }, [fetchMyOrders, page]);

  const totalPages = Math.ceil(ordersTotal / size);

  if (ordersLoading) {
    return (
      <div className="loading-center">
        <div className="spinner" />
      </div>
    );
  }

  return (
    <div className="page-enter" style={{ padding: "28px var(--gutter, 20px)" }}>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "12px",
          marginBottom: "24px",
        }}
      >
        <Package size={24} weight="bold" color="var(--fire)" />
        <h1
          style={{
            fontFamily: "var(--font-serif)",
            fontSize: "1.6rem",
            fontWeight: 700,
            letterSpacing: "-0.03em",
            margin: 0,
            color: "var(--text-1)",
          }}
        >
          Мои заказы
        </h1>
      </div>

      {orders.length === 0 ? (
        <EmptyState
          title="Заказов пока нет"
          subtitle="Сделайте первый заказ — это займёт меньше минуты"
          action={{
            label: "Выбрать заведение",
            onClick: () => navigate(ROUTES.HOME),
          }}
        />
      ) : (
        <>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {orders.map((order) => {
              const cfg = STATUS_CONFIG[order.status] || STATUS_CONFIG.PENDING;
              return (
                <div
                  key={order.id}
                  id={`order-card-${order.id}`}
                  className="order-card"
                  onClick={() =>
                    navigate(ROUTES.ORDER_STATUS.replace(":id", order.id))
                  }
                >
                  <div style={{ flex: 1 }}>
                    <div
                      style={{
                        fontWeight: 700,
                        fontSize: "0.9rem",
                        letterSpacing: "-0.02em",
                        marginBottom: 4,
                        color: "var(--text-1)",
                      }}
                    >
                      Заказ #{order.id.slice(0, 8)}
                    </div>
                    <div
                      style={{ fontSize: "0.78rem", color: "var(--text-3)" }}
                    >
                      {order.items?.length || 0} позиций
                    </div>
                  </div>

                  <div
                    style={{
                      textAlign: "right",
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "flex-end",
                      gap: 6,
                    }}
                  >
                    <span
                      className={`order-status-badge ${cfg.className}`}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "4px",
                      }}
                    >
                      {cfg.icon}
                      {cfg.label}
                    </span>
                    <span
                      style={{
                        fontWeight: 800,
                        fontSize: "1rem",
                        letterSpacing: "-0.02em",
                        color: "var(--text-1)",
                      }}
                    >
                      {order.total_price} ₽
                    </span>
                  </div>

                  <CaretRight
                    size={18}
                    color="var(--text-3)"
                    style={{ marginLeft: 4, flexShrink: 0 }}
                  />
                </div>
              );
            })}
          </div>

          <Pagination
            page={page}
            totalPages={totalPages}
            onPageChange={setPage}
          />
        </>
      )}
    </div>
  );
};

export default OrdersPage;
