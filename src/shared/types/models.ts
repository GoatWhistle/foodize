import type { components } from "./api";

export type Schemas = components["schemas"];

export type Restaurant = Schemas["RestaurantResponse"];
export type RestaurantCreate = Schemas["RestaurantCreate"];
export type RestaurantUpdate = Schemas["RestaurantUpdate"];
export type RestaurantSort = Schemas["RestaurantSort"];
export type SortDirection = Schemas["SortDirection"];

export type MenuItem = Schemas["MenuItemResponse"];
export type MenuItemShort = Schemas["MenuItemShort"];
export type MenuItemCreate = Schemas["MenuItemCreate"];
export type MenuItemUpdate = Schemas["MenuItemUpdate"];
export type MenuItemOptionGroup = Schemas["MenuItemOptionGroupResponse"];
export type MenuItemOption = Schemas["MenuItemOptionResponse"];
export type Category = Schemas["Category"];

export type Order = Schemas["OrderResponse"];
export type OrderCreate = Schemas["OrderCreate"];
export type OrderItem = Schemas["OrderItemResponse"];
export type OrderItemOption = Schemas["OrderItemOptionResponse"];
export type OrderEvent = Schemas["OrderEventResponse"];
export type OrderStatus = Schemas["OrderStatus"];
export type OrderStatusUpdate = Schemas["OrderStatusUpdate"];
export type OrderCancelRequest = Schemas["OrderCancelRequest"];
export type OrderLoadEstimate = Schemas["OrderLoadEstimate"];

export type Cart = Schemas["CartResponse"];
export type CartItem = Schemas["CartItemResponse"];
export type CartItemIn = Schemas["CartItemIn"];
export type CartUpdate = Schemas["CartUpdate"];
export type CartSelectedOption = Schemas["CartSelectedOption"];

export type Review = Schemas["ReviewResponse"];
export type ReviewCreate = Schemas["ReviewCreate"];
export type Rating = Schemas["RatingResponse"];

export type Notification = Schemas["NotificationResponse"];
export type NotificationList = Schemas["NotificationListResponse"];
export type NotificationType = Schemas["NotificationType"];

export type Favorite = Schemas["FavoriteResponse"];
export type FavoriteRestaurantInfo = Schemas["FavoriteRestaurantInfo"];

export type Promo = Schemas["PromoResponse"];
export type PromoValidate = Schemas["PromoValidateResponse"];

export type StaffMember = Schemas["StaffMemberResponse"];
export type StaffProfile = Schemas["StaffProfileResponse"];
export type StaffRequest = Schemas["StaffRequestResponse"];
export type StaffRequestStatus = Schemas["StaffRequestStatus"];

export type UserRead = Schemas["UserRead"];
export type UserLogin = Schemas["UserLogin"];
export type UserCreate = Schemas["UserCreate"];

export type AnalyticsPoint = Schemas["AnalyticsPoint"];
export type FinanceSeriesPoint = Schemas["FinanceSeriesPoint"];
export type FinanceAnalytics = Schemas["FinanceAnalytics"];
export type FinanceTopItem = Schemas["FinanceTopItem"];
export type FinanceTopRestaurant = Schemas["FinanceTopRestaurant"];
export type AdvancedAnalytics = Schemas["AdvancedAnalytics"];
export type AdvisorInsights = Schemas["AdvisorInsightsResponse"];

export type AdminUser = Schemas["AdminUserResponse"];
export type AdminRestaurant = Schemas["AdminRestaurantResponse"];
export type AdminVendor = Schemas["AdminVendorResponse"];
export type AdminReview = Schemas["AdminReviewResponse"];
export type PlatformStats = Schemas["PlatformStats"];

export type Permission = Schemas["Permission"];
export type Pagination = Schemas["Pagination"];
export type Meta = Schemas["Meta"];

export interface SuccessResponse<T> {
  data: T;
  meta?: Meta;
}

export interface SuccessListResponse<T> {
  data: T[];
  pagination: Pagination;
  meta?: Meta;
}
