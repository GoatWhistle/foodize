import * as Linking from "expo-linking";
import { router } from "expo-router";

export type DeepLinkTarget =
  | { type: "order"; id: string }
  | { type: "restaurant"; id: string };

const UUID_LIKE = /^[a-zA-Z0-9-]{1,64}$/;

export function parseDeepLink(url: string | null | undefined): DeepLinkTarget | null {
  if (!url) return null;
  let parsed: Linking.ParsedURL;
  try {
    parsed = Linking.parse(url);
  } catch {
    return null;
  }
  const segments = (parsed.path ?? "")
    .split("/")
    .map((segment) => segment.trim())
    .filter(Boolean);
  const host = parsed.hostname ?? "";
  const kind = host || segments[0] || "";
  const id = host ? segments[0] : segments[1];
  if (!id || !UUID_LIKE.test(id)) return null;
  if (kind === "order") return { type: "order", id };
  if (kind === "restaurant") return { type: "restaurant", id };
  return null;
}

export function navigateToTarget(target: DeepLinkTarget | null): boolean {
  if (!target) return false;
  if (target.type === "order") {
    router.push({ pathname: "/order/[id]", params: { id: target.id } });
    return true;
  }
  router.push({ pathname: "/restaurant/[id]", params: { id: target.id } });
  return true;
}

export function handleDeepLink(url: string | null | undefined): boolean {
  return navigateToTarget(parseDeepLink(url));
}

export function extractOrderTarget(
  data: Record<string, unknown> | null | undefined,
): DeepLinkTarget | null {
  if (!data) return null;
  const orderId = data["orderId"] ?? data["order_id"];
  if (typeof orderId === "string" && UUID_LIKE.test(orderId)) {
    return { type: "order", id: orderId };
  }
  return null;
}
