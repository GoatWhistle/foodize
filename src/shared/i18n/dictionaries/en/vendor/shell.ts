export const vendorDashboard = {
  title: "Vendor dashboard",
} as const;

export const vendorSidebar = {
  ariaLabel: "Vendor sections",
  tabs: {
    menu: "Menu",
    orders: "Orders",
    analytics: "Analytics",
    ai: "AI analyst",
    promos: "Promo codes",
    loyalty: "Loyalty",
    schedule: "Schedule",
    staff: "Staff",
    settings: "Settings",
  },
  openDisplayBoard: "Open display board",
  qrSite: "QR for the website",
  qrTelegram: "QR for Telegram",
} as const;

export const vendorApprovalBanner = {
  pendingTitle: "Profile under review",
  rejectedTitle: "Profile rejected",
  pendingText:
    "Your profile is being reviewed by an administrator. Your venues are not visible to customers yet.",
  rejectedText: "Unfortunately, your profile did not pass moderation.",
  reason: "Reason: {reason}",
} as const;

export const vendorExportFiles = {
  menu: "menu_{date}.csv",
  orders: "orders_{date}.csv",
  finance: "finance_{restaurant}_{range}.pdf",
  analytics: "analytics_{restaurant}_{range}.pdf",
  allRestaurants: "all",
} as const;

export const vendorErrors = {
  exportFailed: "Export failed",
} as const;
