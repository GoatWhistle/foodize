export const adminOrders = {
  searchPlaceholder: "Customer, phone or restaurant",
  emptyTitle: "No orders yet",
  filters: {
    all: "All",
    pending: "New",
    accepted: "Accepted",
    ready: "Ready",
    completed: "Handed over",
  },
  card: {
    title: "Order #{displayId}",
    customerFallback: "Customer",
  },
  errors: {
    loadFailed: "Could not load orders",
  },
} as const;

export const adminResolution = {
  title: "Moderation center",
  subtitle: "Manual cancellation and refund tools for any order.",
  searchPlaceholder: "Order ID, customer phone",
  allStatuses: "All statuses",
  statuses: {
    pending: "New",
    accepted: "Accepted",
    ready: "Ready",
    completed: "Handed over (refund needed?)",
  },
  orderTitle: "Order #{displayId}",
  customerFallback: "Customer",
  details: "Details",
  forceCancel: "Force cancel / Refund",
  emptyTitle: "No problem orders found",
  dialogs: {
    forceCancelTitle: "Force cancellation",
    forceCancelMessage: "Are you sure you want to cancel order #{displayId}?",
    forceCancelConfirm: "Cancel order",
  },
  errors: {
    cancelFailed: "Could not cancel the order. Please try again.",
  },
} as const;
