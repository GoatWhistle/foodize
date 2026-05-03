import { useState, useEffect, useRef } from "react";
import { Bell } from "@phosphor-icons/react";
import { notificationService } from "../../services/notificationService";
import { createNotificationWebSocket } from "../../services/api";
import { useAuthStore } from "../../store/useAuthStore";
import { useShallow } from "zustand/react/shallow";

const NotificationBell = () => {
  const { user, isAuthenticated } = useAuthStore(
    useShallow((s) => ({ user: s.user, isAuthenticated: s.isAuthenticated }))
  );
  
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);
  const wsRef = useRef(null);

  useEffect(() => {
    if (!isAuthenticated || !user?.id) return;
    
    // Fetch initial notifications
    notificationService.getNotifications({ page: 1, size: 20 })
      .then(res => {
        setNotifications(res.data.items || []);
        setUnreadCount(res.data.unread_count || 0);
      })
      .catch(() => {});

    // Open WebSocket
    wsRef.current = createNotificationWebSocket(user.id, (msg) => {
      // msg is the NotificationResponse
      setNotifications(prev => [msg, ...prev]);
      setUnreadCount(c => c + 1);
    });

    return () => {
      if (wsRef.current) wsRef.current.close();
    };
  }, [isAuthenticated, user?.id]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleMarkAsRead = async (id, e) => {
    if (e) e.stopPropagation();
    try {
      await notificationService.markAsRead(id);
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
      setUnreadCount(c => Math.max(0, c - 1));
    } catch {}
  };

  const handleMarkAllAsRead = async () => {
    try {
      await notificationService.markAllAsRead();
      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
      setUnreadCount(0);
    } catch {}
  };

  if (!isAuthenticated) return null;

  return (
    <div style={{ position: "relative" }} ref={dropdownRef}>
      <button
        style={{
          background: "none",
          border: "none",
          cursor: "pointer",
          position: "relative",
          padding: 8,
          color: "var(--text-1)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
        onClick={() => setIsOpen(!isOpen)}
        aria-label="Уведомления"
      >
        <Bell size={20} weight={unreadCount > 0 ? "fill" : "bold"} />
        {unreadCount > 0 && (
          <span
            style={{
              position: "absolute",
              top: 4,
              right: 4,
              background: "var(--fire)",
              color: "var(--fire-text)",
              fontSize: "var(--text-xs)",
              fontWeight: "var(--weight-display)",
              padding: "2px 5px",
              borderRadius: "10px",
              lineHeight: 1,
            }}
          >
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div
          style={{
            position: "absolute",
            top: "100%",
            right: 0,
            width: 320,
            maxHeight: 400,
            background: "var(--bg-card)",
            border: "1px solid var(--border)",
            borderRadius: "var(--r-md)",
            boxShadow: "var(--shadow-md)",
            zIndex: 100,
            display: "flex",
            flexDirection: "column",
            overflow: "hidden",
            marginTop: 8,
          }}
        >
          <div
            style={{
              padding: "12px 16px",
              borderBottom: "1px solid var(--border)",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              background: "var(--bg-surface)",
            }}
          >
            <span style={{ fontWeight: 800, fontSize: "0.95rem", color: "var(--text-1)" }}>
              Уведомления
            </span>
            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllAsRead}
                style={{
                  background: "none",
                  border: "none",
                  color: "var(--brand)",
                  fontSize: "0.8rem",
                  fontWeight: 700,
                  cursor: "pointer",
                  padding: 0,
                }}
              >
                Прочитать все
              </button>
            )}
          </div>

          <div style={{ overflowY: "auto", flex: 1 }}>
            {notifications.length === 0 ? (
              <div style={{ padding: "32px 16px", textAlign: "center", color: "var(--text-3)", fontSize: "0.875rem" }}>
                Нет уведомлений
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column" }}>
                {notifications.map(n => (
                  <div
                    key={n.id}
                    onClick={(e) => !n.is_read && handleMarkAsRead(n.id, e)}
                    style={{
                      padding: "12px 16px",
                      borderBottom: "1px solid var(--border)",
                      background: n.is_read ? "transparent" : "var(--brand-alpha)",
                      cursor: n.is_read ? "default" : "pointer",
                      transition: "background 0.2s",
                    }}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4, gap: 8 }}>
                      <strong style={{ fontSize: "0.875rem", color: "var(--text-1)", lineHeight: 1.2 }}>
                        {n.title}
                      </strong>
                      <span style={{ fontSize: "0.7rem", color: "var(--text-3)", whiteSpace: "nowrap" }}>
                        {new Date(n.created_at).toLocaleTimeString("ru-RU", { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    <p style={{ margin: 0, fontSize: "0.8rem", color: "var(--text-2)", lineHeight: 1.4 }}>
                      {n.message}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationBell;
