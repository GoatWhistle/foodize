export const adminUsers = {
  searchPlaceholder: "Search by name or phone",
  allRoles: "All roles",
  emptyTitle: "No users yet",
  card: {
    noName: "No name",
    noPhone: "No phone number",
    active: "Active",
    blocked: "Blocked",
    blockTitle: "Block",
  },
  modal: {
    fallbackTitle: "User",
    subtitle: "Profile details",
    roleManagement: "Role management",
    makeAdmin: "Make admin",
    unblock: "Unblock",
    block: "Block user",
  },
  dialogs: {
    blockTitle: "Block this user?",
    blockMessage:
      "The user will not be able to use their account until you unblock them.",
    blockConfirm: "Block",
    makeAdminTitle: "Make this user an admin?",
    makeAdminMessage:
      "Are you sure you want to grant this user administrator rights?",
    makeAdminConfirm: "Make admin",
    setPresetTitle: "Set role: {preset}?",
    setPresetMessage: "The user's permissions will be replaced with the \"{preset}\" preset.",
    setPresetConfirm: "Change",
    batchDeactivateTitle: {
      one: "Deactivate {count} user?",
      few: "Deactivate {count} users?",
      many: "Deactivate {count} users?",
    },
    batchDeactivateMessage: "They will lose access to their accounts.",
    batchDeactivateConfirm: "Deactivate",
  },
  messages: {
    batchDone: {
      one: "Done: {count} user",
      few: "Done: {count} users",
      many: "Done: {count} users",
    },
  },
  errors: {
    loadFailed: "Could not load users",
    detailsFailed: "Could not load user details",
    blockFailed: "Could not block the user",
    unblockFailed: "Could not unblock the user",
    roleChangeFailed: "Could not change the role",
    batchFailed: "Bulk action failed",
  },
} as const;
