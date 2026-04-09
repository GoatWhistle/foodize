import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuthStore } from "../../store/useAuthStore";
import { ROUTES } from "../../constants/routes";

const LoginPage = () => {
  const [phoneNumber, setPhoneNumber] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const login = useAuthStore((state) => state.login);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      await login({ phone_number: phoneNumber, password });
      navigate(ROUTES.HOME);
    } catch (err) {
      setError(
        err.response?.data?.detail || "Ошибка при входе. Проверьте данные.",
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card glass-panel">
        <h2 className="auth-title">Вход в Foodize</h2>
        <p className="auth-subtitle">
          С возвращением! Пожалуйста, введите ваши данные.
        </p>

        {error && <div className="auth-error">{error}</div>}

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="input-group">
            <label htmlFor="phone">Номер телефона</label>
            <input
              id="phone"
              type="text"
              placeholder="+7 (999) 000-00-00"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
              required
            />
          </div>

          <div className="input-group">
            <label htmlFor="password">Пароль</label>
            <input
              id="password"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={8}
            />
          </div>

          <button
            type="submit"
            className={`auth-submit-btn ${isLoading ? "loading" : ""}`}
            disabled={isLoading}
          >
            {isLoading ? "Загрузка..." : "Войти"}
          </button>
        </form>

        <div className="auth-footer">
          У вас ещё нет аккаунта?{" "}
          <a href={ROUTES.REGISTER}>Зарегистрироваться</a>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
