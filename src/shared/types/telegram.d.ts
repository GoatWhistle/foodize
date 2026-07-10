interface SharedTelegramWebApp {
  HapticFeedback?: {
    impactOccurred?: (style: string) => void;
    selectionChanged?: () => void;
    notificationOccurred?: (type: string) => void;
  };
  BackButton?: {
    show?: () => void;
    hide?: () => void;
    onClick?: (cb: () => void) => void;
    offClick?: (cb: () => void) => void;
  };
  showAlert?: (message: string) => void;
  showConfirm?: (message: string, cb: (ok: boolean) => void) => void;
  initData?: string;
  initDataUnsafe?: {
    start_param?: string;
    [key: string]: unknown;
  };
  ready?: () => void;
  expand?: () => void;
  close?: () => void;
  [key: string]: unknown;
}

interface Window {
  Telegram?: {
    WebApp?: SharedTelegramWebApp;
  };
}
