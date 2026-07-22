import { useRouteError, useNavigate } from "react-router-dom";
import { useTranslation } from "@shared/i18n/useTranslation";

interface RouteError {
  status?: number;
  statusText?: string;
  message?: string;
}

export const RouteErrorPage = () => {
  const { t } = useTranslation();
  const error = useRouteError() as RouteError | null;
  const navigate = useNavigate();

  const message =
    error?.statusText ?? error?.message ?? t("common.errors.unknown");
  const status = error?.status;

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        minHeight: "100vh",
        gap: 16,
        padding: 24,
        textAlign: "center",
      }}
    >
      <div style={{ fontWeight: 700, fontSize: "var(--text-xl)", color: "var(--text-1)" }}>
        {status === 404 ? t("common.errors.pageNotFound") : t("common.errors.somethingWentWrong")}
      </div>
      <div style={{ fontSize: "var(--text-base)", color: "var(--text-3)", maxWidth: 360 }}>
        {message}
      </div>
      <button
        className="btn btn-primary"
        onClick={() => {
          void navigate("/");
        }}
      >
        {t("common.actions.goHome")}
      </button>
    </div>
  );
};
