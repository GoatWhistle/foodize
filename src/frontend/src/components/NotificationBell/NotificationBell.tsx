import { useState, useEffect, useRef } from "react";
import { Bell, Trash } from "@phosphor-icons/react";
import type { Notification } from "@shared/types/models";
import { useNotificationStore } from "../../store/useNotificationStore";
import { useAuthStore } from "../../store/useAuthStore";
import { useShallow } from "zustand/react/shallow";

interface NotificationGroup {
  label: string;
  items: Notification[];
}

const MS_PER_DAY = 24 * 60 * 60 * 1000;

const getDateStart = (date: Date): Date =>
  new Date(date.getFullYear(), date.getMonth(), date.getDate());

const getDayLabel = (value: string | null | undefined): string => {
  if (!value) return "Недавно";
  const date = new Date(value);
  if (isNaN(date.getTime())) return "Недавно";
  const today = getDateStart(new Date());
  const day = getDateStart(date);
  const diff = Math.round((today.getTime() - day.getTime()) / MS_PER_DAY);
  if (diff <= 0) return "Сегодня";
  if (diff === 1) return "Вчера";
  if (diff < 5) return `${diff} дня назад`;
  return `${diff} дней назад`;
};

const groupByDay = (items: Notification[]): NotificationGroup[] => {
  const sorted = [...items].sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  );
  return sorted.reduce<NotificationGroup[]>((groups, n) => {
    const label = getDayLabel(n.created_at);
    const last = groups[groups.length - 1];
    if (last?.label === label) last.items.push(n);
    else groups.push({ label, items: [n] });
    return groups;
  }, []);
};

const NotificationBell = () => {
  const { user, isAuthenticated } = useAuthStore(
    useShallow((s) => ({ user: s.user, isAuthenticated: s.isAuthenticated }))
  );
  const {
    notifications, unreadCount, total,
    fetchNotifications, loadMore, markAsRead, markAllAsRead,
    deleteNotification, deleteAll, connectWs, disconnectWs,
  } = useNotificationStore();

  const [isOpen, setIsOpen] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isAuthenticated || !user?.id) return;
    void fetchNotifications(1);
    connectWs(user.id);
    return () => disconnectWs();
  }, [isAuthenticated, user?.id, fetchNotifications, connectWs, disconnectWs]);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) setIsOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const handleLoadMore = async () => {
    if (loadingMore) return;
    setLoadingMore(true);
    try { await loadMore(); } finally { setLoadingMore(false); }
  };

  if (!isAuthenticated) return null;

  const groups = groupByDay(notifications);
  const hasMore = notifications.length < total;

  return (
    <div style={{ position: "relative" }} ref={dropdownRef}>
      <button
        style={{ background: "none", border: "none", cursor: "pointer", position: "relative", padding: 8, color: "var(--text-1)", display: "flex", alignItems: "center", justifyContent: "center" }}
        onClick={() => setIsOpen((v) => !v)}
        aria-label="Уведомления"
      >
        <Bell size={20} weight={unreadCount > 0 ? "fill" : "bold"} />
        {unreadCount > 0 && (
          <span style={{ position: "absolute", top: 4, right: 4, background: "var(--fire)", color: "var(--fire-text)", fontSize: "var(--text-xs)", fontWeight: "var(--weight-display)", padding: "2px 5px", borderRadius: 10, lineHeight: 1 }}>
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div style={{ position: "absolute", top: "100%", right: 0, width: 320, maxHeight: 400, background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: "var(--r-md)", boxShadow: "var(--shadow-md)", zIndex: 100, display: "flex", flexDirection: "column", overflow: "hidden", marginTop: 8 }}>
          <div style={{ padding: "12px 16px", borderBottom: "1px solid var(--border)", display: "flex", justifyContent: "space-between", alignItems: "center", background: "var(--bg-surface)" }}>
            <span style={{ fontWeight: 800, fontSize: "0.95rem", color: "var(--text-1)" }}>Уведомления</span>
            {notifications.length > 0 && (
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                {unreadCount > 0 && (
                  <button onClick={() => { void markAllAsRead(); }} style={{ background: "none", border: "none", color: "var(--brand)", fontSize: "0.8rem", fontWeight: 700, cursor: "pointer", padding: 0 }}>
                    Прочитать все
                  </button>
                )}
                <button onClick={() => { void deleteAll(); }} aria-label="Удалить все" style={{ width: 28, height: 28, borderRadius: "var(--r-xs)", border: "1px solid var(--border)", background: "var(--bg-card)", color: "var(--text-3)", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}>
                  <Trash size={14} weight="bold" />
                </button>
              </div>
            )}
          </div>

          <div style={{ overflowY: "auto", flex: 1 }}>
            {notifications.length === 0 ? (
              <div style={{ padding: "32px 16px", textAlign: "center", color: "var(--text-3)", fontSize: "0.875rem" }}>
                Нет уведомлений
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column" }}>
                {groups.map((group) => (
                  <div key={group.label}>
                    <div style={{ padding: "10px 16px 6px", color: "var(--text-3)", fontSize: "0.72rem", fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.04em", background: "var(--bg-surface)", borderBottom: "1px solid var(--border)" }}>
                      {group.label}
                    </div>
                    {group.items.map((n) => (
                      <div
                        key={n.id}
                        onClick={() => { if (!n.is_read) void markAsRead(n.id); }}
                        style={{ padding: "12px 16px", borderBottom: "1px solid var(--border)", background: n.is_read ? "transparent" : "var(--brand-alpha)", cursor: n.is_read ? "default" : "pointer", transition: "background 0.2s" }}
                      >
                        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4, gap: 8 }}>
                          <strong style={{ fontSize: "0.875rem", color: "var(--text-1)", lineHeight: 1.2 }}>{n.title}</strong>
                          <div style={{ display: "flex", alignItems: "center", gap: 6, flexShrink: 0 }}>
                            <span style={{ fontSize: "0.7rem", color: "var(--text-3)", whiteSpace: "nowrap" }}>
                              {n.created_at ? new Date(n.created_at).toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit" }) : ""}
                            </span>
                            <button
                              onClick={(e) => { e.stopPropagation(); void deleteNotification(n.id); }}
                              aria-label="Удалить"
                              style={{ width: 24, height: 24, borderRadius: "var(--r-xs)", border: "1px solid var(--border)", background: "var(--bg-surface)", color: "var(--text-3)", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}
                            >
                              <Trash size={12} weight="bold" />
                            </button>
                          </div>
                        </div>
                        <p style={{ margin: 0, fontSize: "0.8rem", color: "var(--text-2)", lineHeight: 1.4 }}>{n.message}</p>
                      </div>
                    ))}
                  </div>
                ))}
                {hasMore && (
                  <button onClick={() => { void handleLoadMore(); }} disabled={loadingMore} style={{ width: "100%", padding: "10px 16px", background: "none", border: "none", borderTop: "1px solid var(--border)", color: "var(--brand)", fontSize: "0.8rem", fontWeight: 700, cursor: loadingMore ? "default" : "pointer", opacity: loadingMore ? 0.6 : 1 }}>
                    {loadingMore ? "Загрузка..." : "Загрузить ещё"}
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationBell;
