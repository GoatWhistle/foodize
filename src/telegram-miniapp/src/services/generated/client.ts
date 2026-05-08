/* eslint-disable */
// This file is generated from OpenAPI. Do not edit by hand.
import api from "../api";
import type { paths } from "./schema";

type HttpMethod = "get" | "post" | "put" | "patch" | "delete";

type JsonContent<T> = T extends { content: { "application/json": infer R } }
  ? R
  : never;

type SuccessResponse<TOperation> = TOperation extends {
  responses: infer Responses;
}
  ? JsonContent<
      Responses extends { 200: infer R }
        ? R
        : Responses extends { 201: infer R }
          ? R
          : Responses extends { 202: infer R }
            ? R
            : Responses extends { 204: infer R }
              ? R
              : never
    >
  : never;

type QueryParams<TOperation> = TOperation extends {
  parameters: { query?: infer Query };
}
  ? Query
  : never;

type PathParams<TOperation> = TOperation extends {
  parameters: { path?: infer Path };
}
  ? Path
  : never;

type RequestBody<TOperation> = TOperation extends {
  requestBody?: { content: { "application/json": infer Body } };
}
  ? Body
  : never;

type RequestOptions<TOperation> = {
  path?: PathParams<TOperation>;
  query?: QueryParams<TOperation>;
  body?: RequestBody<TOperation>;
};

function buildPath(pathTemplate: string, pathParams?: Record<string, unknown>) {
  if (!pathParams) return pathTemplate;
  return Object.entries(pathParams).reduce(
    (path, [key, value]) =>
      path.replace(`{${key}}`, encodeURIComponent(String(value))),
    pathTemplate,
  );
}

function getSchemaBaseUrl() {
  const baseUrl = String(api.defaults.baseURL ?? "");
  return baseUrl.replace(/\/api\/v1\/?$/, "");
}

export async function request<TOperation>(
  method: HttpMethod,
  pathTemplate: string,
  options: RequestOptions<TOperation> = {},
): Promise<SuccessResponse<TOperation>> {
  const response = await api.request({
    baseURL: getSchemaBaseUrl(),
    method,
    url: buildPath(
      pathTemplate,
      options.path as Record<string, unknown> | undefined,
    ),
    params: options.query,
    data: options.body,
  });
  return response.data as SuccessResponse<TOperation>;
}

export const readUsersApiV1AdminUsersGet = (
  options?: RequestOptions<paths["/api/v1/admin/users"]["get"]>,
) =>
  request<paths["/api/v1/admin/users"]["get"]>(
    "get",
    "/api/v1/admin/users",
    options,
  );

export const readUserApiV1AdminUsersUserIdGet = (
  options?: RequestOptions<paths["/api/v1/admin/users/{user_id}"]["get"]>,
) =>
  request<paths["/api/v1/admin/users/{user_id}"]["get"]>(
    "get",
    "/api/v1/admin/users/{user_id}",
    options,
  );

export const deleteUserApiV1AdminUsersUserIdDelete = (
  options?: RequestOptions<paths["/api/v1/admin/users/{user_id}"]["delete"]>,
) =>
  request<paths["/api/v1/admin/users/{user_id}"]["delete"]>(
    "delete",
    "/api/v1/admin/users/{user_id}",
    options,
  );

export const activateUserApiV1AdminUsersUserIdActivatePost = (
  options?: RequestOptions<
    paths["/api/v1/admin/users/{user_id}/activate"]["post"]
  >,
) =>
  request<paths["/api/v1/admin/users/{user_id}/activate"]["post"]>(
    "post",
    "/api/v1/admin/users/{user_id}/activate",
    options,
  );

export const grantAdminPermissionsApiV1AdminUsersUserIdGrantAdminPost = (
  options?: RequestOptions<
    paths["/api/v1/admin/users/{user_id}/grant-admin"]["post"]
  >,
) =>
  request<paths["/api/v1/admin/users/{user_id}/grant-admin"]["post"]>(
    "post",
    "/api/v1/admin/users/{user_id}/grant-admin",
    options,
  );

export const changeUserPermissionsApiV1AdminUsersUserIdPermissionsPost = (
  options?: RequestOptions<
    paths["/api/v1/admin/users/{user_id}/permissions"]["post"]
  >,
) =>
  request<paths["/api/v1/admin/users/{user_id}/permissions"]["post"]>(
    "post",
    "/api/v1/admin/users/{user_id}/permissions",
    options,
  );

