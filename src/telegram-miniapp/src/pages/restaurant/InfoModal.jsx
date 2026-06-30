import { createPortal } from "react-dom";
import m from "../../components/ui/Modal.module.css";

const DAYS = ["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Вс"];

const InfoModal = ({ restaurant, workingHours, onClose }) => {
  return createPortal(
    <div
      className={`${m.overlay} ${m.restaurantOverlay}`}
      style={{ zIndex: 3000 }}
      onClick={(e) => {
        if (e.target.classList.contains("modal-overlay")) onClose();
      }}
    >
      <div className={m.content} style={{ padding: "20px" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
          <h2 style={{ margin: 0, fontSize: "1.2rem", fontWeight: 800 }}>Информация</h2>
          <button
            onClick={onClose}
            style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-2)", fontSize: 20 }}
          >
            ✕
          </button>
        </div>

        {restaurant.description && (
          <div style={{ marginBottom: 20, fontSize: "0.9rem", color: "var(--text-1)", lineHeight: 1.5 }}>
            {restaurant.description}
          </div>
        )}

        <h3 style={{ fontSize: "1rem", fontWeight: 700, marginBottom: 12 }}>Рабочие часы</h3>
        {workingHours.length > 0 ? (
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {workingHours.map((wh) => {
              const dayName = DAYS[wh.day_of_week] ?? DAYS[wh.day_of_week - 1] ?? "";
              return (
                <div key={wh.day_of_week} style={{ display: "flex", justifyContent: "space-between", fontSize: "0.9rem" }}>
                  <span style={{ color: "var(--text-2)" }}>{dayName}</span>
                  <span style={{ fontWeight: 600 }}>
                    {wh.is_open
                      ? `${wh.opening_time.slice(0, 5)} - ${wh.closing_time.slice(0, 5)}`
                      : "Выходной"}
                  </span>
                </div>
              );
            })}
          </div>
        ) : (
          <div style={{ fontSize: "0.9rem", color: "var(--text-3)" }}>Не указаны</div>
        )}
      </div>
    </div>,
    document.body,
  );
};

export default InfoModal;
