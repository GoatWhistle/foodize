import api from "./api";

export const adminService = {
  getUsers: (params) => api.get("/admin/users", { params }),
  getUser: (id) => api.get(`/admin/users/${id}`),
  deleteUser: (id) => api.delete(`/admin/users/${id}`),
  activateUser: (id) => api.post(`/admin/users/${id}/activate`),
  makeAdmin: (id) => api.post(`/admin/users/${id}/make-admin`),
  makeCustomer: () => api.post("/admin/me/make-customer"),
  getOrders: (params) => api.get("/admin/orders", { params }),
  getRestaurants: (params) => api.get("/admin/restaurants", { params }),
  getRestaurant: (id) => api.get(`/admin/restaurants/${id}`),
  deleteRestaurant: (id) => api.delete(`/admin/restaurants/${id}`),
  approveRestaurant: (id) => api.post(`/admin/restaurants/${id}/approve`),
  rejectRestaurant: (id, reason) =>
    api.post(`/admin/restaurants/${id}/reject`, { reason }),
  getVendors: (params) => api.get("/admin/vendors", { params }),
  getVendor: (id) => api.get(`/admin/vendors/${id}`),
  deleteVendor: (id) => api.delete(`/admin/vendors/${id}`),
  approveVendor: (id) => api.post(`/admin/vendors/${id}/approve`),
  rejectVendor: (id, reason) =>
    api.post(`/admin/vendors/${id}/reject`, { reason }),
  getReviews: (params) => api.get("/admin/reviews", { params }),
  deleteReview: (id) => api.delete(`/admin/reviews/${id}`),
  getPlatformStats: () => api.get("/admin/stats"),
  getFinance: (params) => api.get("/admin/finance", { params }),
};
