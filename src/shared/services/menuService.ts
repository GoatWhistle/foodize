import { api } from "@shared/services/api.instance";
import type { components } from "@shared/types/api";
import type {
  MenuItem,
  MenuItemCreate,
  MenuItemOption,
  MenuItemOptionGroup,
  MenuItemUpdate,
  SuccessListResponse,
  SuccessResponse,
} from "@shared/types/models";

type MenuItemOptionGroupCreate =
  components["schemas"]["MenuItemOptionGroupCreate"];
type MenuItemOptionGroupUpdate =
  components["schemas"]["MenuItemOptionGroupUpdate"];
type MenuItemOptionCreate = components["schemas"]["MenuItemOptionCreate"];
type MenuItemOptionUpdate = components["schemas"]["MenuItemOptionUpdate"];

export const menuService = {
  getMenu: (restaurantId: string, params: Record<string, unknown> = {}) =>
    api.get<SuccessListResponse<MenuItem>>(`/menu/${restaurantId}`, { params }),
  addItem: (restaurantId: string, data: MenuItemCreate) =>
    api.post<SuccessResponse<MenuItem>>(`/menu/${restaurantId}/items`, data),
  updateItem: (restaurantId: string, itemId: string, data: MenuItemUpdate) =>
    api.patch<SuccessResponse<MenuItem>>(
      `/menu/${restaurantId}/items/${itemId}`,
      data,
    ),
  deleteItem: (restaurantId: string, itemId: string) =>
    api.delete<SuccessResponse<void>>(`/menu/${restaurantId}/items/${itemId}`),
  createOptionGroup: (
    restaurantId: string,
    itemId: string,
    data: MenuItemOptionGroupCreate,
  ) =>
    api.post<SuccessResponse<MenuItemOptionGroup>>(
      `/menu/${restaurantId}/items/${itemId}/option-groups`,
      data,
    ),
  updateOptionGroup: (
    restaurantId: string,
    itemId: string,
    groupId: string,
    data: MenuItemOptionGroupUpdate,
  ) =>
    api.patch<SuccessResponse<MenuItemOptionGroup>>(
      `/menu/${restaurantId}/items/${itemId}/option-groups/${groupId}`,
      data,
    ),
  deleteOptionGroup: (restaurantId: string, itemId: string, groupId: string) =>
    api.delete<SuccessResponse<void>>(
      `/menu/${restaurantId}/items/${itemId}/option-groups/${groupId}`,
    ),
  createOption: (
    restaurantId: string,
    itemId: string,
    groupId: string,
    data: MenuItemOptionCreate,
  ) =>
    api.post<SuccessResponse<MenuItemOption>>(
      `/menu/${restaurantId}/items/${itemId}/option-groups/${groupId}/options`,
      data,
    ),
  updateOption: (
    restaurantId: string,
    itemId: string,
    groupId: string,
    optionId: string,
    data: MenuItemOptionUpdate,
  ) =>
    api.patch<SuccessResponse<MenuItemOption>>(
      `/menu/${restaurantId}/items/${itemId}/option-groups/${groupId}/options/${optionId}`,
      data,
    ),
  deleteOption: (
    restaurantId: string,
    itemId: string,
    groupId: string,
    optionId: string,
  ) =>
    api.delete<SuccessResponse<void>>(
      `/menu/${restaurantId}/items/${itemId}/option-groups/${groupId}/options/${optionId}`,
    ),
  toggleAvailability: (
    restaurantId: string,
    itemId: string,
    isAvailable: boolean,
  ) =>
    api.patch<SuccessResponse<MenuItem>>(
      `/menu/${restaurantId}/items/${itemId}/availability`,
      {
        is_available: isAvailable,
      },
    ),
  uploadItemPhoto: (restaurantId: string, itemId: string, file: File) => {
    const formData = new FormData();
    formData.append("file", file);
    return api.post<SuccessResponse<MenuItem>>(
      `/menu/${restaurantId}/items/${itemId}/photo`,
      formData,
      {
        headers: { "Content-Type": "multipart/form-data" },
      },
    );
  },
  deleteItemPhoto: (restaurantId: string, itemId: string) =>
    api.delete<SuccessResponse<MenuItem>>(
      `/menu/${restaurantId}/items/${itemId}/photo`,
    ),
};
