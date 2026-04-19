import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuthStore } from "../../store/useAuthStore";
import { ROUTES } from "../../constants/routes";
import FoodizeLogo from "../../components/ui/FoodizeLogo";

const ROLES = [
  { value: "CUSTOMER", label: "Покупатель", icon: "🙋", desc: "Заказываю еду" },
  { value: "VENDOR", label: "Вендор", icon: "🏪", desc: "У меня заведение" },
];

const RegisterPage = () => {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("CUSTOMER");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const { register, login } = useAuthStore();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);
    try {
      await register({
        name,
        phone_number: phone,
        password,
        user_role: role,
      });
      await login({ phone_number: phone, password });
      navigate(ROUTES.HOME);
    } catch (err) {
      setError(err.response?.data?.detail || "Ошибка при регистрации");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-logo">
          <FoodizeLogo size={32} />
        </div>

        <h1 className="auth-heading">Создать аккаунт</h1>
        <p className="auth-subheading">Быстро и без лишних шагов</p>

        {error && (
          <div className="form-error" style={{ marginBottom: 16 }}>
            {error}
          </div>
        )}

        <form className="auth-form" onSubmit={handleSubmit} noValidate>
          <div className="form-group">
            <label className="form-label">Я — </label>
            <div className="role-select">
              {ROLES.map((r) => (
                <div
                  key={r.value}
                  className={`role-option${role === r.value ? " selected" : ""}`}
                  onClick={() => setRole(r.value)}
                  role="radio"
                  aria-checked={role === r.value}
                  tabIndex={0}
                  onKeyDown={(e) => e.key === "Enter" && setRole(r.value)}
                  id={`role-${r.value.toLowerCase()}`}
                >
                  <div className="role-icon">{r.icon}</div>
                  <div style={{ fontWeight: 700 }}>{r.label}</div>
                  <div
                    style={{ fontSize: "0.72rem", marginTop: 2, opacity: 0.7 }}
                  >
                    {r.desc}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="reg-name">
              Имя
            </label>
            <input
              id="reg-name"
              className="form-input"
              type="text"
              placeholder="Ваше имя"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              autoFocus
              autoComplete="name"
            />
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="reg-phone">
              Телефон
            </label>
            <input
              id="reg-phone"
              className="form-input"
              type="tel"
              placeholder="+7 (999) 000-00-00"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              required
              autoComplete="tel"
            />
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="reg-password">
              Пароль
            </label>
            <input
              id="reg-password"
              className="form-input"
              type="password"
              placeholder="Минимум 8 символов"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={8}
              autoComplete="new-password"
            />
          </div>

          <button
            id="register-submit-btn"
            type="submit"
            className="btn btn-primary btn-full"
            disabled={isLoading}
            style={{ marginTop: 4 }}
          >
            {isLoading ? (
              <span style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <span className="spinner" style={{ width: 18, height: 18 }} />
                Создаём аккаунт...
              </span>
            ) : (
              "Создать аккаунт"
            )}
          </button>
        </form>

        <div className="auth-footer">
          Уже есть аккаунт? <Link to={ROUTES.LOGIN}>Войти</Link>
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;
