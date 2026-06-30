import { useState, useRef } from "react";
import { TelegramLogo } from "@phosphor-icons/react";
import { authExistingUser, initTelegramApp } from "../../telegram/init";
import {
  getTelegramInitData,
  requestTelegramContact,
} from "../../telegram/sdk";
import { useAuthStore } from "../../store/useAuthStore";
import { translateApiError } from "../../utils/translateApiError";
import s from "./AuthPage.module.css";

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

export default function LoginPage({ initData, onSuccess }) {
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const fetchMe = useAuthStore((s) => s.fetchMe);
  const cancelledRef = useRef(false);

  const getCurrentInitData = () => getTelegramInitData() || initData || "";

  const finishTelegramAuth = async (nextInitData) => {
    await authExistingUser(nextInitData);
    await fetchMe();
    localStorage.removeItem("foodize_tg_logged_out");
    onSuccess();
  };

  const waitForContactLink = async () => {
    cancelledRef.current = false;
    for (let attempt = 0; attempt < 15; attempt += 1) {
      await sleep(1000);
      if (cancelledRef.current) return false;
      const result = await initTelegramApp();
      if (cancelledRef.current) return false;

      if (result.status === "registered") {
        await finishTelegramAuth(result.initData ?? getCurrentInitData());
        return true;
      }
    }

    return false;
  };

  const handleTelegramLogin = async () => {
    const currentInitData = getCurrentInitData();

    if (!currentInitData) {
      setError(
        "Telegram не передал данные для входа. Закройте миниапку и откройте её заново из Telegram.",
      );
      return;
    }

    setError("");
    setLoading(true);
    try {
      try {
        await finishTelegramAuth(currentInitData);
        return;
      } catch {}

      const granted = await requestTelegramContact();
      if (!granted) {
        setError("Чтобы войти через Telegram, поделитесь номером телефона.");
        return;
      }

      const linked = await waitForContactLink();
      if (!linked) {
        setError(
          "Номер отправлен, но Telegram ещё не успел привязать аккаунт. Нажмите кнопку ещё раз через пару секунд.",
        );
      }
    } catch (err) {
      setError(
        translateApiError(
          err,
          "Telegram не смог выполнить вход. Откройте миниапку из Telegram и попробуйте снова.",
        ),
      );
    } finally {
      setLoading(false);
      cancelledRef.current = true;
    }
  };

  return (
    <div className={s.page}>
      <div className={s.brand}>
        <div className={s.logo}>
          <span>🍽️</span>
        </div>
        <h1 className={s.title}>Вход через Telegram</h1>
        <p className={s.subtitle}>
          Нажмите кнопку ниже, чтобы вернуться в аккаунт
        </p>
      </div>

      <div className={s.form}>
        {error && <div className="form-error">{error}</div>}

        <button
          type="button"
          className={`btn btn-primary btn-full ${s.telegramLogin}`}
          disabled={loading}
          onClick={handleTelegramLogin}
          style={{ marginTop: 4, borderRadius: "var(--r-md)" }}
        >
          <TelegramLogo size={20} weight="fill" />
          {loading ? "Входим..." : "Войти через Telegram"}
        </button>
      </div>
    </div>
  );
}
