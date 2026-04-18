import api from "./api";

export const adminService = {
  getUsers: (params) => api.get("/admin/users", { params }),
  getUser: (id) => api.get(`/admin/users/${id}`),
  deleteUser: (id) => api.delete(`/admin/users/${id}`),
  getOrders: (params) => api.get("/admin/orders", { params }),
  getPlatformStats: () => api.get("/admin/stats"),
};
