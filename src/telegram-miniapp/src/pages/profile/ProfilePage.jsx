import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import ThemeSwitcher from "@shared/components/ThemeSwitcher/ThemeSwitcher";
import {
  Package,
  Heart,
  SignOut,
  PencilSimple,
  Crown,
  LockKey,
  CaretRight,
  Check,
  X,
  UserCircle,
  Bell,
  FileText,
  Shield,
} from "@phosphor-icons/react";
import { useAuthStore } from "../../store/useAuthStore";
import { useNotificationStore } from "../../store/useNotificationStore";
import { useOrderStore } from "../../store/useOrderStore";
import { useFavoriteStore } from "../../store/useFavoriteStore";
import { hasPermission, PERMISSIONS } from "../../utils/permissions";
import { useShallow } from "zustand/react/shallow";
import { BackButton } from "../../telegram/sdk";
import { userService } from "../../services/userService";
import s from "./ProfilePage.module.css";

const isTelegramUser = () => {
  try {
    const initData = sessionStorage.getItem("tg_init_data") || "";
    return initData.length > 0 || !!window.Telegram?.WebApp?.initData;
  } catch {
    return false;
  }
};

const ProfilePage = () => {
  const navigate = useNavigate();
  const unreadCount = useNotificationStore((s) => s.unreadCount);
  const { user, logout, fetchMe } = useAuthStore(
    useShallow((s) => ({
      user: s.user,
      logout: s.logout,
      fetchMe: s.fetchMe,
    })),
  );
  const ordersTotal = useOrderStore((s) => s.ordersTotal);
  const favoriteIds = useFavoriteStore((s) => s.favoriteIds);

  const [editMode, setEditMode] = useState(false);
  const [editForm, setEditForm] = useState({
    name: "",
    first_name: "",
    last_name: "",
    email: "",
  });
  const [editLoading, setEditLoading] = useState(false);
  const [editError, setEditError] = useState("");

  const [showPassword, setShowPassword] = useState(false);
  const [pwForm, setPwForm] = useState({ old_password: "", new_password: "" });
  const [pwLoading, setPwLoading] = useState(false);
  const [pwError, setPwError] = useState("");
  const [pwSuccess, setPwSuccess] = useState(false);

  const tgUser = window.Telegram?.WebApp?.initDataUnsafe?.user;
  const hasTelegramSession = isTelegramUser();

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

  const startEdit = () => {
    setEditForm({
      name: user?.name ?? "",
      first_name: user?.first_name ?? "",
      last_name: user?.last_name ?? "",
      email: user?.email ?? "",
    });
    setEditMode(true);
    setEditError("");
  };

  const handleSave = async () => {
    setEditLoading(true);
    setEditError("");
    try {
      await userService.updateMe(editForm);
      await fetchMe();
      setEditMode(false);
      window.Telegram?.WebApp?.showAlert?.("Профиль сохранён");
    } catch {
      setEditError("Не удалось сохранить");
    } finally {
      setEditLoading(false);
    }
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    setPwLoading(true);
    setPwError("");
    setPwSuccess(false);
    try {
      await userService.changePassword(pwForm);
      setPwSuccess(true);
      setPwForm({ old_password: "", new_password: "" });
    } catch (err) {
      const detail = err.response?.data?.detail;
      setPwError(
        typeof detail === "string" ? detail : "Не удалось сменить пароль",
      );
    } finally {
      setPwLoading(false);
    }
  };

  const handleLogout = async () => {
    await logout();
    window.location.assign("/");
  };

  const displayName =
    user?.first_name && user?.last_name
      ? `${user.first_name} ${user.last_name}`
      : user?.name || "Пользователь";

  const avatarPhoto = tgUser?.photo_url || null;
  const initial = displayName[0]?.toUpperCase() || "?";

  return (
    <div className={s.page}>
      <div className={s.banner} />

      <div className={s.avatarWrap}>
        <div className={s.avatar}>
          {editMode ? (
            <UserCircle size={32} weight="bold" color="white" />
          ) : avatarPhoto ? (
            <img src={avatarPhoto} alt={displayName} />
          ) : (
            initial
          )}
        </div>
      </div>

      <div className={s.body}>
        {!editMode ? (
          <>
            <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 8 }}>
              <div>
                <div className={s.name}>{displayName}</div>
                <div className={s.phone}>{user?.phone_number || "—"}</div>
              </div>
              <button
                onClick={startEdit}
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: "50%",
                  background: "var(--bg-surface)",
                  border: "1px solid var(--border-mid)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  cursor: "pointer",
                  flexShrink: 0,
                  marginTop: 2,
                }}
                aria-label="Редактировать"
              >
                <PencilSimple size={14} color="var(--text-2)" />
              </button>
            </div>

            <div className={s.stats}>
              <div className={s.stat}>
                <Package size={13} color="var(--ink-2)" />
                <strong>{ordersTotal || 0}</strong>
                <span>заказов</span>
              </div>
              <span className={s.statSep}>·</span>
              <div className={s.stat}>
                <Heart size={13} color="var(--color-error)" />
                <strong>{favoriteIds.size || 0}</strong>
                <span>избранных</span>
              </div>
            </div>
          </>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 20 }}>
            <input
              className="form-input"
              placeholder="Отображаемое имя"
              value={editForm.name}
              onChange={(e) => setEditForm((f) => ({ ...f, name: e.target.value }))}
              style={{ fontSize: "0.88rem" }}
            />
            <div style={{ display: "flex", gap: 6 }}>
              <input
                className="form-input"
                placeholder="Имя"
                value={editForm.first_name}
                onChange={(e) => setEditForm((f) => ({ ...f, first_name: e.target.value }))}
                style={{ flex: 1, fontSize: "0.88rem" }}
              />
              <input
                className="form-input"
                placeholder="Фамилия"
                value={editForm.last_name}
                onChange={(e) => setEditForm((f) => ({ ...f, last_name: e.target.value }))}
                style={{ flex: 1, fontSize: "0.88rem" }}
              />
            </div>
            <input
              className="form-input"
              placeholder="Email"
              type="email"
              value={editForm.email}
              onChange={(e) => setEditForm((f) => ({ ...f, email: e.target.value }))}
              style={{ fontSize: "0.88rem" }}
            />
            <input
              className="form-input"
              value={user?.phone_number || ""}
              readOnly
              style={{ fontSize: "0.88rem", opacity: 0.55 }}
            />
            {editError && (
              <div className="form-error" style={{ fontSize: "0.78rem" }}>
                {editError}
              </div>
            )}
            <div style={{ display: "flex", gap: 8 }}>
              <button
                className="btn btn-primary btn-sm"
                onClick={handleSave}
                disabled={editLoading}
                style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 5 }}
              >
                {editLoading ? "..." : <><Check size={14} /> Сохранить</>}
              </button>
              <button
                className="btn btn-secondary btn-sm"
                onClick={() => setEditMode(false)}
                style={{ display: "flex", alignItems: "center", justifyContent: "center" }}
              >
                <X size={14} />
              </button>
            </div>
          </div>
        )}

        <div className={s.menu}>
          <div className={s.menuItem} onClick={() => navigate("/orders")}>
            <Package size={18} />
            <span style={{ flex: 1 }}>Мои заказы</span>
            <CaretRight size={16} color="var(--text-3)" />
          </div>

          <div className={s.menuItem} onClick={() => navigate("/favorites")}>
            <Heart size={18} color="var(--color-error)" />
            <span style={{ flex: 1 }}>Избранное</span>
            <CaretRight size={16} color="var(--text-3)" />
          </div>

          <div className={s.menuItem} onClick={() => navigate("/notifications")}>
            <Bell size={18} />
            <span style={{ flex: 1 }}>Уведомления</span>
            {unreadCount > 0 && (
              <span
                style={{
                  background: "var(--ink-1)",
                  color: "var(--ink-inv)",
                  borderRadius: 99,
                  fontSize: 11,
                  fontWeight: 700,
                  padding: "1px 7px",
                  marginRight: 4,
                }}
              >
                {unreadCount > 9 ? "9+" : unreadCount}
              </span>
            )}
            <CaretRight size={16} color="var(--text-3)" />
          </div>

          {hasPermission(user, PERMISSIONS.ADMIN_ACCESS) && (
            <div
              className={s.menuItem}
              onClick={() =>
                window.Telegram?.WebApp?.showAlert(
                  "Панель администратора доступна только в веб-версии Foodize",
                )
              }
            >
              <Crown size={18} color="var(--saffron, #e8b84b)" />
              <span style={{ flex: 1 }}>Панель администратора</span>
              <CaretRight size={16} color="var(--text-3)" />
            </div>
          )}

          {!hasTelegramSession && (
            <>
              <div
                className={s.menuItem}
                onClick={() => {
                  setShowPassword((p) => !p);
                  setPwError("");
                  setPwSuccess(false);
                }}
              >
                <LockKey size={18} />
                <span style={{ flex: 1 }}>Сменить пароль</span>
                <CaretRight
                  size={16}
                  color="var(--text-3)"
                  style={{
                    transform: showPassword ? "rotate(90deg)" : "none",
                    transition: "transform 200ms",
                  }}
                />
              </div>

              {showPassword && (
                <form
                  onSubmit={handlePasswordChange}
                  style={{
                    padding: "4px 16px 16px",
                    display: "flex",
                    flexDirection: "column",
                    gap: 8,
                    borderBottom: "1px solid var(--border)",
                  }}
                >
                  <input
                    className="form-input"
                    type="password"
                    placeholder="Текущий пароль"
                    value={pwForm.old_password}
                    onChange={(e) => setPwForm((f) => ({ ...f, old_password: e.target.value }))}
                    required
                  />
                  <input
                    className="form-input"
                    type="password"
                    placeholder="Новый пароль (мин. 8 символов)"
                    value={pwForm.new_password}
                    onChange={(e) => setPwForm((f) => ({ ...f, new_password: e.target.value }))}
                    minLength={8}
                    required
                  />
                  {pwError && (
                    <div className="form-error" style={{ fontSize: "0.78rem" }}>
                      {pwError}
                    </div>
                  )}
                  {pwSuccess && (
                    <div style={{ color: "var(--color-success)", fontSize: "0.78rem", fontWeight: 700 }}>
                      Пароль изменён
                    </div>
                  )}
                  <button className="btn btn-primary btn-sm" type="submit" disabled={pwLoading}>
                    {pwLoading ? "..." : "Сохранить пароль"}
                  </button>
                </form>
              )}
            </>
          )}

          <div className="divider" style={{ margin: "8px 0" }} />

          <ThemeSwitcher />

          <div className="divider" style={{ margin: "8px 0" }} />

          <div className={s.menuItem} onClick={() => navigate("/legal/terms")}>
            <FileText size={18} />
            <span style={{ flex: 1 }}>Условия сервиса</span>
            <CaretRight size={16} color="var(--text-3)" />
          </div>

          <div className={s.menuItem} onClick={() => navigate("/legal/privacy")}>
            <Shield size={18} />
            <span style={{ flex: 1 }}>Политика конфиденциальности</span>
            <CaretRight size={16} color="var(--text-3)" />
          </div>

          <div className="divider" style={{ margin: "8px 0" }} />

          <div className={`${s.menuItem} ${s.danger}`} onClick={handleLogout}>
            <SignOut size={18} />
            <span style={{ flex: 1 }}>Выйти</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;
