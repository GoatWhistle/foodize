import { useState, useRef } from "react";
import { TelegramLogo } from "@shared/components/BrandIcons/TelegramLogo";
import { FoodizeLogo } from "@shared/components/FoodizeLogo/FoodizeLogo";
import { authExistingUser, initTelegramApp } from "../../telegram/init";
import {
  getTelegramInitData,
  requestTelegramContact,
} from "../../telegram/sdk";
import { useAuthStore } from "../../store/useAuthStore";
import { translateApiError } from "@shared/utils/translateApiError";
import s from "./AuthPage.module.css";

interface LoginPageProps {
  initData?: string;
  onSuccess: () => void;
}

const sleep = (ms: number): Promise<void> =>
  new Promise((resolve) => setTimeout(resolve, ms));

export function LoginPage({ initData, onSuccess }: LoginPageProps) {
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const fetchMe = useAuthStore((s) => s.fetchMe);
  const cancelledRef = useRef<boolean>(false);

  const getCurrentInitData = (): string =>
    getTelegramInitData() || initData || "";

  const finishTelegramAuth = async (nextInitData: string): Promise<void> => {
    await authExistingUser(nextInitData);
    await fetchMe();
    localStorage.removeItem("foodize_tg_logged_out");
    onSuccess();
  };

  const isCancelled = (): boolean => cancelledRef.current;

  const waitForContactLink = async (): Promise<boolean> => {
    cancelledRef.current = false;
    for (let attempt = 0; attempt < 15; attempt += 1) {
      await sleep(1000);
      if (isCancelled()) return false;
      const result = await initTelegramApp();
      if (isCancelled()) return false;

      if (result.status === "registered") {
        const nextInitData =
          "initData" in result && result.initData
            ? result.initData
            : getCurrentInitData();
        await finishTelegramAuth(nextInitData);
        return true;
      }
    }

    return false;
  };

  const handleTelegramLogin = async (): Promise<void> => {
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
      } catch (err) {
        const authError = err as { response?: { status?: number }; message?: string };
        console.warn(
          "[handleTelegramLogin] finishTelegramAuth failed:",
          authError.response?.status,
          authError.message,
        );
      }

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
    <div className={s['page']}>
      <div className={s['brand']}>
        <div className={s['logo']}>
          <FoodizeLogo size={30} />
        </div>
        <h1 className={s['title']}>Вход через Telegram</h1>
        <p className={s['subtitle']}>
          Нажмите кнопку ниже, чтобы вернуться в аккаунт
        </p>
      </div>

      <div className={s['form']}>
        {error && <div className="form-error">{error}</div>}

        <button
          type="button"
          className={`btn btn-primary btn-full ${s['telegramLogin']}`}
          disabled={loading}
          onClick={() => {
            void handleTelegramLogin();
          }}
          style={{ marginTop: 4, borderRadius: "var(--r-md)" }}
        >
          <TelegramLogo size={20} variant="mono" />
          {loading ? "Входим..." : "Войти через Telegram"}
        </button>
      </div>
    </div>
  );
}
