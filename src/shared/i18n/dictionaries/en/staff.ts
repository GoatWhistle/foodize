export const staff = {
  dashboard: {
    title: "Staff workspace",
    roleLabel: "Role:",
    newOrderAlert: "New order!",
    autoEta: "Auto time from dishes",
    tabs: {
      orders: "Orders",
      menu: "Stop list",
    },
  },
  columns: {
    pending: "New",
    accepted: "In progress",
    ready: "Ready",
    empty: "Empty",
    ariaGroup: "Column \"{label}\", orders: {count}",
  },
  card: {
    ariaRoledescription: "Draggable order card",
    ariaLabel: "Order #{displayId}, status: {status}",
    pickupAt: "For:",
    etaExpired: "time is up",
    etaApprox: "~{minutes} min",
    elapsedMinutes: "{minutes}m",
    next: {
      accept: "Accept",
      ready: "Ready",
      complete: "Hand over",
    },
    cancel: {
      reasonPlaceholder: "Cancellation reason (optional)",
    },
  },
  delayedBanner: {
    orders: {
      one: "{count} order is running late",
      few: "{count} orders are running late",
      many: "{count} orders are running late",
    },
    hint: "— check the accepted ones",
  },
  etaModal: {
    title: "Order #{displayId}",
    subtitle: "Choose the ready time",
    chipMinutes: "{minutes} min",
    recommendedMark: " *",
    manualLabel: "Or set an exact time",
    recommendedHint: "* — recommended based on the order contents",
    confirm: "Start cooking",
  },
  menuTab: {
    emptyTitle: "Menu is empty",
    emptySubtitle: "This restaurant has no dishes yet",
    on: "ON",
    off: "OFF",
  },
  application: {
    noProfileTitle: "No staff profile",
    noProfileSubtitle:
      "You are not linked to any venue. Please contact your manager.",
    number: "Request #{id}",
    pending: {
      title: "Request under review",
      description:
        "Your request has been sent and is awaiting the manager's decision. This usually takes a few hours.",
    },
    accepted: {
      title: "Request approved",
      description:
        "Your request has been accepted. Contact your manager to complete the onboarding.",
    },
    rejected: {
      title: "Request rejected",
      description:
        "Unfortunately, your request was rejected. You can try again in 24 hours.",
    },
  },
  errors: {
    menuLoadFailed: "Could not load the menu",
    statusUpdateFailed: "Could not update the status",
    acceptOrderFailed: "Could not accept the order",
    cancelOrderFailed: "Could not cancel the order",
    toggleAvailabilityFailed: "Could not change the dish status",
  },
  displayBoard: {
    cooking: "Cooking",
    ready: "Ready for pickup",
    empty: "Empty",
    noAccess: "No access",
    connectionError: "Connection error",
  },
} as const;
