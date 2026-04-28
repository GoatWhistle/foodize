import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { translateApiError } from "../../utils/translateApiError";
import {
  Package,
  Crown,
  Storefront,
  CookingPot,
  Sparkle,
  SignOut,
  CaretRight,
  UserCircle,
  Heart,
  PencilSimple,
  LockKey,
  Check,
  X,
} from "@phosphor-icons/react";
import { useAuthStore } from "../../store/useAuthStore";
import { ROUTES } from "../../constants/routes";
import { vendorService } from "../../services/vendorService";
import { staffService } from "../../services/staffService";
import { userService } from "../../services/userService";

const ProfilePage = () => {
  const { user, logout, fetchMe } = useAuthStore();
  const navigate = useNavigate();

  const [isVendor, setIsVendor] = useState(false);
  const [checkingVendor, setCheckingVendor] = useState(true);
  const [isStaff, setIsStaff] = useState(false);
  const [checkingStaff, setCheckingStaff] = useState(true);
  const [vendorLoading, setVendorLoading] = useState(false);
  const [vendorError, setVendorError] = useState("");

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

  useEffect(() => {
    vendorService
      .getMyProfile()
      .then(() => setIsVendor(true))
      .catch(() => setIsVendor(false))
      .finally(() => setCheckingVendor(false));

    staffService
      .getMyProfile()
      .then(() => setIsStaff(true))
      .catch(() => setIsStaff(false))
      .finally(() => setCheckingStaff(false));
  }, []);

  const handleLogout = async () => {
    await logout();
    navigate(ROUTES.LOGIN);
  };

  const handleBecomeVendor = async () => {
    setVendorLoading(true);
    setVendorError("");
    try {
      await vendorService.createProfile({ description: "" });
      await fetchMe();
      setIsVendor(true);
      navigate(ROUTES.VENDOR_DASHBOARD);
    } catch {
      setVendorError("Не удалось стать вендором");
      setVendorLoading(false);
    }
  };

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

  const handleEditSave = async () => {
    setEditLoading(true);
    setEditError("");
    try {
      await userService.updateMe(editForm);
      await fetchMe();
      setEditMode(false);
    } catch {
      setEditError("Не удалось сохранить изменения");
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
      setPwError(translateApiError(err, "Не удалось сменить пароль"));
    } finally {
      setPwLoading(false);
    }
  };

  return (
    <div className="profile-page page-enter">
      <div className="profile-header" style={{ position: "relative" }}>
        <div className="profile-avatar">
          <UserCircle size={36} weight="bold" color="var(--fire-text)" />
        </div>

        {!editMode ? (
          <div style={{ flex: 1 }}>
            <div className="profile-name">
              {user?.first_name && user?.last_name
                ? `${user.first_name} ${user.last_name}`
                : user?.name || "Пользователь"}
            </div>
            <div className="profile-phone">{user?.phone_number || "—"}</div>
            {user?.email && (
              <div
                style={{
                  fontSize: "0.8rem",
                  color: "var(--text-3)",
                  marginTop: 2,
                }}
              >
                {user.email}
              </div>
            )}
          </div>
        ) : (
          <div
            style={{
              flex: 1,
              display: "flex",
              flexDirection: "column",
              gap: 8,
            }}
          >
            <input
              className="form-input"
              style={{ fontSize: "0.9rem" }}
              placeholder="Отображаемое имя"
              value={editForm.name}
              onChange={(e) =>
                setEditForm((f) => ({ ...f, name: e.target.value }))
              }
            />
            <div style={{ display: "flex", gap: 8 }}>
              <input
                className="form-input"
                style={{ fontSize: "0.9rem", flex: 1 }}
                placeholder="Имя"
                value={editForm.first_name}
                onChange={(e) =>
                  setEditForm((f) => ({ ...f, first_name: e.target.value }))
                }
              />
              <input
                className="form-input"
                style={{ fontSize: "0.9rem", flex: 1 }}
                placeholder="Фамилия"
                value={editForm.last_name}
                onChange={(e) =>
                  setEditForm((f) => ({ ...f, last_name: e.target.value }))
                }
              />
            </div>
            <input
              className="form-input"
              style={{ fontSize: "0.9rem" }}
              placeholder="Email"
              type="email"
              value={editForm.email}
              onChange={(e) =>
                setEditForm((f) => ({ ...f, email: e.target.value }))
              }
            />
            <input
              className="form-input"
              style={{ fontSize: "0.9rem", opacity: 0.6 }}
              placeholder="Телефон"
              value={user?.phone_number || ""}
              readOnly
            />
            {editError && (
              <div className="form-error" style={{ fontSize: "0.78rem" }}>
                {editError}
              </div>
            )}
            <div style={{ display: "flex", gap: 8 }}>
              <button
                className="btn btn-primary btn-sm"
                onClick={handleEditSave}
                disabled={editLoading}
                style={{
                  flex: 1,
                  height: 36,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 6,
                }}
              >
                {editLoading ? (
                  "..."
                ) : (
                  <>
                    <Check size={14} /> Сохранить
                  </>
                )}
              </button>
              <button
                className="btn btn-secondary btn-sm"
                onClick={() => setEditMode(false)}
                style={{
                  height: 36,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <X size={14} />
              </button>
            </div>
          </div>
        )}

        {!editMode && (
          <button
            onClick={startEdit}
            style={{
              position: "absolute",
              top: 0,
              right: 0,
              width: 32,
              height: 32,
              borderRadius: "50%",
              background: "var(--bg-surface)",
              border: "1px solid var(--border)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
              color: "var(--text-3)",
            }}
            aria-label="Редактировать профиль"
          >
            <PencilSimple size={14} weight="bold" />
          </button>
        )}
      </div>

      {vendorError && (
        <div className="form-error" style={{ margin: "12px 0" }}>
          {vendorError}
        </div>
      )}

      <div className="profile-menu">
        {/* Orders */}
        <div
          id="profile-orders-link"
          className="profile-menu-item"
          onClick={() => navigate(ROUTES.ORDERS)}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => e.key === "Enter" && navigate(ROUTES.ORDERS)}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
            <Package size={20} weight="bold" />
            <span>Мои заказы</span>
          </div>
          <CaretRight size={16} color="var(--text-3)" />
        </div>

        {/* Favorites */}
        <div
          id="profile-favorites-link"
          className="profile-menu-item"
          onClick={() => navigate(ROUTES.FAVORITES)}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => e.key === "Enter" && navigate(ROUTES.FAVORITES)}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
            <Heart size={20} weight="bold" color="#ef4444" />
            <span>Избранное</span>
          </div>
          <CaretRight size={16} color="var(--text-3)" />
        </div>

        {/* Admin */}
        {user?.user_role === "ADMIN" && (
          <div
            id="profile-admin-dashboard-link"
            className="profile-menu-item"
            onClick={() => navigate(ROUTES.ADMIN)}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
              <Crown size={20} weight="bold" color="var(--gold, #e8a200)" />
              <span>Админ-панель</span>
            </div>
            <CaretRight size={16} color="var(--text-3)" />
          </div>
        )}

        {/* Staff */}
        {!checkingStaff && isStaff && (
          <div
            id="profile-staff-dashboard-link"
            className="profile-menu-item"
            onClick={() => navigate(ROUTES.STAFF_DASHBOARD)}
            role="button"
            tabIndex={0}
            onKeyDown={(e) =>
              e.key === "Enter" && navigate(ROUTES.STAFF_DASHBOARD)
            }
          >
            <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
              <CookingPot size={20} weight="bold" color="var(--fire)" />
              <span>Кабинет сотрудника</span>
            </div>
            <CaretRight size={16} color="var(--text-3)" />
          </div>
        )}

        {/* Vendor */}
        {!checkingVendor &&
          (isVendor ? (
            <div
              id="profile-vendor-dashboard-link"
              className="profile-menu-item"
              onClick={() => navigate(ROUTES.VENDOR_DASHBOARD)}
            >
              <div
                style={{ display: "flex", alignItems: "center", gap: "14px" }}
              >
                <Storefront size={20} weight="bold" />
                <span>Кабинет вендора</span>
              </div>
              <CaretRight size={16} color="var(--text-3)" />
            </div>
          ) : (
            <div
              id="profile-become-vendor-link"
              className="profile-menu-item"
              onClick={handleBecomeVendor}
              style={{
                pointerEvents: vendorLoading ? "none" : "auto",
                opacity: vendorLoading ? 0.6 : 1,
              }}
            >
              <div
                style={{ display: "flex", alignItems: "center", gap: "14px" }}
              >
                <Sparkle size={20} weight="bold" color="var(--fire)" />
                <span>{vendorLoading ? "Загрузка..." : "Стать вендором"}</span>
              </div>
              <CaretRight size={16} color="var(--text-3)" />
            </div>
          ))}

        {/* Change password */}
        <div
          className="profile-menu-item"
          onClick={() => {
            setShowPassword((p) => !p);
            setPwError("");
            setPwSuccess(false);
          }}
          role="button"
          tabIndex={0}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
            <LockKey size={20} weight="bold" />
            <span>Сменить пароль</span>
          </div>
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
              onChange={(e) =>
                setPwForm((f) => ({ ...f, old_password: e.target.value }))
              }
              required
            />
            <input
              className="form-input"
              type="password"
              placeholder="Новый пароль (мин. 8 символов)"
              value={pwForm.new_password}
              onChange={(e) =>
                setPwForm((f) => ({ ...f, new_password: e.target.value }))
              }
              minLength={8}
              required
            />
            {pwError && (
              <div className="form-error" style={{ fontSize: "0.78rem" }}>
                {pwError}
              </div>
            )}
            {pwSuccess && (
              <div
                style={{
                  color: "#22c55e",
                  fontSize: "0.78rem",
                  fontWeight: 700,
                }}
              >
                ✓ Пароль изменён
              </div>
            )}
            <button
              className="btn btn-primary btn-sm"
              type="submit"
              disabled={pwLoading}
            >
              {pwLoading ? "..." : "Сохранить пароль"}
            </button>
          </form>
        )}

        <div className="divider" style={{ margin: "8px 0" }} />

        <div
          id="profile-logout-btn"
          className="profile-menu-item danger"
          onClick={handleLogout}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => e.key === "Enter" && handleLogout()}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
            <SignOut size={20} weight="bold" />
            <span>Выйти</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;
