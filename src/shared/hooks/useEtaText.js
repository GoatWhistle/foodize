import { useCallback, useEffect, useState } from "react";

const TERMINAL_STATUSES = new Set(["COMPLETED", "CANCELLED"]);

export const useEtaText = (estimatedReadyAt, status) => {
  const compute = useCallback(() => {
    if (TERMINAL_STATUSES.has(status) || status === "READY" || !estimatedReadyAt) return "";
    const diff = Math.round((new Date(estimatedReadyAt) - Date.now()) / 60000);
    return diff > 0 ? `Будет готов через ~${diff} мин` : "Задерживаемся, скоро будет";
  }, [estimatedReadyAt, status]);

  const [text, setText] = useState(compute);
  useEffect(() => {
    setText(compute());
    if (TERMINAL_STATUSES.has(status) || status === "READY" || !estimatedReadyAt) return;
    const id = setInterval(() => setText(compute()), 30_000);
    return () => clearInterval(id);
  }, [estimatedReadyAt, status, compute]);

  return text;
};
