import { useCallback, useEffect, useState } from "react";
import type { OrderStatus } from "@shared/types/models";

const TERMINAL_STATUSES = new Set<OrderStatus>(["COMPLETED", "CANCELLED"]);

export const useEtaText = (
  estimatedReadyAt: string | null | undefined,
  status: OrderStatus,
): string => {
  const compute = useCallback((): string => {
    if (TERMINAL_STATUSES.has(status) || status === "READY" || !estimatedReadyAt) return "";
    const diff = Math.round((new Date(estimatedReadyAt).getTime() - Date.now()) / 60000);
    return diff > 0 ? `Будет готов через ~${diff} мин` : "Задерживаемся, скоро будет";
  }, [estimatedReadyAt, status]);

  const [text, setText] = useState<string>(compute);
  useEffect(() => {
    setText(compute());
    if (TERMINAL_STATUSES.has(status) || status === "READY" || !estimatedReadyAt) return;
    const id = setInterval(() => setText(compute()), 30_000);
    return () => clearInterval(id);
  }, [estimatedReadyAt, status, compute]);

  return text;
};
