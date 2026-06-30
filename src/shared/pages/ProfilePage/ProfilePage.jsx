import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Package,
  Heart,
  SignOut,
  Crown,
  CaretRight,
  CaretDown,
  Check,
  X,
  GearSix,
  FileText,
  Shield,
} from "@phosphor-icons/react";
import ThemeSwitcher from "@shared/components/ThemeSwitcher/ThemeSwitcher.jsx";
import { useProfilePage } from "@shared/hooks/useProfilePage.js";
import { hasPermission, PERMISSIONS } from "@shared/utils/permissions.js";
import s from "./ProfilePage.module.css";

const ProfilePage = ({
  routes = {},
  onLogout,
  BackButton = null,
  avatarUrl = null,
  ordersTotal = 0,
  favoritesCount = 0,
  unreadCount = 0,
  showPasswordChange = true,
  extraMenuItems = [],
  pageClassName = "",
}) => {
  const navigate = useNavigate();
  const [showSettings, setShowSettings] = useState(false);
  const [settingsTab, setSettingsTab] = useState("profile");

  const {
    user,
    logout,
    displayName,
    editMode,
    editForm,
    setEditForm,
    editLoading,
    editError,
    editSuccess,
    startEdit,
    cancelEdit,
    handleSave,
    pwForm,
    setPwForm,
    pwLoading,
    pwError,
    pwSuccess,
    handlePasswordChange,
  } = useProfilePage();

  const isAdmin = hasPermission(user, PERMISSIONS.ADMIN_ACCESS);
  const initial = displayName[0]?.toUpperCase() || "?";

  useEffect(() => {
    if (!BackButton) return;
    BackButton.show();
    const handler = () => navigate(routes.home ?? "/");
    BackButton.onClick(handler);
    return () => { BackButton.offClick(handler); BackButton.hide(); };
  }, [navigate, BackButton, routes.home]);

  const handleLogout = async () => {
    await logout();
    onLogout?.();
  };

  const openSettings = () => {
    if (!showSettings) {
      startEdit();
      setSettingsTab("profile");
    } else {
      cancelEdit();
    }
    setShowSettings((v) => !v);
  };

  const navTo = (path) => path && navigate(path);

  return (
    <div className={`${s.page}${pageClassName ? ` ${pageClassName}` : ""}`}>
      <div className={s.banner} />

      <div style={{ position: "relative" }}>
        <div className={s.avatarWrap}>
          <div className={s.avatar}>
            {avatarUrl ? (
              <img src={avatarUrl} alt={displayName} />
            ) : (
              initial
            )}
          </div>
        </div>
      </div>

      <div className={s.body}>
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 8 }}>
          <div>
            <div className={s.name}>{displayName}</div>
            <div className={s.phone}>{user?.phone_number || "—"}</div>
            {user?.email && (
              <div style={{ fontSize: "0.8rem", color: "var(--text-3)", marginBottom: 10 }}>{user.email}</div>
            )}
          </div>
        </div>

        <div className={s.stats}>
          <div className={s.stat}>
            <Package size={13} color="var(--text-3)" />
            <strong>{ordersTotal}</strong>
            <span>заказов</span>
          </div>
          <span className={s.statSep}>·</span>
          <div className={s.stat}>
            <Heart size={13} color="var(--color-error)" />
            <strong>{favoritesCount}</strong>
            <span>избранных</span>
          </div>
        </div>

        <div className={s.menu}>
          <button className={s.menuItem} onClick={() => navTo(routes.orders)}>
            <span className={s.menuItemLeft}>
              <Package size={20} weight="bold" />
              Мои заказы
            </span>
            <CaretRight size={16} color="var(--text-3)" />
          </button>

          <button className={s.menuItem} onClick={() => navTo(routes.favorites)}>
            <span className={s.menuItemLeft}>
              <Heart size={20} weight="bold" color="#ef4444" />
              Избранное
            </span>
            <CaretRight size={16} color="var(--text-3)" />
          </button>

          {routes.notifications && (
            <button className={s.menuItem} onClick={() => navTo(routes.notifications)}>
              <span className={s.menuItemLeft}>
                <svg width="20" height="20" viewBox="0 0 256 256" fill="currentColor">
                  <path d="M221.8,175.94C216.25,166.38,208,139.33,208,104a80,80,0,1,0-160,0c0,35.34-8.26,62.38-13.81,71.94A16,16,0,0,0,48,200H88.81a40,40,0,0,0,78.38,0H208a16,16,0,0,0,13.8-24.06ZM128,216a24,24,0,0,1-22.63-16h45.26A24,24,0,0,1,128,216Z" />
                </svg>
                Уведомления
              </span>
              <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
                {unreadCount > 0 && (
                  <span className={s.badge}>{unreadCount > 9 ? "9+" : unreadCount}</span>
                )}
                <CaretRight size={16} color="var(--text-3)" />
              </span>
            </button>
          )}

          {isAdmin && routes.admin && (
            <button className={s.menuItem} onClick={() => navTo(routes.admin)}>
              <span className={s.menuItemLeft}>
                <Crown size={20} weight="bold" color="var(--gold, #e8a200)" />
                Админ-панель
              </span>
              <CaretRight size={16} color="var(--text-3)" />
            </button>
          )}

          {isAdmin && !routes.admin && (
            <button className={s.menuItem} onClick={() => window.Telegram?.WebApp?.showAlert?.("Панель администратора доступна только в веб-версии Foodize")}>
              <span className={s.menuItemLeft}>
                <Crown size={20} weight="bold" color="var(--gold, #e8a200)" />
                Панель администратора
              </span>
              <CaretRight size={16} color="var(--text-3)" />
            </button>
          )}

          {extraMenuItems.map((item, i) => (
            <button key={i} className={s.menuItem} onClick={item.onClick}>
              <span className={s.menuItemLeft}>
                {item.icon}
                {item.label}
              </span>
              {item.right ?? <CaretRight size={16} color="var(--text-3)" />}
            </button>
          ))}

          <button className={s.menuItem} onClick={openSettings}>
            <span className={s.menuItemLeft}>
              <GearSix size={20} weight="bold" />
              Настройки
            </span>
            {showSettings ? <CaretDown size={16} color="var(--text-3)" /> : <CaretRight size={16} color="var(--text-3)" />}
          </button>

          {showSettings && (
            <div className={s.expandPanel}>
              <div className={s.tabBar}>
                <button
                  className={`btn btn-sm ${settingsTab === "profile" ? "btn-primary" : "btn-secondary"}`}
                  onClick={() => setSettingsTab("profile")}
                >
                  Данные профиля
                </button>
                {showPasswordChange && (
                  <button
                    className={`btn btn-sm ${settingsTab === "password" ? "btn-primary" : "btn-secondary"}`}
                    onClick={() => setSettingsTab("password")}
                  >
                    Пароль
                  </button>
                )}
              </div>

              {settingsTab === "profile" && (
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  <label style={{ fontSize: "0.78rem", color: "var(--text-3)", fontWeight: 700 }}>Отображаемое имя</label>
                  <input className="form-input" placeholder="Отображаемое имя" value={editForm.name} onChange={(e) => setEditForm((f) => ({ ...f, name: e.target.value }))} />
                  <label style={{ fontSize: "0.78rem", color: "var(--text-3)", fontWeight: 700, marginTop: 4 }}>ФИО</label>
                  <div style={{ display: "flex", gap: 8 }}>
                    <input className="form-input" style={{ flex: 1 }} placeholder="Имя" value={editForm.first_name} onChange={(e) => setEditForm((f) => ({ ...f, first_name: e.target.value }))} />
                    <input className="form-input" style={{ flex: 1 }} placeholder="Фамилия" value={editForm.last_name} onChange={(e) => setEditForm((f) => ({ ...f, last_name: e.target.value }))} />
                  </div>
                  <input className="form-input" placeholder="Отчество" value={editForm.middle_name ?? ""} onChange={(e) => setEditForm((f) => ({ ...f, middle_name: e.target.value }))} />
                  <label style={{ fontSize: "0.78rem", color: "var(--text-3)", fontWeight: 700, marginTop: 4 }}>Email</label>
                  <input className="form-input" type="email" placeholder="Email" value={editForm.email} onChange={(e) => setEditForm((f) => ({ ...f, email: e.target.value }))} />
                  {editError && <div className="form-error" style={{ fontSize: "0.78rem" }}>{editError}</div>}
                  {editSuccess && <div style={{ color: "var(--color-success)", fontSize: "0.78rem", fontWeight: 700 }}>✓ Данные сохранены</div>}
                  <div style={{ display: "flex", gap: 8, marginTop: 4 }}>
                    <button className="btn btn-primary" style={{ flex: 1 }} onClick={handleSave} disabled={editLoading}>
                      {editLoading ? "..." : <><Check size={14} style={{ marginRight: 4 }} />Сохранить</>}
                    </button>
                    <button className="btn btn-secondary" onClick={() => { cancelEdit(); setShowSettings(false); }}>
                      <X size={14} />
                    </button>
                  </div>
                </div>
              )}

              {settingsTab === "password" && showPasswordChange && (
                <form onSubmit={handlePasswordChange} style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  <label style={{ fontSize: "0.78rem", color: "var(--text-3)", fontWeight: 700 }}>Текущий пароль</label>
                  <input className="form-input" type="password" placeholder="Текущий пароль" value={pwForm.old_password} onChange={(e) => setPwForm((f) => ({ ...f, old_password: e.target.value }))} required />
                  <label style={{ fontSize: "0.78rem", color: "var(--text-3)", fontWeight: 700, marginTop: 4 }}>Новый пароль</label>
                  <input className="form-input" type="password" placeholder="Минимум 8 символов" value={pwForm.new_password} onChange={(e) => setPwForm((f) => ({ ...f, new_password: e.target.value }))} minLength={8} required />
                  {pwError && <div className="form-error" style={{ fontSize: "0.78rem" }}>{pwError}</div>}
                  {pwSuccess && <div style={{ color: "var(--color-success)", fontSize: "0.78rem", fontWeight: 700 }}>✓ Пароль изменён</div>}
                  <button className="btn btn-primary" type="submit" disabled={pwLoading} style={{ marginTop: 4 }}>
                    {pwLoading ? "..." : "Сменить пароль"}
                  </button>
                </form>
              )}
            </div>
          )}

          <div style={{ height: 1, background: "var(--border)", margin: "8px 0" }} />
          <ThemeSwitcher />
          <div style={{ height: 1, background: "var(--border)", margin: "8px 0" }} />

          <button className={s.menuItem} onClick={() => navTo(routes.terms ?? "/legal/terms")}>
            <span className={s.menuItemLeft}>
              <FileText size={20} weight="bold" />
              Условия сервиса
            </span>
            <CaretRight size={16} color="var(--text-3)" />
          </button>

          <button className={s.menuItem} onClick={() => navTo(routes.privacy ?? "/legal/privacy")}>
            <span className={s.menuItemLeft}>
              <Shield size={20} weight="bold" />
              Политика конфиденциальности
            </span>
            <CaretRight size={16} color="var(--text-3)" />
          </button>

          <div style={{ height: 1, background: "var(--border)", margin: "8px 0" }} />

          <button className={`${s.menuItem} ${s.danger}`} onClick={handleLogout}>
            <span className={s.menuItemLeft}>
              <SignOut size={20} weight="bold" />
              Выйти
            </span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;
