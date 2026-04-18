import api from "./api";

export const staffService = {
  createRequest: (restaurantId, data) =>
    api.post(`/staff/requests/${restaurantId}`, data),
};