export const resetMyPermissionsApiV1AdminMeResetPermissionsPost = (
  options?: RequestOptions<paths["/api/v1/admin/me/reset-permissions"]["post"]>,
) =>
  request<paths["/api/v1/admin/me/reset-permissions"]["post"]>(
    "post",
    "/api/v1/admin/me/reset-permissions",
    options,
  );

export const readOrdersApiV1AdminOrdersGet = (
  options?: RequestOptions<paths["/api/v1/admin/orders"]["get"]>,
) =>
  request<paths["/api/v1/admin/orders"]["get"]>(
    "get",
    "/api/v1/admin/orders",
    options,
  );

export const readRestaurantsApiV1AdminRestaurantsGet = (
  options?: RequestOptions<paths["/api/v1/admin/restaurants"]["get"]>,
) =>
  request<paths["/api/v1/admin/restaurants"]["get"]>(
    "get",
    "/api/v1/admin/restaurants",
    options,
  );

export const readRestaurantApiV1AdminRestaurantsRestaurantIdGet = (
  options?: RequestOptions<
    paths["/api/v1/admin/restaurants/{restaurant_id}"]["get"]
  >,
) =>
  request<paths["/api/v1/admin/restaurants/{restaurant_id}"]["get"]>(
    "get",
    "/api/v1/admin/restaurants/{restaurant_id}",
    options,
  );

export const deleteRestaurantApiV1AdminRestaurantsRestaurantIdDelete = (
  options?: RequestOptions<
    paths["/api/v1/admin/restaurants/{restaurant_id}"]["delete"]
  >,
) =>
  request<paths["/api/v1/admin/restaurants/{restaurant_id}"]["delete"]>(
    "delete",
    "/api/v1/admin/restaurants/{restaurant_id}",
    options,
  );

export const approveRestaurantApiV1AdminRestaurantsRestaurantIdApprovePost = (
  options?: RequestOptions<
    paths["/api/v1/admin/restaurants/{restaurant_id}/approve"]["post"]
  >,
) =>
  request<paths["/api/v1/admin/restaurants/{restaurant_id}/approve"]["post"]>(
    "post",
    "/api/v1/admin/restaurants/{restaurant_id}/approve",
    options,
  );

export const rejectRestaurantApiV1AdminRestaurantsRestaurantIdRejectPost = (
  options?: RequestOptions<
    paths["/api/v1/admin/restaurants/{restaurant_id}/reject"]["post"]
  >,
) =>
  request<paths["/api/v1/admin/restaurants/{restaurant_id}/reject"]["post"]>(
    "post",
    "/api/v1/admin/restaurants/{restaurant_id}/reject",
    options,
  );

export const readVendorsApiV1AdminVendorsGet = (
  options?: RequestOptions<paths["/api/v1/admin/vendors"]["get"]>,
) =>
  request<paths["/api/v1/admin/vendors"]["get"]>(
    "get",
    "/api/v1/admin/vendors",
    options,
  );

export const readVendorApiV1AdminVendorsVendorIdGet = (
  options?: RequestOptions<paths["/api/v1/admin/vendors/{vendor_id}"]["get"]>,
) =>
  request<paths["/api/v1/admin/vendors/{vendor_id}"]["get"]>(
    "get",
    "/api/v1/admin/vendors/{vendor_id}",
    options,
  );

export const deleteVendorApiV1AdminVendorsVendorIdDelete = (
  options?: RequestOptions<
    paths["/api/v1/admin/vendors/{vendor_id}"]["delete"]
  >,
) =>
  request<paths["/api/v1/admin/vendors/{vendor_id}"]["delete"]>(
    "delete",
    "/api/v1/admin/vendors/{vendor_id}",
    options,
  );

export const approveVendorApiV1AdminVendorsVendorIdApprovePost = (
  options?: RequestOptions<
    paths["/api/v1/admin/vendors/{vendor_id}/approve"]["post"]
  >,
) =>
  request<paths["/api/v1/admin/vendors/{vendor_id}/approve"]["post"]>(
    "post",
    "/api/v1/admin/vendors/{vendor_id}/approve",
    options,
  );

