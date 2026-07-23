export const vendorSchedule = {
  sectionTitle: "Opening hours",
  saving: "Saving...",
  dayOff: "Day off",
  dayOffShort: "Off",
  errors: {
    loadFailed: "Could not load the schedule",
    saveFailed: "Could not save the schedule",
  },
} as const;

export const vendorSettings = {
  sectionTitle: "Restaurant settings",
  descriptionLabel: "Restaurant description",
  descriptionPlaceholder: "A short description of the venue for guests...",
  isOpen: "Venue is open",
  orderingPaused: "Pause order intake",
  pausedUntil: "Paused until",
  avgPrepTime: "Average prep time, minutes",
  maxActiveOrders: "Soft limit on active orders",
  noLimit: "No limit",
  isHiring: "Hiring staff",
  cover: {
    title: "Restaurant cover",
    alt: "Restaurant cover",
    loading: "Loading…",
    replace: "Replace cover",
    upload: "Upload cover",
    hint: "JPEG, PNG or WebP · up to 5 MB",
    description:
      "Shown as a wide banner at the top of the restaurant page. A landscape photo works best (an interior shot or a close-up of a dish) at least 1200 px wide — portrait images will be cropped heavily.",
    uploadFailed: "Could not upload the photo",
    deleteFailed: "Could not delete the photo",
  },
  errors: {
    nameRequired: "Enter the venue name",
    addressRequired: "Enter the venue address",
    createFailed: "Failed to create",
    updateFailed: "Failed to update",
  },
} as const;

export const vendorStaff = {
  tabs: {
    members: "Staff",
    requests: "Requests",
  },
  emptyMembersTitle: "No staff",
  emptyMembersSubtitle: "Accepted staff will appear here",
  emptyRequestsTitle: "No requests",
  emptyRequestsSubtitle: "Requests will appear here",
  noPhone: "No phone number",
  idFallback: "ID: {id}",
  requestUser: "User #{id}",
  confirmRemove: "Dismiss this employee?",
} as const;
