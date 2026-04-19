import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuthStore } from "../../store/useAuthStore";
import { ROUTES } from "../../constants/routes";
import FoodizeLogo from "../../components/ui/FoodizeLogo";

const AuthVisual = () => (
  <div className="auth-visual">
    <div className="auth-visual-pattern" />
    <div className="auth-visual-content">
      <div className="auth-visual-title">
        Еда,
        <br />
        которую
        <br />
        вы <em>любите</em>
      </div>
      <p className="auth-visual-sub">
        Лучшие заведения города — в одном месте. Быстро, удобно, вкусно.
      </p>
    </div>
  </div>
);

const LoginPage = () => {
  const [phoneNumber, setPhoneNumber] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const login = useAuthStore((s) => s.login);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);
    try {
      await login({ phone_number: phoneNumber, password });
      navigate(ROUTES.HOME);
    } catch (err) {
      setError(err.response?.data?.detail || "Неверный телефон или пароль");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <AuthVisual />

      <div className="auth-form-side">
        <div className="auth-card">
          <div className="auth-logo">
            <FoodizeLogo size={30} />
          </div>

          <h1 className="auth-heading">С возвращением</h1>
          <p className="auth-subheading">Войдите, чтобы сделать заказ</p>

          {error && (
            <div className="form-error" style={{ marginBottom: 20 }}>
              {error}
            </div>
          )}

          <form className="auth-form" onSubmit={handleSubmit} noValidate>
            <div className="form-group">
              <label className="form-label" htmlFor="login-phone">
                Телефон
              </label>
              <input
                id="login-phone"
                className="form-input"
                type="tel"
                placeholder="+7 (999) 000-00-00"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                required
                autoComplete="tel"
                autoFocus
              />
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="login-password">
                Пароль
              </label>
              <input
                id="login-password"
                className="form-input"
                type="password"
                placeholder="Минимум 8 символов"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={8}
                autoComplete="current-password"
              />
            </div>

            <button
              id="login-submit-btn"
              type="submit"
              className="btn btn-primary btn-full"
              disabled={isLoading}
              style={{
                marginTop: 4,
                height: "52px",
                borderRadius: "var(--r-sm)",
              }}
            >
              {isLoading ? (
                <span
                  style={{ display: "flex", alignItems: "center", gap: 10 }}
                >
                  <span className="spinner" style={{ width: 18, height: 18 }} />
                  Вход...
                </span>
              ) : (
                "Войти"
              )}
            </button>
          </form>

          <div className="auth-footer">
            Нет аккаунта? <Link to={ROUTES.REGISTER}>Зарегистрироваться</Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
