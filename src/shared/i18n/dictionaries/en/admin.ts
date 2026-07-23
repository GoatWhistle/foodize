import { adminSidebar, adminCommon, adminBatch, adminReasonDialog, adminStats, adminErrors } from "./admin/shell";
import { adminUsers } from "./admin/users";
import { adminOrders, adminResolution } from "./admin/moderation";
import { adminRestaurants } from "./admin/restaurants";
import { adminVendors } from "./admin/vendors";
import { adminReviews, adminAudit } from "./admin/reviews";
import { adminFinance, adminCharts, adminExportFiles } from "./admin/finance";

export const admin = {
  sidebar: adminSidebar,
  common: adminCommon,
  batch: adminBatch,
  reasonDialog: adminReasonDialog,
  stats: adminStats,
  users: adminUsers,
  orders: adminOrders,
  resolution: adminResolution,
  restaurants: adminRestaurants,
  vendors: adminVendors,
  reviews: adminReviews,
  audit: adminAudit,
  finance: adminFinance,
  charts: adminCharts,
  exportFiles: adminExportFiles,
  errors: adminErrors,
} as const;
