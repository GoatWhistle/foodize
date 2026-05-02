import { useState } from "react";
import { completeTelegramAuth } from "../../telegram/init";
import { useAuthStore } from "../../store/useAuthStore";

export default function RegisterPage({ initData, prefillPhone, onSuccess }) {
  const [phone, setPhone] = useState(prefillPhone ?? "");
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const fetchMe = useAuthStore((s) => s.fetchMe);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await completeTelegramAuth(initData, phone, name);
      await fetchMe();
      onSuccess();
    } catch (err) {
      const detail = err.response?.data?.detail;
      setError(
        typeof detail === "string"
          ? detail
          : "Не удалось зарегистрироваться. Проверьте данные.",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "24px 20px",
        background: "var(--bg)",
      }}
    >
      {/* Logo / Brand */}
      <div style={{ marginBottom: 8, textAlign: "center" }}>
        <div
          style={{
            width: 64,
            height: 64,
            borderRadius: "var(--r-lg)",
            background: "var(--fire)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            margin: "0 auto 16px",
            boxShadow: "0 8px 24px var(--fire-glow)",
          }}
        >
          <span style={{ fontSize: 32 }}>🍽️</span>
        </div>
        <h1
          style={{
            fontFamily: "var(--font-sans)",
            fontSize: "1.6rem",
            fontWeight: 800,
            letterSpacing: "-0.03em",
            color: "var(--text-1)",
            margin: 0,
          }}
        >
          Добро пожаловать
        </h1>
        <p
          style={{
            fontSize: "0.9rem",
            color: "var(--text-3)",
            marginTop: 6,
            marginBottom: 32,
          }}
        >
          Введите данные для регистрации
        </p>
      </div>

      <form
        onSubmit={handleSubmit}
        style={{
          width: "100%",
          maxWidth: 360,
          display: "flex",
          flexDirection: "column",
          gap: 14,
        }}
      >
        <div className="form-group">
          <label className="form-label">Номер телефона</label>
          <input
            type="tel"
            value={phone}
            readOnly={!!prefillPhone}
            onChange={(e) => !prefillPhone && setPhone(e.target.value)}
            className="form-input"
            placeholder="+7XXXXXXXXXX"
            required
            style={prefillPhone ? { opacity: 0.6, cursor: "not-allowed" } : {}}
          />
        </div>

        <div className="form-group">
          <label className="form-label">Ваше имя</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="form-input"
            placeholder="Имя"
            required
            minLength={1}
            maxLength={128}
          />
        </div>

        {error && <div className="form-error">{error}</div>}

        <button
          type="submit"
          className="btn btn-primary btn-full"
          disabled={loading}
          style={{ marginTop: 4, borderRadius: "var(--r-md)" }}
        >
          {loading ? "Загрузка..." : "Продолжить"}
        </button>
      </form>
    </div>
  );
}
