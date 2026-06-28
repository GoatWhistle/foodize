import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  Package,
  Clock,
  CheckCircle,
  CaretRight,
  HandPalm,
  X,
  ArrowClockwise,
} from "@phosphor-icons/react";
import { useOrderStore } from "../../store/useOrderStore";
import { useShallow } from "zustand/react/shallow";
import { BackButton } from "../../telegram/sdk";
import EmptyState from "@shared/components/EmptyState/EmptyState";
import s from "./OrdersPage.module.css";

const STATUS_CONFIG = {
  PENDING: { label: "Ожидается", color: "var(--accent)", bg: "var(--accent-subtle)", icon: <Clock weight="bold" size={13} /> },
  ACCEPTED: { label: "Принят", color: "var(--accent-dim)", bg: "oklch(46% 0.12 42 / 0.12)", icon: <CheckCircle weight="bold" size={13} /> },
  READY: { label: "Готово", color: "var(--color-success)", bg: "var(--color-success-bg)", icon: <HandPalm weight="bold" size={13} /> },
  COMPLETED: { label: "Выдан", color: "var(--dusk)", bg: "rgba(107,93,74,0.1)", icon: <CheckCircle weight="fill" size={13} /> },
  CANCELLED: { label: "Отменён", color: "var(--color-error)", bg: "var(--color-error-bg)", icon: <X weight="bold" size={13} /> },
};

const STATUS_FILTERS = [
  { key: "", label: "Все" },
  { key: "ACTIVE", label: "Активные" },
  { key: "COMPLETED", label: "Выданные" },
];

const RESTAURANT_EMOJI = ["🍕", "🍔", "🌯", "🍱", "🥗", "☕", "🍩", "🥙"];
const getRestaurantEmoji = (id) => RESTAURANT_EMOJI[Math.abs(id?.charCodeAt(0) ?? 0) % RESTAURANT_EMOJI.length];

const getDisplayId = (order) => order.display_id ?? order.id.slice(0, 8);

const formatOrderDate = (value) => {
  if (!value) return "";
  const d = new Date(value);
  const today = new Date();
  const isToday = d.toDateString() === today.toDateString();
  if (isToday) {
    return d.toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit" });
  }
  return d.toLocaleDateString("ru-RU", { day: "numeric", month: "short" });
};

const SIZE = 20;

