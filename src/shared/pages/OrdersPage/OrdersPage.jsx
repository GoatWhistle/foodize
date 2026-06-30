import { useState, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Package, ArrowClockwise } from "@phosphor-icons/react";
import EmptyState from "@shared/components/EmptyState/EmptyState.jsx";
import OrderCard from "@shared/components/OrderCard/OrderCard.jsx";
import Pagination from "@shared/components/Pagination/Pagination.jsx";
import { useOrdersPageLogic } from "@shared/hooks/useOrdersPageLogic.js";

const OrdersPage = ({
  routes = {},
  BackButton = null,
  infiniteScroll = false,
  showPagination = true,
  pullToRefresh = false,
  statusFilters = [
    { key: "ACTIVE", label: "Активные" },
    { key: "DONE",   label: "Завершённые" },
  ],
  pageClassName = "",
  style = {},
}) => {
  const navigate = useNavigate();

  const {
    statusFilter,
    setStatusFilter,
    page,
    setPage,
    visibleOrders,
    ordersLoading,
    ordersError,
    totalPages,
    hasMore,
    sentinelRef,
    refresh,
  } = useOrdersPageLogic({ pageSize: 20, infiniteScroll });

  const containerRef = useRef(null);
  const touchStartY = useRef(0);
  const [pullY, setPullY] = useState(0);
  const [refreshing, setRefreshing] = useState(false);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await refresh();
    } finally {
      setRefreshing(false);
    }
  }, [refresh]);

  const handleTouchStart = (e) => {
    if (containerRef.current?.scrollTop === 0) touchStartY.current = e.touches[0].clientY;
  };
  const handleTouchMove = (e) => {
    if (!touchStartY.current) return;
    const delta = e.touches[0].clientY - touchStartY.current;
    if (delta > 0 && containerRef.current?.scrollTop === 0) setPullY(Math.min(delta * 0.45, 64));
  };
  const handleTouchEnd = async () => {
    if (pullY >= 52) await handleRefresh();
    setPullY(0);
    touchStartY.current = 0;
  };

  const touchHandlers = pullToRefresh
    ? { onTouchStart: handleTouchStart, onTouchMove: handleTouchMove, onTouchEnd: handleTouchEnd }
    : {};

  const emptyTitle = statusFilter === "ACTIVE"
    ? "Активных заказов нет"
    : statusFilter === "DONE"
      ? "Завершённых заказов нет"
      : "Заказов пока нет";

  const emptySubtitle = statusFilter === "ACTIVE"
    ? "Сделайте первый заказ — это займёт меньше минуты"
    : statusFilter === "DONE"
      ? "Здесь появятся выданные и отменённые заказы"
      : "Сделайте первый заказ в любом ресторане";

  const orderRoute = (id) =>
    routes.orderStatus
      ? routes.orderStatus.replace(":id", id)
      : `/orders/${id}`;

  return (
    <div
      ref={containerRef}
      className={pageClassName}
      style={style}
      {...touchHandlers}
    >
      {(pullY > 0 || refreshing) && (
        <div style={{
          display: "flex", alignItems: "center", justifyContent: "center",
          height: refreshing ? 52 : pullY, overflow: "hidden",
          transition: pullY > 0 ? "none" : "height 0.3s var(--ease-out)",
          marginTop: -8, marginBottom: 8,
        }}>
          <ArrowClockwise
            size={22} color="var(--accent)" weight="bold"
            style={{
              transform: refreshing ? "none" : `rotate(${(pullY / 52) * 180}deg)`,
              animation: refreshing ? "spin 0.7s linear infinite" : "none",
            }}
          />
        </div>
      )}

      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20 }}>
        <Package size={22} weight="bold" color="var(--accent, var(--fire))" />
        <h1 style={{ fontFamily: "var(--font-serif)", fontSize: "1.4rem", fontWeight: 700, letterSpacing: "-0.03em", margin: 0 }}>
          Мои заказы
        </h1>
      </div>

      <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 16 }}>
        {statusFilters.map(({ key, label }) => (
          <button
            key={key}
            className={`category-chip${statusFilter === key ? " active" : ""}`}
            style={{ fontSize: "0.8rem" }}
            onClick={() => { setStatusFilter(key); setPage(1); }}
          >
            {label}
          </button>
        ))}
      </div>

      {ordersError && (
        <div className="form-error" style={{ marginBottom: 12 }}>{ordersError}</div>
      )}

      {ordersLoading && visibleOrders.length === 0 ? (
        <div className="loading-center"><div className="spinner" /></div>
      ) : visibleOrders.length === 0 ? (
        <EmptyState
          title={emptyTitle}
          subtitle={emptySubtitle}
          action={routes.home ? { label: "Выбрать заведение", onClick: () => navigate(routes.home) } : undefined}
        />
      ) : (
        <div className={ordersLoading ? "loading-dim" : undefined}>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {visibleOrders.map((order) => (
              <OrderCard
                key={order.id}
                order={order}
                onClick={() => navigate(orderRoute(order.display_id))}
              />
            ))}
          </div>

          {infiniteScroll && (
            <>
              <div ref={sentinelRef} style={{ height: 1, marginTop: 8 }} />
              {ordersLoading && visibleOrders.length > 0 && (
                <div className="loading-center" style={{ minHeight: 56 }}><div className="spinner" /></div>
              )}
            </>
          )}

          {showPagination && !infiniteScroll && (
            <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
          )}
        </div>
      )}
    </div>
  );
};

export default OrdersPage;
