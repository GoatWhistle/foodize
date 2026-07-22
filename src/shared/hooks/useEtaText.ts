import { useEffect, useState } from "react";
import type { OrderStatus } from "@shared/types/models";
import { useTranslation } from "@shared/i18n/useTranslation";

const TERMINAL_STATUSES = new Set<OrderStatus>(["COMPLETED", "CANCELLED"]);
const ETA_REFRESH_MS = 30_000;

export interface EtaState {
  text: string;
  delayed: boolean;
}

export const useEtaState = (
  estimatedReadyAt: string | null | undefined,
  status: OrderStatus,
): EtaState => {
  const { t } = useTranslation();
  const isStatic =
    TERMINAL_STATUSES.has(status) || status === "READY" || !estimatedReadyAt;

  const [, setTick] = useState(0);
  useEffect(() => {
    if (isStatic) return;
    const id = setInterval(() => { setTick((value) => value + 1); }, ETA_REFRESH_MS);
    return () => { clearInterval(id); };
  }, [isStatic]);

  if (isStatic || !estimatedReadyAt) return { text: "", delayed: false };
  const diff = Math.round(
    (new Date(estimatedReadyAt).getTime() - Date.now()) / 60000,
  );
  if (diff > 0) return { text: t("order.status.etaMinutes", { minutes: diff }), delayed: false };
  return { text: t("order.status.etaDelayed"), delayed: true };
};

export const useEtaText = (
  estimatedReadyAt: string | null | undefined,
  status: OrderStatus,
): string => useEtaState(estimatedReadyAt, status).text;
