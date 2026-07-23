export const vendorOrders = {
  toolbarTitle: "Venue orders",
  toolbarHint: "New orders refresh automatically",
  resetPeriod: "Reset period",
  dateFrom: "Date from",
  dateTo: "Date to",
  filters: {
    all: "All",
    pending: "New",
    accepted: "Accepted",
    ready: "Ready",
    completed: "Handed over",
  },
  nextLabel: {
    accept: "Accept",
    ready: "Ready",
    complete: "Hand over",
  },
  emptyTitle: "No orders",
  emptySubtitleFiltered: "There are no orders in this status",
  emptySubtitle: "Nobody has ordered yet",
  card: {
    title: "Order #{displayId}",
    itemsAndTotal: "{count} items • {total}",
    pickupAt: " • pickup at {time}",
  },
  errors: {
    loadFailed:
      "Could not load orders. Check that the vendor account has access to this venue.",
    statusChangeFailed: "Could not change the order status",
    cancelFailed: "Could not cancel the order",
  },
} as const;

export const vendorAnalytics = {
  presets: {
    today: "Today",
    days3: "3 days",
    days7: "7 days",
    days30: "30 days",
    halfYear: "6 months",
    year: "Year",
    reset: "Reset",
  },
  financePdf: "Finance PDF",
  analyticsPdf: "Analytics PDF",
  orderStatus: {
    completed: "Completed",
    inProgress: "In progress",
    cancelled: "Cancelled",
  },
} as const;

export const vendorPromos = {
  sectionTitle: "Promo codes",
  emptyTitle: "No promo codes",
  emptySubtitle: "Create your first promo code to give customers a discount",
  formTitle: "New promo code",
  placeholders: {
    code: "Code (e.g. SAVE20)",
    discountPercent: "Discount %",
    discountFixed: "Amount ₽",
    maxUses: "Max uses (optional)",
    expiresAt: "Expires (optional)",
    minAmount: "Min. amount (optional)",
    allCategories: "All categories",
  },
  discountTypePercent: "% Percent",
  discountTypeFixed: "₽ Fixed",
  firstOrderOnlyCheckbox: "First order only",
  creating: "Creating...",
  card: {
    firstOrderOnly: "first order only",
    minAmount: "from {amount}",
    usage: "{used}/{max} used",
    unlimited: "∞",
    expires: " • until {date}",
    conditions: "Conditions: {conditions}",
    active: "Active",
    finished: "Finished",
    deactivate: "Deactivate",
  },
  messages: {
    created: "Promo code created",
  },
  errors: {
    loadFailed: "Could not load promo codes",
    createFailed: "Failed to create the promo code",
    deactivateFailed: "Could not deactivate the promo code",
  },
} as const;
