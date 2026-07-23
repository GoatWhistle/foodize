import { apiErrorsByCode } from "./apiErrors/codes";
import { apiErrorsByDetail, apiErrorsByStatus } from "./apiErrors/details";

export const apiErrors = {
  byCode: apiErrorsByCode,
  byDetail: apiErrorsByDetail,
  byStatus: apiErrorsByStatus,
} as const;
