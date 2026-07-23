import { api } from "@shared/services/api.instance";
import type {
  LoyaltyProgram,
  LoyaltyProgramUpsert,
  LoyaltyStatus,
  SuccessResponse,
} from "@shared/types/models";

export const loyaltyService = {
  getProgram: (restaurantId: string) =>
    api.get<SuccessResponse<LoyaltyProgram>>(`/loyalty/programs/${restaurantId}`),
  upsertProgram: (restaurantId: string, data: LoyaltyProgramUpsert) =>
    api.put<SuccessResponse<LoyaltyProgram>>(`/loyalty/programs/${restaurantId}`, data),
  getStatus: (restaurantId: string) =>
    api.get<SuccessResponse<LoyaltyStatus>>(`/loyalty/restaurants/${restaurantId}/status`),
};