export const rejectVendorApiV1AdminVendorsVendorIdRejectPost = (
  options?: RequestOptions<
    paths["/api/v1/admin/vendors/{vendor_id}/reject"]["post"]
  >,
) =>
  request<paths["/api/v1/admin/vendors/{vendor_id}/reject"]["post"]>(
    "post",
    "/api/v1/admin/vendors/{vendor_id}/reject",
    options,
  );

export const readReviewsApiV1AdminReviewsGet = (
  options?: RequestOptions<paths["/api/v1/admin/reviews"]["get"]>,
) =>
  request<paths["/api/v1/admin/reviews"]["get"]>(
    "get",
    "/api/v1/admin/reviews",
    options,
  );

export const deleteReviewApiV1AdminReviewsReviewIdDelete = (
  options?: RequestOptions<
    paths["/api/v1/admin/reviews/{review_id}"]["delete"]
  >,
) =>
  request<paths["/api/v1/admin/reviews/{review_id}"]["delete"]>(
    "delete",
    "/api/v1/admin/reviews/{review_id}",
    options,
  );

export const readPlatformStatsApiV1AdminStatsGet = (
  options?: RequestOptions<paths["/api/v1/admin/stats"]["get"]>,
) =>
  request<paths["/api/v1/admin/stats"]["get"]>(
    "get",
    "/api/v1/admin/stats",
    options,
  );

export const readFinanceApiV1AdminFinanceGet = (
  options?: RequestOptions<paths["/api/v1/admin/finance"]["get"]>,
) =>
  request<paths["/api/v1/admin/finance"]["get"]>(
    "get",
    "/api/v1/admin/finance",
    options,
  );

export const readAdvancedAnalyticsApiV1AdminAnalyticsGet = (
  options?: RequestOptions<paths["/api/v1/admin/analytics"]["get"]>,
) =>
  request<paths["/api/v1/admin/analytics"]["get"]>(
    "get",
    "/api/v1/admin/analytics",
    options,
  );

export const getCartApiV1CartGet = (
  options?: RequestOptions<paths["/api/v1/cart"]["get"]>,
) => request<paths["/api/v1/cart"]["get"]>("get", "/api/v1/cart", options);

export const updateCartApiV1CartPost = (
  options?: RequestOptions<paths["/api/v1/cart"]["post"]>,
) => request<paths["/api/v1/cart"]["post"]>("post", "/api/v1/cart", options);

export const clearCartApiV1CartDelete = (
  options?: RequestOptions<paths["/api/v1/cart"]["delete"]>,
) =>
  request<paths["/api/v1/cart"]["delete"]>("delete", "/api/v1/cart", options);

export const listPromosApiV1PromosGet = (
  options?: RequestOptions<paths["/api/v1/promos"]["get"]>,
) => request<paths["/api/v1/promos"]["get"]>("get", "/api/v1/promos", options);

export const createPromoApiV1PromosPost = (
  options?: RequestOptions<paths["/api/v1/promos"]["post"]>,
) =>
  request<paths["/api/v1/promos"]["post"]>("post", "/api/v1/promos", options);

export const deactivatePromoApiV1PromosCodeDelete = (
  options?: RequestOptions<paths["/api/v1/promos/{code}"]["delete"]>,
) =>
  request<paths["/api/v1/promos/{code}"]["delete"]>(
    "delete",
    "/api/v1/promos/{code}",
    options,
  );

export const validatePromoApiV1PromosValidatePost = (
  options?: RequestOptions<paths["/api/v1/promos/validate"]["post"]>,
) =>
  request<paths["/api/v1/promos/validate"]["post"]>(
    "post",
    "/api/v1/promos/validate",
    options,
  );

export const createRegistrationApiV1RegisterPost = (
  options?: RequestOptions<paths["/api/v1/register"]["post"]>,
) =>
  request<paths["/api/v1/register"]["post"]>(
    "post",
    "/api/v1/register",
    options,
  );

export const createLoginApiV1LoginPost = (
  options?: RequestOptions<paths["/api/v1/login"]["post"]>,
) => request<paths["/api/v1/login"]["post"]>("post", "/api/v1/login", options);

export const createRefreshApiV1RefreshPost = (
  options?: RequestOptions<paths["/api/v1/refresh"]["post"]>,
) =>
  request<paths["/api/v1/refresh"]["post"]>("post", "/api/v1/refresh", options);

