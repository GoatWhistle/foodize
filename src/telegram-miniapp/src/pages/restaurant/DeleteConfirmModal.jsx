import { createPortal } from "react-dom";
import m from "../../components/ui/Modal.module.css";

const DeleteConfirmModal = ({ onConfirm, onCancel }) => {
  return createPortal(
    <div className={`${m.overlay} ${m.restaurantOverlay}`} style={{ zIndex: 5000 }}>
      <div className={m.content} style={{ padding: 20, borderRadius: 14, maxWidth: 360 }}>
        <h3 style={{ margin: 0, fontSize: "1rem" }}>Удалить отзыв?</h3>
        <p style={{ color: "var(--text-3)", fontSize: "0.88rem", lineHeight: 1.45, margin: "10px 0 18px" }}>
          Точно ли вы хотите удалить этот отзыв?
        </p>
        <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
          <button type="button" className="btn btn-secondary" onClick={onCancel}>
            Отмена
          </button>
          <button
            type="button"
            className="btn btn-primary"
            onClick={onConfirm}
            style={{ background: "var(--danger, #ef4444)" }}
          >
            Удалить
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
};

export default DeleteConfirmModal;
