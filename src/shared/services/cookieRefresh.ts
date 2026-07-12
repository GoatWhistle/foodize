import axios from "axios";
import { makeId } from "@shared/utils/id";

const inFlight = new Map<string, Promise<void>>();

async function performRefresh(baseUrl: string, path: string): Promise<void> {
  await axios.post(
    `${baseUrl}${path}`,
    {},
    {
      withCredentials: true,
      headers: { "X-Request-Id": makeId() },
    },
  );
}

export function cookieRefresh(baseUrl: string, path: string): Promise<void> {
  const key = `${baseUrl}${path}`;
  const existing = inFlight.get(key);
  if (existing) return existing;

  const promise = performRefresh(baseUrl, path).finally(() => {
    inFlight.delete(key);
  });

  inFlight.set(key, promise);
  return promise;
}