export const createLogoutApiV1LogoutPost = (
  options?: RequestOptions<paths["/api/v1/logout"]["post"]>,
) =>
  request<paths["/api/v1/logout"]["post"]>("post", "/api/v1/logout", options);

export const getMyFavoritesApiV1FavoritesGet = (
  options?: RequestOptions<paths["/api/v1/favorites"]["get"]>,
) =>
  request<paths["/api/v1/favorites"]["get"]>(
    "get",
    "/api/v1/favorites",
    options,
  );

export const addFavoriteApiV1FavoritesRestaurantIdPost = (
  options?: RequestOptions<paths["/api/v1/favorites/{restaurant_id}"]["post"]>,
) =>
  request<paths["/api/v1/favorites/{restaurant_id}"]["post"]>(
    "post",
    "/api/v1/favorites/{restaurant_id}",
    options,
  );

export const removeFavoriteApiV1FavoritesRestaurantIdDelete = (
  options?: RequestOptions<
    paths["/api/v1/favorites/{restaurant_id}"]["delete"]
  >,
) =>
  request<paths["/api/v1/favorites/{restaurant_id}"]["delete"]>(
    "delete",
    "/api/v1/favorites/{restaurant_id}",
    options,
  );

export const getMyStaffProfileApiV1StaffMeGet = (
  options?: RequestOptions<paths["/api/v1/staff/me"]["get"]>,
) =>
  request<paths["/api/v1/staff/me"]["get"]>("get", "/api/v1/staff/me", options);

export const getMyApplicationApiV1StaffMyApplicationGet = (
  options?: RequestOptions<paths["/api/v1/staff/my-application"]["get"]>,
) =>
  request<paths["/api/v1/staff/my-application"]["get"]>(
    "get",
    "/api/v1/staff/my-application",
    options,
  );

export const createStaffRequestApiV1StaffRequestsRestaurantIdPost = (
  options?: RequestOptions<
    paths["/api/v1/staff/requests/{restaurant_id}"]["post"]
  >,
) =>
  request<paths["/api/v1/staff/requests/{restaurant_id}"]["post"]>(
    "post",
    "/api/v1/staff/requests/{restaurant_id}",
    options,
  );

export const updateStaffStatusApiV1StaffRequestsRequestIdStatusPatch = (
  options?: RequestOptions<
    paths["/api/v1/staff/requests/{request_id}/status"]["patch"]
  >,
) =>
  request<paths["/api/v1/staff/requests/{request_id}/status"]["patch"]>(
    "patch",
    "/api/v1/staff/requests/{request_id}/status",
    options,
  );

export const getVendorRequestsApiV1StaffMyRequestsGet = (
  options?: RequestOptions<paths["/api/v1/staff/my-requests"]["get"]>,
) =>
  request<paths["/api/v1/staff/my-requests"]["get"]>(
    "get",
    "/api/v1/staff/my-requests",
    options,
  );

export const getVendorMembersApiV1StaffMyMembersGet = (
  options?: RequestOptions<paths["/api/v1/staff/my-members"]["get"]>,
) =>
  request<paths["/api/v1/staff/my-members"]["get"]>(
    "get",
    "/api/v1/staff/my-members",
    options,
  );

export const removeStaffMemberApiV1StaffMembersProfileIdDelete = (
  options?: RequestOptions<
    paths["/api/v1/staff/members/{profile_id}"]["delete"]
  >,
) =>
  request<paths["/api/v1/staff/members/{profile_id}"]["delete"]>(
    "delete",
    "/api/v1/staff/members/{profile_id}",
    options,
  );

export const staffToggleItemAvailabilityApiV1StaffMenuRestaurantIdItemsItemIdAvailabilityPatch =
  (
    options?: RequestOptions<
      paths["/api/v1/staff/menu/{restaurant_id}/items/{item_id}/availability"]["patch"]
    >,
  ) =>
    request<
      paths["/api/v1/staff/menu/{restaurant_id}/items/{item_id}/availability"]["patch"]
    >(
      "patch",
      "/api/v1/staff/menu/{restaurant_id}/items/{item_id}/availability",
      options,
    );

