import { useEffect, useRef } from "react";
import type { MouseEvent } from "react";
import { TrashIcon } from "@phosphor-icons/react";
import { useShallow } from "zustand/react/shallow";
import { useModalStore } from "@shared/store/useModalStore";
import type { ModalStoreState } from "@shared/store/useModalStore";

const ConfirmDialog = () => {
  const { dialog, loading, cancelConfirm, runConfirmAction } = useModalStore(
    useShallow((s: ModalStoreState) => ({
      dialog: s.confirmDialog,
      loading: s.confirmLoading,
      cancelConfirm: s.cancelConfirm,
      runConfirmAction: s.runConfirmAction,
    })),
  );

  const cancelBtnRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!dialog) return;
    cancelBtnRef.current?.focus();
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !loading) cancelConfirm();
    };
    document.addEventListener("keydown", handler);
    return () => { document.removeEventListener("keydown", handler); };
  }, [dialog, loading, cancelConfirm]);

  if (!dialog) return null;

  return (
    <div
      className="modal-overlay"
      style={{ zIndex: "var(--z-toast)" }}
      onMouseDown={(e: MouseEvent<HTMLDivElement>) => {
        if (e.target === e.currentTarget && !loading) cancelConfirm();
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="confirm-dialog-title"
        className="modal-content"
        style={{ maxWidth: 440, padding: 22, display: "flex", flexDirection: "column", gap: 18 }}
      >
        <div style={{ display: "flex", gap: 14, alignItems: "flex-start" }}>
          <div
            style={{
              width: 42,
              height: 42,
              borderRadius: "var(--r-sm)",
              background: "var(--color-error-bg)",
              color: "var(--error)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
            }}
          >
            <TrashIcon size={20} />
          </div>
          <div>
            <h3 id="confirm-dialog-title" style={{ color: "var(--text-1)", fontSize: "1.05rem", margin: 0 }}>{dialog.title}</h3>
            <p style={{ color: "var(--text-3)", fontSize: "0.88rem", lineHeight: 1.55, margin: "8px 0 0" }}>
              {dialog.message}
            </p>
          </div>
        </div>
        <div style={{ display: "flex", gap: 8, justifyContent: "flex-end", flexWrap: "wrap" }}>
          <button ref={cancelBtnRef} className="btn btn-secondary" disabled={loading} onClick={cancelConfirm}>
            Отмена
          </button>
          <button
            className="btn btn-primary"
            disabled={loading}
            onClick={() => { void runConfirmAction(); }}
            style={{ background: dialog.danger ? "var(--error)" : "var(--fire)" }}
          >
            {loading ? "Выполняю..." : dialog.confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmDialog;
