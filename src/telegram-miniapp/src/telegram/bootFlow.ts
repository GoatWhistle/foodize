import { authExistingUser, initTelegramApp } from "./init";
import type { InitTelegramAppResult } from "./init";

export type BootAction =
  | { type: "ready"; startParam?: string | null }
  | { type: "login"; initData: string }
  | {
      type: "register";
      initData: string;
      phoneNumber: string | null;
      startParam: string | null;
    };

export interface BootFlowDeps {
  fetchMe: () => Promise<void>;
  isAuthenticated: () => boolean;
  isForcedLogout: () => boolean;
}

export async function runBootFlow(deps: BootFlowDeps): Promise<BootAction> {
  const result: InitTelegramAppResult = await initTelegramApp();

  if (deps.isForcedLogout()) {
    return { type: "login", initData: result.initData ?? "" };
  }

  await deps.fetchMe();
  if (deps.isAuthenticated()) {
    return { type: "ready", startParam: result.start_param };
  }

  if (result.status === "registered") {
    await authExistingUser(result.initData ?? "");
    await deps.fetchMe();
    if (!deps.isAuthenticated()) {
      throw new Error("authentication failed after telegram auth");
    }
    return { type: "ready", startParam: result.start_param };
  }

  if (result.status === "new_user") {
    return {
      type: "register",
      initData: result.initData ?? "",
      phoneNumber: result.phone_number ?? null,
      startParam: result.start_param ?? null,
    };
  }

  return { type: "ready" };
}