export const readMyVendorProfileApiV1VendorsGet = (
  options?: RequestOptions<paths["/api/v1/vendors/"]["get"]>,
) =>
  request<paths["/api/v1/vendors/"]["get"]>("get", "/api/v1/vendors/", options);

export const createVendorApiV1VendorsPost = (
  options?: RequestOptions<paths["/api/v1/vendors/"]["post"]>,
) =>
  request<paths["/api/v1/vendors/"]["post"]>(
    "post",
    "/api/v1/vendors/",
    options,
  );

export const readVendorFinanceApiV1VendorsFinanceGet = (
  options?: RequestOptions<paths["/api/v1/vendors/finance"]["get"]>,
) =>
  request<paths["/api/v1/vendors/finance"]["get"]>(
    "get",
    "/api/v1/vendors/finance",
    options,
  );

export const readVendorAnalyticsApiV1VendorsAnalyticsGet = (
  options?: RequestOptions<paths["/api/v1/vendors/analytics"]["get"]>,
) =>
  request<paths["/api/v1/vendors/analytics"]["get"]>(
    "get",
    "/api/v1/vendors/analytics",
    options,
  );

export const readPublicRestaurantApiV1RestaurantsPublicRestaurantIdGet = (
  options?: RequestOptions<
    paths["/api/v1/restaurants/public/{restaurant_id}"]["get"]
  >,
) =>
  request<paths["/api/v1/restaurants/public/{restaurant_id}"]["get"]>(
    "get",
    "/api/v1/restaurants/public/{restaurant_id}",
    options,
  );

export const readPublicRestaurantsApiV1RestaurantsPublicGet = (
  options?: RequestOptions<paths["/api/v1/restaurants/public"]["get"]>,
) =>
  request<paths["/api/v1/restaurants/public"]["get"]>(
    "get",
    "/api/v1/restaurants/public",
    options,
  );

export const readMyRestaurantsApiV1RestaurantsGet = (
  options?: RequestOptions<paths["/api/v1/restaurants/"]["get"]>,
) =>
  request<paths["/api/v1/restaurants/"]["get"]>(
    "get",
    "/api/v1/restaurants/",
    options,
  );

export const createRestaurantApiV1RestaurantsPost = (
  options?: RequestOptions<paths["/api/v1/restaurants/"]["post"]>,
) =>
  request<paths["/api/v1/restaurants/"]["post"]>(
    "post",
    "/api/v1/restaurants/",
    options,
  );

export const updateRestaurantApiV1RestaurantsRestaurantIdPatch = (
  options?: RequestOptions<
    paths["/api/v1/restaurants/{restaurant_id}"]["patch"]
  >,
) =>
  request<paths["/api/v1/restaurants/{restaurant_id}"]["patch"]>(
    "patch",
    "/api/v1/restaurants/{restaurant_id}",
    options,
  );

export const readWorkingHoursApiV1RestaurantsRestaurantIdWorkingHoursGet = (
  options?: RequestOptions<
    paths["/api/v1/restaurants/{restaurant_id}/working-hours"]["get"]
  >,
) =>
  request<paths["/api/v1/restaurants/{restaurant_id}/working-hours"]["get"]>(
    "get",
    "/api/v1/restaurants/{restaurant_id}/working-hours",
    options,
  );

export const setWorkingHoursEndpointApiV1RestaurantsRestaurantIdWorkingHoursPut =
  (
    options?: RequestOptions<
      paths["/api/v1/restaurants/{restaurant_id}/working-hours"]["put"]
    >,
  ) =>
    request<paths["/api/v1/restaurants/{restaurant_id}/working-hours"]["put"]>(
      "put",
      "/api/v1/restaurants/{restaurant_id}/working-hours",
      options,
    );

export const createMenuItemApiV1MenuRestaurantIdItemsPost = (
  options?: RequestOptions<paths["/api/v1/menu/{restaurant_id}/items"]["post"]>,
) =>
  request<paths["/api/v1/menu/{restaurant_id}/items"]["post"]>(
    "post",
    "/api/v1/menu/{restaurant_id}/items",
    options,
  );

export const updateMenuItemApiV1MenuRestaurantIdItemsItemIdPatch = (
  options?: RequestOptions<
    paths["/api/v1/menu/{restaurant_id}/items/{item_id}"]["patch"]
  >,
) =>
  request<paths["/api/v1/menu/{restaurant_id}/items/{item_id}"]["patch"]>(
    "patch",
    "/api/v1/menu/{restaurant_id}/items/{item_id}",
    options,
  );

