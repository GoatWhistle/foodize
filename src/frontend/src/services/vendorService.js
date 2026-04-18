import api from "./api";

export const vendorService = {
  createProfile: (data) => api.post("/vendors/", data),
  getMyProfile: () => api.get("/vendors/"),
  updateDescription: (description) =>
    api.patch("/vendors/description", null, {
      params: { new_description: description },
    }),
  getStaffRequests: (params) => api.get("/staff/my-requests", { params }),
  updateStaffStatus: (requestId, status) =>
    api.patch(`/staff/requests/${requestId}/status`, { status }),
};
