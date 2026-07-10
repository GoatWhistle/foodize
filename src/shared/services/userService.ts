import api from "@shared/services/api.instance";
import type { components } from "@shared/types/api";
import type { SuccessResponse } from "@shared/types/models";

type UserRead = components["schemas"]["UserRead"];
type UserPublicRead = components["schemas"]["UserPublicRead"];
type UserUpdate = components["schemas"]["UserUpdate"];
type ChangePasswordRequest = components["schemas"]["ChangePasswordRequest"];

export const userService = {
  getById: (userId: string) =>
    api.get<SuccessResponse<UserPublicRead>>(`/users/${userId}`),
  updateMe: (data: UserUpdate) =>
    api.patch<SuccessResponse<UserRead>>("/users/me", data),
  changePassword: (data: ChangePasswordRequest) =>
    api.post<SuccessResponse<void>>("/users/me/change-password", data),
};
