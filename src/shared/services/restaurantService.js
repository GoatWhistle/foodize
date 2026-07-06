import api from "@shared/services/api.instance.js";

export const restaurantService = {
  getAll: (params) => api.get("/restaurants/public", { params }),
  getById: (id) => api.get(`/restaurants/public/${id}`),
  getMy: () => api.get("/restaurants/"),
  create: (data) => api.post("/restaurants/", data),
  update: (id, data) => api.patch(`/restaurants/${id}`, data),
  getWorkingHours: (id) => api.get(`/restaurants/${id}/working-hours`),
  setWorkingHours: (id, hours) =>
    api.put(`/restaurants/${id}/working-hours`, { hours }),
  uploadPhoto: (id, file) => {
    const formData = new FormData();
    formData.append("file", file);
    return api.post(`/restaurants/${id}/photo`, formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
  },
  deletePhoto: (id) => api.delete(`/restaurants/${id}/photo`),
};
