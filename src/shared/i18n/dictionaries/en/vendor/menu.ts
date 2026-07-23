export const vendorRestaurants = {
  sectionTitle: "My venues",
  waitApproval: "Wait for your profile to be approved",
  newFormTitle: "New venue",
  emptyTitle: "No venues",
  emptySubtitle: "Add your first venue",
  placeholders: {
    avgPrepTime: "Average prep time, minutes",
    maxActiveOrders: "Soft limit on active orders",
  },
} as const;

export const vendorMenu = {
  sectionTitle: "Menu items",
  addItem: "Item",
  emptyTitle: "Menu is empty",
  emptySubtitle: "Add your first item",
  stopBadge: "STOP",
  on: "ON",
  off: "OFF",
  availableToggleOn: "Available (make unavailable)",
  availableToggleOff: "Unavailable (make available)",
  form: {
    editTitle: "Edit",
    newTitle: "New item",
  },
  photo: {
    alt: "Dish photo",
    replace: "Replace photo",
    upload: "Upload photo",
    remove: "Remove photo",
    hint: "JPEG, PNG or WebP · up to 5 MB",
  },
  options: {
    title: "Dish options",
    hint: "For example: no onion, extra meat",
    addGroup: "Group",
    addOption: "Option",
    groupNamePlaceholder: "Group name",
    optionPlaceholder: "Option",
    maxChoicesPlaceholder: "Max choices",
    multiple: "Multiple",
    single: "Single choice",
    required: "Required choice",
  },
  messages: {
    itemUpdated: "Item updated",
    itemAdded: "Item added",
    deleteTitle: "Delete this item?",
    deleteMessage: "Are you sure you want to remove this item from the menu?",
  },
  errors: {
    saveFailed: "Failed to save",
    deleteFailed: "Could not delete the item",
  },
} as const;
