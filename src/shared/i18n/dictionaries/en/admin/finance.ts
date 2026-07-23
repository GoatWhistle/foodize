export const adminFinance = {
  allRestaurants: "All restaurants",
  presets: {
    today: "Today",
    days3: "3 days",
    days7: "7 days",
    days30: "30 days",
    halfYear: "6 months",
    year: "Year",
    reset: "Reset",
  },
  exports: {
    financePdf: "Finance PDF",
    analyticsPdf: "Analytics PDF",
    overviewPdf: "Platform overview PDF",
  },
  topRestaurantsHidden: "Top restaurants hidden — a restaurant filter is active",
  resetFilter: "Reset filter",
  errors: {
    loadFailed: "Could not load analytics",
  },
} as const;

export const adminCharts = {
  revenue: {
    title: "Revenue over time",
    series: "Revenue",
  },
  aovDynamics: {
    title: "Average order value over time",
    series: "Average order value",
  },
  categoryRevenue: {
    title: "Revenue by category",
  },
  hourlyLoad: {
    title: "Load by hour",
    series: "Orders",
  },
  orderStatus: {
    title: "Order statuses",
  },
  topItems: {
    title: "Top 5 dishes",
    soldUnits: "Units sold",
  },
  topRestaurants: {
    title: "Top 5 restaurants",
    revenue: "Revenue",
  },
  usersByRole: {
    customer: "Customers",
    staff: "Staff",
    vendor: "Vendors",
    percentOfAll: "{percent}% of all",
  },
  kpi: {
    revenue: "Revenue",
    growth: "Growth",
    growthSub: "vs. previous period",
    orders: "Orders",
    averageCheck: "Average check",
    averageCheckValue: "{value} ₽",
    conversion: "Conversion",
    conversionValue: "{value}%",
    cancelled: "Cancelled",
    cancelledSub: "{percent}% of all",
  },
} as const;

export const adminExportFiles = {
  users: "users_{date}.csv",
  orders: "orders_{date}.csv",
  restaurants: "restaurants_{date}.csv",
  vendors: "vendors_{date}.csv",
  reviews: "reviews_{date}.csv",
  finance: "finance_{restaurant}_{range}.pdf",
  analytics: "analytics_{restaurant}_{range}.pdf",
  overview: "platform_overview_{date}.pdf",
  allRestaurants: "all",
} as const;
