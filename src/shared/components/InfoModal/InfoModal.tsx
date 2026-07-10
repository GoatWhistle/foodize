import { createPortal } from "react-dom";
import { X } from "@phosphor-icons/react";
import { WEEKDAYS_SHORT_RU } from "@shared/utils/datetime";
import type { Restaurant } from "@shared/types/models";
import styles from "./InfoModal.module.css";

interface WorkingHour {
  day_of_week: number;
  is_open: boolean;
  opening_time: string;
  closing_time: string;
}

interface InfoModalProps {
  restaurant?: Restaurant | null;
  workingHours: WorkingHour[];
  onClose: () => void;
  usePortal?: boolean;
  showDescription?: boolean;
}

const InfoModal = ({ restaurant, workingHours, onClose, usePortal = false, showDescription = false }: InfoModalProps) => {
  const modal = (
    <div
      className={styles.overlay}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className={styles.content}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
          <h2 style={{ margin: 0, fontSize: "1.2rem", fontWeight: 800 }}>Информация</h2>
          <button
            onClick={onClose}
            aria-label="Закрыть"
            style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-2)", display: "flex" }}
          >
            <X size={20} weight="bold" />
          </button>
        </div>

        {showDescription && restaurant?.description && (
          <div style={{ marginBottom: 20, fontSize: "0.9rem", color: "var(--text-1)", lineHeight: 1.5 }}>
            {restaurant.description}
          </div>
        )}

        <h3 style={{ fontSize: "1rem", fontWeight: 700, marginBottom: 12 }}>Рабочие часы</h3>
        {workingHours.length > 0 ? (
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {workingHours.map((wh) => {
              const dayName = WEEKDAYS_SHORT_RU[wh.day_of_week] ?? WEEKDAYS_SHORT_RU[wh.day_of_week - 1] ?? "";
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
    </div>
  );

  if (usePortal) return createPortal(modal, document.body);
  return modal;
};

export default InfoModal;
