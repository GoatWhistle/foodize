import { api } from "@shared/services/api.instance";
import type { components } from "@shared/types/api";
import type {
  StaffMember,
  StaffRequest,
  StaffRequestStatus,
  SuccessListResponse,
  SuccessResponse,
} from "@shared/types/models";

type VendorCreate = components["schemas"]["VendorCreate"];
type VendorResponse = components["schemas"]["VendorResponse"];
type FinanceAnalytics = components["schemas"]["FinanceAnalytics"];
type AdvancedAnalytics = components["schemas"]["AdvancedAnalytics"];

export const vendorService = {
  createProfile: (data: VendorCreate) =>
    api.post<SuccessResponse<VendorResponse>>("/vendors/", data),
  getMyProfile: () => api.get<SuccessResponse<VendorResponse>>("/vendors/"),
  getFinance: (params?: Record<string, unknown>) =>
    api.get<SuccessResponse<FinanceAnalytics>>("/vendors/finance", { params }),
  getAdvancedAnalytics: (params?: Record<string, unknown>) =>
    api.get<SuccessResponse<AdvancedAnalytics>>("/vendors/analytics", {
      params,
    }),
  getStaffRequests: (params?: Record<string, unknown>) =>
    api.get<SuccessListResponse<StaffRequest>>("/staff/my-requests", {
      params,
    }),
  updateStaffStatus: (requestId: string, status: StaffRequestStatus) =>
    api.patch<SuccessResponse<StaffRequest>>(
      `/staff/requests/${requestId}/status`,
      { status },
    ),
  getStaffMembers: (params?: Record<string, unknown>) =>
    api.get<SuccessListResponse<StaffMember>>("/staff/my-members", { params }),
  removeStaffMember: (profileId: string) =>
    api.delete<SuccessResponse<void>>(`/staff/members/${profileId}`),
  exportOrdersCSV: (params?: Record<string, unknown>): Promise<Blob> =>
    unwrapBlob(
      api.get<Blob>("/vendors/export/orders.csv", { params, responseType: "blob" }),
    ),
  exportMenuCSV: (params?: Record<string, unknown>): Promise<Blob> =>
    unwrapBlob(api.get<Blob>("/vendors/export/menu.csv", { params, responseType: "blob" })),
  exportPromosCSV: (params?: Record<string, unknown>): Promise<Blob> =>
    unwrapBlob(
      api.get<Blob>("/vendors/export/promos.csv", { params, responseType: "blob" }),
    ),
  exportFinancePDF: (params?: Record<string, unknown>): Promise<Blob> =>
    unwrapBlob(
      api.get<Blob>("/vendors/export/finance.pdf", { params, responseType: "blob" }),
    ),
  exportAnalyticsPDF: (params?: Record<string, unknown>): Promise<Blob> =>
    unwrapBlob(
      api.get<Blob>("/vendors/export/analytics.pdf", { params, responseType: "blob" }),
    ),
};

const unwrapBlob = async (request: Promise<{ data: Blob }>): Promise<Blob> =>
  (await request).data;
