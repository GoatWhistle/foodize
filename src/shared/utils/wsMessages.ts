import type { Order, Notification } from "@shared/types/models";

const isOrderMessage = (data: Record<string, unknown>): data is Order =>
  typeof data['id'] === "string" &&
  typeof data['status'] === "string" &&
  typeof data['display_id'] === "number";

const isNotificationMessage = (
  data: Record<string, unknown>,
): data is Notification =>
  typeof data['id'] === "string" &&
  typeof data['type'] === "string" &&
  typeof data['title'] === "string" &&
  typeof data['message'] === "string";

export function parseOrderMessage(data: Record<string, unknown>): Order | null {
  return isOrderMessage(data) ? data : null;
}

export function parseNotificationMessage(
  data: Record<string, unknown>,
): Notification | null {
  return isNotificationMessage(data) ? data : null;
}