export const deleteMenuItemApiV1MenuRestaurantIdItemsItemIdDelete = (
  options?: RequestOptions<
    paths["/api/v1/menu/{restaurant_id}/items/{item_id}"]["delete"]
  >,
) =>
  request<paths["/api/v1/menu/{restaurant_id}/items/{item_id}"]["delete"]>(
    "delete",
    "/api/v1/menu/{restaurant_id}/items/{item_id}",
    options,
  );

export const toggleItemAvailabilityApiV1MenuRestaurantIdItemsItemIdAvailabilityPatch =
  (
    options?: RequestOptions<
      paths["/api/v1/menu/{restaurant_id}/items/{item_id}/availability"]["patch"]
    >,
  ) =>
    request<
      paths["/api/v1/menu/{restaurant_id}/items/{item_id}/availability"]["patch"]
    >(
      "patch",
      "/api/v1/menu/{restaurant_id}/items/{item_id}/availability",
      options,
    );

export const createOptionGroupApiV1MenuRestaurantIdItemsItemIdOptionGroupsPost =
  (
    options?: RequestOptions<
      paths["/api/v1/menu/{restaurant_id}/items/{item_id}/option-groups"]["post"]
    >,
  ) =>
    request<
      paths["/api/v1/menu/{restaurant_id}/items/{item_id}/option-groups"]["post"]
    >(
      "post",
      "/api/v1/menu/{restaurant_id}/items/{item_id}/option-groups",
      options,
    );

export const updateOptionGroupApiV1MenuRestaurantIdItemsItemIdOptionGroupsGroupIdPatch =
  (
    options?: RequestOptions<
      paths["/api/v1/menu/{restaurant_id}/items/{item_id}/option-groups/{group_id}"]["patch"]
    >,
  ) =>
    request<
      paths["/api/v1/menu/{restaurant_id}/items/{item_id}/option-groups/{group_id}"]["patch"]
    >(
      "patch",
      "/api/v1/menu/{restaurant_id}/items/{item_id}/option-groups/{group_id}",
      options,
    );

export const deleteOptionGroupApiV1MenuRestaurantIdItemsItemIdOptionGroupsGroupIdDelete =
  (
    options?: RequestOptions<
      paths["/api/v1/menu/{restaurant_id}/items/{item_id}/option-groups/{group_id}"]["delete"]
    >,
  ) =>
    request<
      paths["/api/v1/menu/{restaurant_id}/items/{item_id}/option-groups/{group_id}"]["delete"]
    >(
      "delete",
      "/api/v1/menu/{restaurant_id}/items/{item_id}/option-groups/{group_id}",
      options,
    );

export const createOptionApiV1MenuRestaurantIdItemsItemIdOptionGroupsGroupIdOptionsPost =
  (
    options?: RequestOptions<
      paths["/api/v1/menu/{restaurant_id}/items/{item_id}/option-groups/{group_id}/options"]["post"]
    >,
  ) =>
    request<
      paths["/api/v1/menu/{restaurant_id}/items/{item_id}/option-groups/{group_id}/options"]["post"]
    >(
      "post",
      "/api/v1/menu/{restaurant_id}/items/{item_id}/option-groups/{group_id}/options",
      options,
    );

export const updateOptionApiV1MenuRestaurantIdItemsItemIdOptionGroupsGroupIdOptionsOptionIdPatch =
  (
    options?: RequestOptions<
      paths["/api/v1/menu/{restaurant_id}/items/{item_id}/option-groups/{group_id}/options/{option_id}"]["patch"]
    >,
  ) =>
    request<
      paths["/api/v1/menu/{restaurant_id}/items/{item_id}/option-groups/{group_id}/options/{option_id}"]["patch"]
    >(
      "patch",
      "/api/v1/menu/{restaurant_id}/items/{item_id}/option-groups/{group_id}/options/{option_id}",
      options,
    );

