import { ORDER_STATUS_RU } from "./locales";

const STATUS_STYLE = {
  PENDING: {
    color: "var(--color-warning-dim)",
    bg: "var(--color-warning-bg)",
    border: "var(--color-warning-border)",
    solid: "var(--color-warning)",
  },
  ACCEPTED: {
    color: "var(--fire-dim)",
    bg: "var(--fire-subtle)",
    border: "var(--fire-glow)",
    solid: "var(--fire)",
  },
  PREPARING: {
    color: "var(--fire-dim)",
    bg: "var(--fire-subtle)",
    border: "var(--fire-glow)",
    solid: "var(--fire)",
  },
  COOKING: {
    color: "var(--fire-dim)",
    bg: "var(--fire-subtle)",
    border: "var(--fire-glow)",
    solid: "var(--fire)",
  },
  READY: {
    color: "var(--color-success-dim)",
    bg: "var(--color-success-bg)",
    border: "var(--color-success-border)",
    solid: "var(--color-success)",
  },
  COMPLETED: {
    color: "var(--color-neutral)",
    bg: "var(--color-neutral-bg)",
    border: "var(--color-neutral-border)",
    solid: "var(--color-neutral)",
  },
  CANCELLED: {
    color: "var(--color-error)",
    bg: "var(--color-error-bg)",
    border: "var(--color-error-border)",
    solid: "var(--color-error)",
  },
};

type StatusStyle = { color: string; bg: string; border: string; solid: string };

export function getOrderStatusStyle(status: string | null | undefined): StatusStyle {
  return (STATUS_STYLE as Record<string, StatusStyle>)[status ?? ""] ?? STATUS_STYLE.PENDING;
}

export function getOrderStatusLabel(status: string | null | undefined): string {
  return (ORDER_STATUS_RU as Record<string, string>)[status ?? ""] ?? String(status ?? "");
}

const ORDER_STATUS_CUSTOMER_RU: Record<string, string> = {
  PENDING: "Принимается",
  ACCEPTED: "Готовится",
  PREPARING: "Готовится",
  COOKING: "Готовится",
  READY: "Готов к выдаче",
  COMPLETED: "Выдан",
  CANCELLED: "Отменён",
};

export function getCustomerOrderStatusLabel(status: string | null | undefined): string {
  return ORDER_STATUS_CUSTOMER_RU[status ?? ""] ?? String(status ?? "");
}
