import { useEffect, useState } from "react";
import type { OrderStatus } from "@shared/types/models";

const TERMINAL_STATUSES = new Set<OrderStatus>(["COMPLETED", "CANCELLED"]);
const ETA_REFRESH_MS = 30_000;

export const useEtaText = (
  estimatedReadyAt: string | null | undefined,
  status: OrderStatus,
): string => {
  const isStatic =
    TERMINAL_STATUSES.has(status) || status === "READY" || !estimatedReadyAt;

  const [, setTick] = useState(0);
  useEffect(() => {
    if (isStatic) return;
    const id = setInterval(() => { setTick((t) => t + 1); }, ETA_REFRESH_MS);
    return () => { clearInterval(id); };
  }, [isStatic]);

  if (isStatic || !estimatedReadyAt) return "";
  const diff = Math.round(
    (new Date(estimatedReadyAt).getTime() - Date.now()) / 60000,
  );
  return diff > 0 ? `Будет готов через ~${diff} мин` : "Задерживаемся, скоро будет";
};
