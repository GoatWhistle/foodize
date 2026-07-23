export const adminSidebar = {
  title: "Admin panel",
  ariaLabel: "Admin panel sections",
  entities: "Entities",
  tabs: {
    stats: "Statistics",
    users: "Users",
    orders: "Orders",
    resolution: "Moderation",
    restaurants: "Restaurants",
    vendors: "Vendors",
    reviews: "Reviews",
    finance: "Analytics",
    audit: "Logs",
  },
} as const;

export const adminCommon = {
  selectAll: "Select all",
  emptySubtitle: "No results for the selected filters",
  anyStatus: "Any status",
} as const;

export const adminBatch = {
  selected: "Selected: {count} {label}",
  labels: {
    users: "users",
    reviews: "reviews",
    vendors: "vendors",
    restaurants: "restaurants",
  },
  actions: {
    activate: "Activate",
    deactivate: "Deactivate",
    deleteSelected: "Delete selected",
    approveSelected: "Approve selected",
    rejectSelected: "Reject selected",
  },
} as const;

export const adminReasonDialog = {
  placeholder: "Write the rejection reason",
  running: "Working...",
} as const;

export const adminStats = {
  cards: {
    users: "Users",
    restaurants: "Restaurants",
    orders: "Orders",
    vendors: "Vendors",
  },
  growth: "+{count} over the last 14 days",
} as const;

export const adminErrors = {
  statsLoadFailed: "Could not load statistics",
  exportFailed: "Export failed",
} as const;
