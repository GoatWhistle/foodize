import { createPortal } from "react-dom";
import { XIcon } from "@phosphor-icons/react";
import { weekdaysShort } from "@shared/utils/datetime";
import { useFocusTrap } from "@shared/hooks/useFocusTrap";
import type { Restaurant } from "@shared/types/models";
import { useTranslation } from "@shared/i18n/useTranslation";
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

export const InfoModal = ({ restaurant, workingHours, onClose, usePortal = false, showDescription = false }: InfoModalProps) => {
  const { t } = useTranslation();
  const weekdays = weekdaysShort();
  const contentRef = useFocusTrap<HTMLDivElement>({ onEscape: onClose });
  const modal = (
    <div
      className={styles['overlay']}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        ref={contentRef}
        className={styles['content']}
        role="dialog"
        aria-modal="true"
        aria-labelledby="info-modal-title"
      >
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
          <h2 id="info-modal-title" style={{ margin: 0, fontSize: "var(--text-md)", fontWeight: 800 }}>{t("catalog.info.title")}</h2>
          <button
            onClick={onClose}
            aria-label={t("common.actions.close")}
            style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-2)", display: "flex", alignItems: "center", justifyContent: "center", width: 44, height: 44, margin: -11, flexShrink: 0 }}
          >
            <XIcon size={20} weight="bold" />
          </button>
        </div>

        {showDescription && restaurant?.description && (
          <div style={{ marginBottom: 20, fontSize: "var(--text-base)", color: "var(--text-1)", lineHeight: 1.5 }}>
            {restaurant.description}
          </div>
        )}

        <h3 style={{ fontSize: "var(--text-md)", fontWeight: 700, marginBottom: 12 }}>{t("catalog.info.workingHours")}</h3>
        {workingHours.length > 0 ? (
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {workingHours.map((wh) => {
              const dayName = weekdays[wh.day_of_week] ?? weekdays[wh.day_of_week - 1] ?? "";
              return (
                <div key={wh.day_of_week} style={{ display: "flex", justifyContent: "space-between", fontSize: "var(--text-base)" }}>
                  <span style={{ color: "var(--text-2)" }}>{dayName}</span>
                  <span style={{ fontWeight: 600 }}>
                    {wh.is_open
                      ? `${wh.opening_time.slice(0, 5)} - ${wh.closing_time.slice(0, 5)}`
                      : t("catalog.info.dayOff")}
                  </span>
                </div>
              );
            })}
          </div>
        ) : (
          <div style={{ fontSize: "var(--text-base)", color: "var(--text-3)" }}>{t("catalog.info.notSpecified")}</div>
        )}
      </div>
    </div>
  );

  if (usePortal) return createPortal(modal, document.body);
  return modal;
};
