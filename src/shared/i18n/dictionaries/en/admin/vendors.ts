export const adminVendors = {
  searchPlaceholder: "Vendor or phone",
  allStatuses: "All statuses",
  statuses: {
    pending: "Under review",
    approved: "Approved",
    rejected: "Rejected",
  },
  emptyTitle: "No vendors yet",
  noName: "Unnamed vendor",
  noPhone: "No phone number",
  restaurantsCount: {
    one: "{count} venue",
    few: "{count} venues",
    many: "{count} venues",
  },
  modal: {
    fallbackTitle: "Vendor",
    subtitle: "Vendor details",
    fields: {
      profileId: "Profile ID",
      userId: "User ID",
      restaurants: "Restaurants",
      moderation: "Moderation",
    },
    deleteVendor: "Delete vendor",
  },
  dialogs: {
    deleteTitle: "Delete this vendor?",
    deleteMessage: "Are you sure you want to delete this vendor? Their restaurants will be hidden.",
    deleteConfirm: "Delete vendor",
    approveTitle: "Approve this vendor?",
    approveMessage:
      "Once approved, the vendor can use the dashboard and manage their venues.",
    rejectTitle: "Reject vendor",
    rejectMessage:
      "Give a reason for the rejection so the application doesn't feel silently dismissed.",
    rejectReasonTitle: "Rejection reason",
  },
  messages: {
    approved: "Vendor approved",
    rejected: "Vendor rejected",
    batchDone: {
      one: "Done: {count} vendor",
      few: "Done: {count} vendors",
      many: "Done: {count} vendors",
    },
  },
  errors: {
    loadFailed: "Could not load vendors",
    detailsFailed: "Could not load vendor details",
    deleteFailed: "Could not delete the vendor",
    approveFailed: "Could not approve the vendor",
    rejectFailed: "Could not reject the vendor",
    batchFailed: "Bulk action failed",
  },
} as const;
