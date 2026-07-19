import { useState, useRef, useCallback } from "react";
import type { CSSProperties, TouchEvent } from "react";
import { useNavigate } from "react-router-dom";
import { PackageIcon, ArrowClockwiseIcon } from "@phosphor-icons/react";
import { EmptyState } from "@shared/components/EmptyState/EmptyState";
import { OrderCard } from "@shared/components/OrderCard/OrderCard";
import { Pagination } from "@shared/components/Pagination/Pagination";
import { useOrdersPageLogic } from "@shared/hooks/useOrdersPageLogic";

interface OrdersPageRoutes {
  orderStatus?: string;
  home?: string;
}

interface StatusFilter {
  key: string;
  label: string;
}

interface OrdersPageProps {
  routes?: OrdersPageRoutes;
  infiniteScroll?: boolean;
  showPagination?: boolean;
  pullToRefresh?: boolean;
  expandableCards?: boolean;
  statusFilters?: StatusFilter[];
  pageClassName?: string | undefined;
  style?: CSSProperties;
}

export const OrdersPage = ({
  routes = {},
  infiniteScroll = false,
  showPagination = true,
  pullToRefresh = false,
  expandableCards = false,
  statusFilters = [
    { key: "ACTIVE", label: "Активные" },
    { key: "DONE",   label: "Завершённые" },
  ],
  pageClassName = "",
  style = {},
}: OrdersPageProps) => {
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
    sentinelRef,
    refresh,
  } = useOrdersPageLogic({ pageSize: 20, infiniteScroll });

  const containerRef = useRef<HTMLDivElement>(null);
  const touchStartY = useRef(0);
  const [pullY, setPullY] = useState(0);
  const [refreshing, setRefreshing] = useState(false);

  const handleRefresh = useCallback(() => {
    setRefreshing(true);
    try {
      refresh();
    } finally {
      setRefreshing(false);
    }
  }, [refresh]);

  const handleTouchStart = (e: TouchEvent<HTMLDivElement>) => {
    const touch = e.touches[0];
    if (touch && containerRef.current?.scrollTop === 0) touchStartY.current = touch.clientY;
  };
  const handleTouchMove = (e: TouchEvent<HTMLDivElement>) => {
    if (!touchStartY.current) return;
    const touch = e.touches[0];
    if (!touch) return;
    const delta = touch.clientY - touchStartY.current;
    if (delta > 0 && containerRef.current?.scrollTop === 0) setPullY(Math.min(delta * 0.45, 64));
  };
  const handleTouchEnd = () => {
    if (pullY >= 52) handleRefresh();
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

  const orderRoute = (id: number): string =>
    routes.orderStatus
      ? routes.orderStatus.replace(":id", String(id))
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
          <ArrowClockwiseIcon
            size={22} color="var(--accent)" weight="bold"
            style={{
              transform: refreshing ? "none" : `rotate(${(pullY / 52) * 180}deg)`,
              animation: refreshing ? "spin 0.7s linear infinite" : "none",
            }}
          />
        </div>
      )}

      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20 }}>
        <PackageIcon size={22} weight="bold" color="var(--accent)" />
        <h1 style={{ fontFamily: "var(--font-sans)", fontSize: "var(--text-xl)", fontWeight: 800, letterSpacing: "-0.03em", margin: 0 }}>
          Мои заказы
        </h1>
      </div>

      <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 16 }}>
        {statusFilters.map(({ key, label }) => (
          <button
            key={key}
            className={`category-chip${statusFilter === key ? " active" : ""}`}
            style={{ fontSize: "var(--text-base)" }}
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
          {...(routes.home ? { action: { label: "Выбрать заведение", onClick: () => { void navigate(routes.home as string); } } } : {})}
        />
      ) : (
        <div className={ordersLoading ? "loading-dim" : undefined}>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {visibleOrders.map((order) => (
              <OrderCard
                key={order.id}
                order={order}
                expandable={expandableCards}
                onClick={() => { void navigate(orderRoute(order.display_id)); }}
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
