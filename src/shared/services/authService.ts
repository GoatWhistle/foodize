import { api } from "@shared/services/api.instance";
import type { components } from "@shared/types/api";
import type { SuccessResponse } from "@shared/types/models";

type UserCreate = components["schemas"]["UserCreate"];
type UserLogin = components["schemas"]["UserLogin"];
type UserRead = components["schemas"]["UserRead"];
type TokenResponse = components["schemas"]["TokenResponse"];
type TelegramSiteLoginStartRequest =
  components["schemas"]["TelegramSiteLoginStartRequest"];
type TelegramSiteLoginByUsernameRequest =
  components["schemas"]["TelegramSiteLoginByUsernameRequest"];
type TelegramSiteLoginVerifyRequest =
  components["schemas"]["TelegramSiteLoginVerifyRequest"];
type TelegramSiteLoginVerifyByUsernameRequest =
  components["schemas"]["TelegramSiteLoginVerifyByUsernameRequest"];
type TelegramSiteLoginStartResponse =
  components["schemas"]["TelegramSiteLoginStartResponse"];
type TelegramSiteLoginResponse =
  components["schemas"]["TelegramSiteLoginResponse"];

interface TelegramCheckResponse {
  status: string;
  phone_number?: string | null;
}

interface AuthServiceOptions {
  logout?: () => Promise<unknown>;
}

export function createAuthService({ logout }: AuthServiceOptions = {}) {
  return {
    register: (data: UserCreate) =>
      api.post<SuccessResponse<UserRead>>("/register", data),
    login: (data: UserLogin) =>
      api.post<SuccessResponse<TokenResponse>>("/login", data),
    getMe: () => api.get<SuccessResponse<UserRead>>("/users/me"),
    logout:
      logout ?? (() => api.post<SuccessResponse<void>>("/logout")),

    requestTelegramLoginCode: (data: TelegramSiteLoginStartRequest) =>
      api.post<SuccessResponse<TelegramSiteLoginStartResponse>>(
        "/telegram/site-login/request-code",
        data,
      ),
    requestTelegramLoginCodeByUsername: (
      data: TelegramSiteLoginByUsernameRequest,
    ) =>
      api.post<SuccessResponse<TelegramSiteLoginStartResponse>>(
        "/telegram/site-login/request-code-by-username",
        data,
      ),
    verifyTelegramLoginCode: (data: TelegramSiteLoginVerifyRequest) =>
      api.post<SuccessResponse<TelegramSiteLoginResponse>>(
        "/telegram/site-login/verify",
        data,
      ),
    verifyTelegramLoginCodeByUsername: (
      data: TelegramSiteLoginVerifyByUsernameRequest,
    ) =>
      api.post<SuccessResponse<TelegramSiteLoginResponse>>(
        "/telegram/site-login/verify-by-username",
        data,
      ),
    setTelegramSitePassword: (data: Record<string, unknown>) =>
      api.post<SuccessResponse<TelegramSiteLoginResponse>>(
        "/telegram/site-login/password",
        data,
      ),
    telegramLogout: () =>
      api.post<SuccessResponse<void>>("/telegram/logout"),

    telegramCheck: (initData: string) =>
      api.post<SuccessResponse<TelegramCheckResponse>>("/telegram/check", {
        init_data: initData,
      }),
    telegramRegister: (initData: string, phoneNumber: string, name: string) =>
      api.post<SuccessResponse<TelegramSiteLoginResponse>>(
        "/telegram/register",
        {
          init_data: initData,
          phone_number: phoneNumber,
          name,
        },
      ),
    telegramAuth: (initData: string) =>
      api.post<SuccessResponse<TelegramSiteLoginResponse>>("/telegram/auth", {
        init_data: initData,
      }),
  };
}

export const authService = createAuthService();
