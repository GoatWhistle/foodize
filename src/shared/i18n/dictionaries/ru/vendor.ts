import { vendorDashboard, vendorSidebar, vendorApprovalBanner, vendorExportFiles, vendorErrors } from "./vendor/shell";
import { vendorRestaurants, vendorMenu } from "./vendor/menu";
import { vendorOrders, vendorAnalytics, vendorPromos } from "./vendor/orders";
import { vendorSchedule, vendorSettings, vendorStaff } from "./vendor/operations";
import { vendorAdvisor, vendorAssistant } from "./vendor/assistant";

export const vendor = {
  dashboard: vendorDashboard,
  sidebar: vendorSidebar,
  approvalBanner: vendorApprovalBanner,
  restaurants: vendorRestaurants,
  menu: vendorMenu,
  orders: vendorOrders,
  analytics: vendorAnalytics,
  promos: vendorPromos,
  schedule: vendorSchedule,
  settings: vendorSettings,
  staff: vendorStaff,
  advisor: vendorAdvisor,
  assistant: vendorAssistant,
  exportFiles: vendorExportFiles,
  errors: vendorErrors,
} as const;
