import { useRouteError, useNavigate } from "react-router-dom";

interface RouteError {
  status?: number;
  statusText?: string;
  message?: string;
}

export const RouteErrorPage = () => {
  const error = useRouteError() as RouteError | null;
  const navigate = useNavigate();

  const message =
    error?.statusText ?? error?.message ?? "Неизвестная ошибка";
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
        {status === 404 ? "Страница не найдена" : "Что-то пошло не так"}
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
        На главную
      </button>
    </div>
  );
};