export const deleteOptionApiV1MenuRestaurantIdItemsItemIdOptionGroupsGroupIdOptionsOptionIdDelete =
  (
    options?: RequestOptions<
      paths["/api/v1/menu/{restaurant_id}/items/{item_id}/option-groups/{group_id}/options/{option_id}"]["delete"]
    >,
  ) =>
    request<
      paths["/api/v1/menu/{restaurant_id}/items/{item_id}/option-groups/{group_id}/options/{option_id}"]["delete"]
    >(
      "delete",
      "/api/v1/menu/{restaurant_id}/items/{item_id}/option-groups/{group_id}/options/{option_id}",
      options,
    );

export const readRestaurantMenuApiV1MenuRestaurantIdGet = (
  options?: RequestOptions<paths["/api/v1/menu/{restaurant_id}"]["get"]>,
) =>
  request<paths["/api/v1/menu/{restaurant_id}"]["get"]>(
    "get",
    "/api/v1/menu/{restaurant_id}",
    options,
  );

export const createOrderApiV1OrdersPost = (
  options?: RequestOptions<paths["/api/v1/orders/"]["post"]>,
) =>
  request<paths["/api/v1/orders/"]["post"]>("post", "/api/v1/orders/", options);

export const readMyOrdersApiV1OrdersMeGet = (
  options?: RequestOptions<paths["/api/v1/orders/me"]["get"]>,
) =>
  request<paths["/api/v1/orders/me"]["get"]>(
    "get",
    "/api/v1/orders/me",
    options,
  );

export const readRestaurantOrdersApiV1OrdersRestaurantRestaurantIdGet = (
  options?: RequestOptions<
    paths["/api/v1/orders/restaurant/{restaurant_id}"]["get"]
  >,
) =>
  request<paths["/api/v1/orders/restaurant/{restaurant_id}"]["get"]>(
    "get",
    "/api/v1/orders/restaurant/{restaurant_id}",
    options,
  );

export const updateOrderStatusApiV1OrdersOrderIdStatusPatch = (
  options?: RequestOptions<paths["/api/v1/orders/{order_id}/status"]["patch"]>,
) =>
  request<paths["/api/v1/orders/{order_id}/status"]["patch"]>(
    "patch",
    "/api/v1/orders/{order_id}/status",
    options,
  );

export const readOrderEventsApiV1OrdersOrderIdEventsGet = (
  options?: RequestOptions<paths["/api/v1/orders/{order_id}/events"]["get"]>,
) =>
  request<paths["/api/v1/orders/{order_id}/events"]["get"]>(
    "get",
    "/api/v1/orders/{order_id}/events",
    options,
  );

export const completeOrderApiV1OrdersOrderIdCompletePost = (
  options?: RequestOptions<paths["/api/v1/orders/{order_id}/complete"]["post"]>,
) =>
  request<paths["/api/v1/orders/{order_id}/complete"]["post"]>(
    "post",
    "/api/v1/orders/{order_id}/complete",
    options,
  );

export const readOrderApiV1OrdersOrderIdGet = (
  options?: RequestOptions<paths["/api/v1/orders/{order_id}"]["get"]>,
) =>
  request<paths["/api/v1/orders/{order_id}"]["get"]>(
    "get",
    "/api/v1/orders/{order_id}",
    options,
  );

export const readReviewsApiV1RestaurantsRestaurantIdReviewsGet = (
  options?: RequestOptions<
    paths["/api/v1/restaurants/{restaurant_id}/reviews"]["get"]
  >,
) =>
  request<paths["/api/v1/restaurants/{restaurant_id}/reviews"]["get"]>(
    "get",
    "/api/v1/restaurants/{restaurant_id}/reviews",
    options,
  );

export const createReviewApiV1RestaurantsRestaurantIdReviewsPost = (
  options?: RequestOptions<
    paths["/api/v1/restaurants/{restaurant_id}/reviews"]["post"]
  >,
) =>
  request<paths["/api/v1/restaurants/{restaurant_id}/reviews"]["post"]>(
    "post",
    "/api/v1/restaurants/{restaurant_id}/reviews",
    options,
  );

export const deleteMyReviewApiV1RestaurantsRestaurantIdReviewsReviewIdDelete = (
  options?: RequestOptions<
    paths["/api/v1/restaurants/{restaurant_id}/reviews/{review_id}"]["delete"]
  >,
) =>
  request<
    paths["/api/v1/restaurants/{restaurant_id}/reviews/{review_id}"]["delete"]
  >(
    "delete",
    "/api/v1/restaurants/{restaurant_id}/reviews/{review_id}",
    options,
  );

