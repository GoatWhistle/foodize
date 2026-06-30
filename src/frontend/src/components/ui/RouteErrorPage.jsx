import { useRouteError, useNavigate } from "react-router-dom";

const RouteErrorPage = () => {
  const error = useRouteError();
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
      <div style={{ fontWeight: 700, fontSize: "1.5rem", color: "var(--text-1)" }}>
        {status === 404 ? "Страница не найдена" : "Что-то пошло не так"}
      </div>
      <div style={{ fontSize: "0.9rem", color: "var(--text-3)", maxWidth: 360 }}>
        {message}
      </div>
      <button className="btn btn-primary" onClick={() => navigate("/")}>
        На главную
      </button>
    </div>
  );
};

export default RouteErrorPage;
