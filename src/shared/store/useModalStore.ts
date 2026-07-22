import { create } from "zustand";
import type { ReactNode } from "react";

export interface ConfirmDialogConfig {
  title?: string;
  message?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  danger?: boolean;
  icon?: ReactNode;
  onConfirm?: () => void | Promise<void>;
}

export interface ModalStoreState {
  confirmDialog: ConfirmDialogConfig | null;
  confirmLoading: boolean;
  requestConfirm: (dialog: ConfirmDialogConfig) => void;
  runConfirmAction: () => Promise<void>;
  cancelConfirm: () => void;
}

export const useModalStore = create<ModalStoreState>((set, get) => ({
  confirmDialog: null,
  confirmLoading: false,

  requestConfirm: (dialog) => { set({ confirmDialog: dialog }); },

  runConfirmAction: async () => {
    const { confirmDialog } = get();
    if (!confirmDialog?.onConfirm) return;
    set({ confirmLoading: true });
    try {
      await confirmDialog.onConfirm();
    } finally {
      set({ confirmLoading: false, confirmDialog: null });
    }
  },

  cancelConfirm: () => { set({ confirmDialog: null, confirmLoading: false }); },
}));