const OrdersPage = () => {
  const navigate = useNavigate();
  const { orders, ordersTotal, fetchMyOrders, ordersLoading } = useOrderStore(
    useShallow((s) => ({
      orders: s.orders,
      ordersTotal: s.ordersTotal,
      fetchMyOrders: s.fetchMyOrders,
      ordersLoading: s.ordersLoading,
    })),
  );

  const [statusFilter, setStatusFilter] = useState("");
  const [page, setPage] = useState(1);
  const [allOrders, setAllOrders] = useState([]);
  const [hasMore, setHasMore] = useState(true);
  const sentinelRef = useRef(null);

  const [pullY, setPullY] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const touchStartY = useRef(0);
  const containerRef = useRef(null);

  useEffect(() => {
    if (BackButton) {
      BackButton.show();
      const handler = () => navigate("/");
      BackButton.onClick(handler);
      return () => {
        BackButton.offClick(handler);
        BackButton.hide();
      };
    }
  }, [navigate]);

  const load = useCallback(
    (p = page) => {
      fetchMyOrders({
        page: p,
        size: SIZE,
        status: statusFilter === "COMPLETED" ? "COMPLETED" : undefined,
      });
    },
    [fetchMyOrders, page, statusFilter],
  );

  useEffect(() => {
    setAllOrders([]);
    setPage(1);
    setHasMore(true);
  }, [statusFilter]);

  useEffect(() => {
    load(page);
  }, [page, statusFilter]);

  useEffect(() => {
    if (page === 1) {
      setAllOrders(orders);
    } else {
      setAllOrders((prev) => {
        const ids = new Set(prev.map((o) => o.id));
        return [...prev, ...orders.filter((o) => !ids.has(o.id))];
      });
    }
    setHasMore(page * SIZE < (ordersTotal || 0));
  }, [orders, ordersTotal, page]);

  useEffect(() => {
    const el = sentinelRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && hasMore && !ordersLoading) {
          setPage((p) => p + 1);
        }
      },
      { threshold: 0.1 },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [hasMore, ordersLoading]);

  const handleTouchStart = (e) => {
    if (containerRef.current?.scrollTop === 0) {
      touchStartY.current = e.touches[0].clientY;
    }
  };

  const handleTouchMove = (e) => {
    if (!touchStartY.current) return;
    const delta = e.touches[0].clientY - touchStartY.current;
    if (delta > 0 && containerRef.current?.scrollTop === 0) {
      setPullY(Math.min(delta * 0.45, 64));
    }
  };

  const handleTouchEnd = async () => {
    if (pullY >= 52) {
      setRefreshing(true);
      setAllOrders([]);
      setPage(1);
      await fetchMyOrders({ page: 1, size: SIZE });
      setRefreshing(false);
    }
    setPullY(0);
    touchStartY.current = 0;
  };

  const visibleOrders =
    statusFilter === "ACTIVE"
      ? allOrders.filter((o) => o.status !== "COMPLETED" && o.status !== "CANCELLED")
      : allOrders;

  return (
    <div
      ref={containerRef}
      style={{
        padding: "16px var(--gutter) calc(var(--bottom-tab-h, 70px) + env(safe-area-inset-bottom, 0px) + 24px)",
        overscrollBehavior: "contain",
      }}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {(pullY > 0 || refreshing) && (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            height: pullY || (refreshing ? 52 : 0),
            overflow: "hidden",
            transition: pullY > 0 ? "none" : "height 0.3s var(--ease-out)",
            marginTop: -8,
            marginBottom: 8,
          }}
        >
          <ArrowClockwise
            size={22}
            color="var(--accent)"
            weight="bold"
            style={{
              transform: refreshing ? "rotate(0deg)" : `rotate(${(pullY / 52) * 180}deg)`,
              animation: refreshing ? "spin 0.7s linear infinite" : "none",
              transition: refreshing ? "none" : "transform 0.1s",
            }}
          />
        </div>
      )}

      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
        <Package size={20} weight="fill" color="var(--accent)" />
        <span style={{ fontWeight: 800, fontSize: "1.05rem", color: "var(--text-1)" }}>
          Мои заказы
        </span>
      </div>

      <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 16 }}>
        {STATUS_FILTERS.map(({ key, label }) => (
          <button
            key={key}
            className={`category-chip${statusFilter === key ? " active" : ""}`}
            style={{ fontSize: "0.72rem" }}
            onClick={() => {
              setStatusFilter(key);
            }}
          >
            {label}
          </button>
        ))}
      </div>

      {ordersLoading && visibleOrders.length === 0 ? (
        <div className="loading-center">
          <div className="spinner" />
        </div>
      ) : visibleOrders.length === 0 ? (
        <EmptyState
          title="Заказов пока нет"
          subtitle="Сделайте первый заказ в любом ресторане"
          action={{ label: "Выбрать заведение", onClick: () => navigate("/") }}
        />
      ) : (
        <>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {visibleOrders.map((order) => {
              const cfg = STATUS_CONFIG[order.status] ?? STATUS_CONFIG.PENDING;
              return (
                <div
                  key={order.id}
                  className={s.card}
                  onClick={() => navigate(`/orders/${order.id}`)}
                >
                  <div
                    style={{
                      width: 40,
                      height: 40,
                      borderRadius: "var(--r-sm)",
                      background: "var(--bg-surface)",
                      border: "1px solid var(--border)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: "1.3rem",
                      flexShrink: 0,
                    }}
                  >
                    {getRestaurantEmoji(order.restaurant_id)}
                  </div>

                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 700, fontSize: "0.88rem", color: "var(--text-1)", marginBottom: 3 }}>
                      #{getDisplayId(order)}
                      {order.restaurant_name && (
                        <span style={{ fontWeight: 500, color: "var(--text-3)", marginLeft: 6 }}>
                          {order.restaurant_name}
                        </span>
                      )}
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
                      <span
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          gap: 4,
                          background: cfg.bg,
                          color: cfg.color,
                          borderRadius: 99,
                          padding: "3px 8px",
                          fontSize: "0.68rem",
                          fontWeight: 700,
                          letterSpacing: "0.04em",
                          textTransform: "uppercase",
                        }}
                      >
                        {cfg.icon}
                        {cfg.label}
                      </span>
                      <span style={{ fontSize: "0.72rem", color: "var(--text-3)" }}>
                        {order.items?.length || 0} поз.
                      </span>
                    </div>
                  </div>

                  <div style={{ textAlign: "right", flexShrink: 0 }}>
                    <div style={{ fontWeight: 800, fontSize: "0.95rem", color: "var(--text-1)" }}>
                      {order.total_price} ₽
                    </div>
                    <div style={{ fontSize: "0.7rem", color: "var(--text-3)", marginTop: 2 }}>
                      {formatOrderDate(order.created_at)}
                    </div>
                  </div>

                  <CaretRight size={16} color="var(--text-3)" style={{ flexShrink: 0 }} />
                </div>
              );
            })}
          </div>

          <div ref={sentinelRef} style={{ height: 1, marginTop: 8 }} />

          {ordersLoading && visibleOrders.length > 0 && (
            <div className="loading-center" style={{ minHeight: 56 }}>
              <div className="spinner" />
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default OrdersPage;
