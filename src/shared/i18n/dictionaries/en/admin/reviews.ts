export const adminReviews = {
  allRatings: "All",
  emptyTitle: "No reviews yet",
  verifiedPurchase: "Verified purchase",
  deleteTitle: "Delete review",
  dialogs: {
    deleteTitle: "Delete this review?",
    deleteMessage: "Are you sure you want to delete this review? It will disappear from the restaurant page.",
    deleteConfirm: "Delete review",
    batchDeleteTitle: {
      one: "Delete {count} review?",
      few: "Delete {count} reviews?",
      many: "Delete {count} reviews?",
    },
    batchDeleteMessage: "This action cannot be undone.",
  },
  messages: {
    batchDeleted: {
      one: "Deleted: {count} review",
      few: "Deleted: {count} reviews",
      many: "Deleted: {count} reviews",
    },
  },
  errors: {
    loadFailed: "Could not load reviews",
    deleteFailed: "Could not delete the review",
    batchDeleteFailed: "Deletion failed",
  },
} as const;

export const adminAudit = {
  allActions: "All actions",
  allEntities: "All entities",
  entityVendor: "Vendor",
  entityRestaurant: "Restaurant",
  entity: "Entity: {id}",
  emptyTitle: "No logs yet",
  actions: {
    APPROVE_VENDOR: "Vendor approved",
    REJECT_VENDOR: "Vendor rejected",
    DEACTIVATE_VENDOR: "Vendor deactivated",
    APPROVE_RESTAURANT: "Restaurant approved",
    REJECT_RESTAURANT: "Restaurant rejected",
    DEACTIVATE_USER: "User deactivated",
    ACTIVATE_USER: "User activated",
    UPDATE_PERMISSIONS: "User permissions changed",
    CREATE_MENU_ITEM: "Menu item created",
    UPDATE_MENU_ITEM: "Menu item updated",
    DELETE_MENU_ITEM: "Menu item deleted",
    TOGGLE_MENU_ITEM: "Menu item availability changed",
    CREATE_PROMO: "Promo code created",
    DEACTIVATE_PROMO: "Promo code deactivated",
    FORCE_CANCEL_ORDER: "Order cancelled by an admin",
    DELETE_REVIEW: "Review deleted",
  },
  errors: {
    loadFailed: "Could not load the logs",
  },
} as const;