export const updateMyReviewApiV1RestaurantsRestaurantIdReviewsMyPut = (
  options?: RequestOptions<
    paths["/api/v1/restaurants/{restaurant_id}/reviews/my"]["put"]
  >,
) =>
  request<paths["/api/v1/restaurants/{restaurant_id}/reviews/my"]["put"]>(
    "put",
    "/api/v1/restaurants/{restaurant_id}/reviews/my",
    options,
  );

export const readRatingApiV1RestaurantsRestaurantIdRatingGet = (
  options?: RequestOptions<
    paths["/api/v1/restaurants/{restaurant_id}/rating"]["get"]
  >,
) =>
  request<paths["/api/v1/restaurants/{restaurant_id}/rating"]["get"]>(
    "get",
    "/api/v1/restaurants/{restaurant_id}/rating",
    options,
  );

export const telegramCheckApiV1TelegramCheckPost = (
  options?: RequestOptions<paths["/api/v1/telegram/check"]["post"]>,
) =>
  request<paths["/api/v1/telegram/check"]["post"]>(
    "post",
    "/api/v1/telegram/check",
    options,
  );

export const telegramRegisterApiV1TelegramRegisterPost = (
  options?: RequestOptions<paths["/api/v1/telegram/register"]["post"]>,
) =>
  request<paths["/api/v1/telegram/register"]["post"]>(
    "post",
    "/api/v1/telegram/register",
    options,
  );

export const telegramAuthApiV1TelegramAuthPost = (
  options?: RequestOptions<paths["/api/v1/telegram/auth"]["post"]>,
) =>
  request<paths["/api/v1/telegram/auth"]["post"]>(
    "post",
    "/api/v1/telegram/auth",
    options,
  );

export const readMyProfileApiV1UsersMeGet = (
  options?: RequestOptions<paths["/api/v1/users/me"]["get"]>,
) =>
  request<paths["/api/v1/users/me"]["get"]>("get", "/api/v1/users/me", options);

export const updateMyProfileApiV1UsersMePatch = (
  options?: RequestOptions<paths["/api/v1/users/me"]["patch"]>,
) =>
  request<paths["/api/v1/users/me"]["patch"]>(
    "patch",
    "/api/v1/users/me",
    options,
  );

export const changeMyPasswordApiV1UsersMeChangePasswordPost = (
  options?: RequestOptions<paths["/api/v1/users/me/change-password"]["post"]>,
) =>
  request<paths["/api/v1/users/me/change-password"]["post"]>(
    "post",
    "/api/v1/users/me/change-password",
    options,
  );

export const readUserApiV1UsersUserIdGet = (
  options?: RequestOptions<paths["/api/v1/users/{user_id}"]["get"]>,
) =>
  request<paths["/api/v1/users/{user_id}"]["get"]>(
    "get",
    "/api/v1/users/{user_id}",
    options,
  );

export const getMyNotificationsApiV1NotificationsGet = (
  options?: RequestOptions<paths["/api/v1/notifications"]["get"]>,
) =>
  request<paths["/api/v1/notifications"]["get"]>(
    "get",
    "/api/v1/notifications",
    options,
  );

export const readNotificationApiV1NotificationsNotificationIdReadPost = (
  options?: RequestOptions<
    paths["/api/v1/notifications/{notification_id}/read"]["post"]
  >,
) =>
  request<paths["/api/v1/notifications/{notification_id}/read"]["post"]>(
    "post",
    "/api/v1/notifications/{notification_id}/read",
    options,
  );

export const readAllNotificationsApiV1NotificationsReadAllPost = (
  options?: RequestOptions<paths["/api/v1/notifications/read-all"]["post"]>,
) =>
  request<paths["/api/v1/notifications/read-all"]["post"]>(
    "post",
    "/api/v1/notifications/read-all",
    options,
  );

export const pingApiPingGet = (
  options?: RequestOptions<paths["/api/ping"]["get"]>,
) => request<paths["/api/ping"]["get"]>("get", "/api/ping", options);

export const healthApiHealthGet = (
  options?: RequestOptions<paths["/api/health"]["get"]>,
) => request<paths["/api/health"]["get"]>("get", "/api/health", options);
