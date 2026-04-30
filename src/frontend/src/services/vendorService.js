import api from "./api";

export const vendorService = {
  createProfile: (data) => api.post("/vendors/", data),
  getMyProfile: () => api.get("/vendors/"),
  getFinance: (params) => api.get("/vendors/finance", { params }),
  updateDescription: (description) =>
    api.patch("/vendors/description", { description }),
  getStaffRequests: (params) => api.get("/staff/my-requests", { params }),
  updateStaffStatus: (requestId, status) =>
    api.patch(`/staff/requests/${requestId}/status`, { status }),
};
