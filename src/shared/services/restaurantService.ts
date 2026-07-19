import { api } from "@shared/services/api.instance";
import type { components } from "@shared/types/api";
import type {
  Restaurant,
  RestaurantCreate,
  RestaurantUpdate,
  SuccessListResponse,
  SuccessResponse,
} from "@shared/types/models";

type WorkingHoursRead = components["schemas"]["WorkingHoursRead"];
type WorkingHoursEntry = components["schemas"]["WorkingHoursEntry"];

export const restaurantService = {
  getAll: (params?: Record<string, unknown>) =>
    api.get<SuccessListResponse<Restaurant>>("/restaurants/public", { params }),
  getById: (id: string) =>
    api.get<SuccessResponse<Restaurant>>(`/restaurants/public/${id}`),
  getMy: () => api.get<SuccessListResponse<Restaurant>>("/restaurants/"),
  create: (data: RestaurantCreate) =>
    api.post<SuccessResponse<Restaurant>>("/restaurants/", data),
  update: (id: string, data: RestaurantUpdate) =>
    api.patch<SuccessResponse<Restaurant>>(`/restaurants/${id}`, data),
  getWorkingHours: (id: string) =>
    api.get<SuccessResponse<WorkingHoursRead[]>>(
      `/restaurants/${id}/working-hours`,
    ),
  setWorkingHours: (id: string, hours: WorkingHoursEntry[]) =>
    api.put<SuccessResponse<WorkingHoursRead[]>>(
      `/restaurants/${id}/working-hours`,
      { hours },
    ),
  uploadPhoto: (id: string, file: File) => {
    const formData = new FormData();
    formData.append("file", file);
    return api.post<SuccessResponse<Restaurant>>(
      `/restaurants/${id}/photo`,
      formData,
      {
        headers: { "Content-Type": "multipart/form-data" },
      },
    );
  },
  deletePhoto: (id: string) =>
    api.delete<SuccessResponse<Restaurant>>(`/restaurants/${id}/photo`),
};
