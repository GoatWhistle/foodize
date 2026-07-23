export const apiErrorsByDetail = {
  "Invalid phone number or password": "Invalid phone number or password",
  "Invalid credentials": "Invalid phone number or password",
  "Not authenticated": "Authentication required",
  "Token has expired": "Session expired, please sign in again",
  "Invalid token": "Invalid authorization token",
  "Token has been invalidated": "Session ended, please sign in again",
  "Account is deactivated": "Account is deactivated",
  "Refresh token missing": "Authentication required",
  "Refresh token has expired": "Session expired, please sign in again",
  "Invalid refresh token": "Invalid authorization token",
  "Refresh token already used": "Token already used, please sign in again",
  "Access denied": "Access denied",
  "Bad request": "Bad request",
  "You have already reviewed this restaurant": "You have already reviewed this restaurant",
  "You can publish up to 5 reviews for one restaurant":
    "You can publish up to 5 reviews for one restaurant",
  "Duplicate entry: this information already exists":
    "You have already reviewed this restaurant",
  "You can only review restaurants where you have a completed order":
    "You can only leave a review after a completed order",
  "You already have a pending request for this restaurant.":
    "You already have a pending request for this restaurant",
  "Your previous request was rejected. Please try again after 24 hours.":
    "Your previous request was rejected. You can reapply in 24 hours",
  "You are already a staff member at this restaurant.":
    "You are already a staff member at this restaurant",
  "You are not a hiring restaurant.": "This restaurant is not accepting staff requests",
  "Staff request not found": "Request not found",
  "Restaurant is already in favorites": "Restaurant is already in favorites",
  "Favorite not found": "Favorite entry not found",
  "Order not found": "Order not found",
  "You do not have permission to access this order":
    "You do not have access to this order",
  "One or more menu items were not found": "One or more items were not found",
  "One or more menu items do not belong to the specified restaurant":
    "One or more items do not belong to this restaurant",
  "Order can only be cancelled when in PENDING or ACCEPTED status":
    "An order can only be cancelled while pending or being prepared",
  "Invalid order status transition": "Invalid order status change",
  "One or more menu items are not available":
    "One or more items are unavailable for ordering",
  "Order can only be completed when in READY status":
    "Pickup can only be confirmed once the order is ready",
  "Ready time is required to accept an order": "Specify the order ready time",
  "Idempotency key was used with different payload": "Request conflict, please try again",
  "Idempotent request is still being processed":
    "The request is already being processed, please wait",
  "Restaurant not found": "Restaurant not found",
  "Restaurant is currently closed": "The restaurant is currently closed",
  "Restaurant is temporarily not accepting orders":
    "The venue has temporarily paused accepting orders",
  "Duplicate options selected": "The same option was selected twice",
  "Selected option not found":
    "One of the selected options is no longer available. Refresh the menu and try again",
  "Selected option does not belong to menu item":
    "One of the selected options does not belong to this item",
  "Selected option is not available": "One of the selected options is currently unavailable",
  "Not enough options selected": "Select the required options for this item",
  "Too many options selected": "Too many options selected for this item",
  "Only one option can be selected": "Only one option can be selected in this group",
  "User already has a vendor profile": "You already have a vendor profile",
  "User with this phone number already exists":
    "A user with this phone number already exists",
  "Menu item not found": "Item not found",
  "Promo code not found": "Promo code not found",
  "Promo code is not active or has expired": "Promo code is inactive or expired",
  "Promo code is not valid for this restaurant":
    "Promo code is not valid for this restaurant",
  "Promo code usage limit has been reached": "Promo code usage limit reached",
  "Promo code already exists": "A promo code with this code already exists",
  "Only VENDOR and STAFF can access orders": "Access is limited to vendors and staff",
  "Restaurant with this address already exists":
    "A restaurant with this address already exists",
  "Password must contain at least one letter": "Password must contain at least one letter",
  "Password must contain at least one digit or special character":
    "Password must contain at least one digit or special character",
  "Only JPEG, PNG or WebP images are supported":
    "Only JPEG, PNG or WebP images are supported",
  "File is too large (maximum 5 MB)": "File is too large (maximum 5 MB)",
  "Unsupported file type": "Unsupported file type",
  "Empty file": "Empty file",
  "Admin access required": "Administrator rights are required",
  "Could not generate unique restaurant display id":
    "Could not create the restaurant, please try again",
  "File not found": "File not found",
  "Insufficient permissions to access vendor profile":
    "You do not have access to this vendor profile",
  "Invalid Telegram code": "Invalid Telegram code",
  "Invalid auth_date": "Telegram authorization data is invalid",
  "Invalid bot secret": "Bot authorization error",
  "Invalid user payload": "Invalid user data",
  "Missing auth_date": "Telegram authorization data is incomplete",
  "Missing hash": "Telegram authorization data is incomplete",
  "Missing user id": "Telegram authorization data is incomplete",
  "Not allowed to assign these permissions":
    "You do not have rights to assign these permissions",
  "Not authorized to manage this restaurant":
    "You do not have rights to manage this restaurant",
  "Notification not found": "Notification not found",
  "Option group not found": "Option group not found",
  "Option not found": "Option not found",
  "Password is already set": "A password is already set",
  "Pickup time is too soon for the current restaurant load":
    "The venue cannot cook by that time. Please pick a later time",
  "Restaurant is closed at requested pickup time":
    "The venue is closed at the requested time. Please pick another time",
  "Restaurant is currently closed (outside working hours)":
    "The venue is currently closed — outside working hours",
  "Restaurant with this address or display id already exists":
    "A restaurant with this address already exists",
  "Review not found": "Review not found",
  "Session has expired, please log in again": "Session expired, please sign in again",
  "Staff profile not found": "Staff profile not found",
  "Too many code requests": "Too many code requests, please try again later",
  "Too many failed attempts. Try again later.":
    "Too many failed attempts. Please try again later",
  "User not found": "User not found",
  "Vendor account is not approved yet": "The vendor profile is not approved yet",
  "Vendor profile is not approved": "The vendor profile is not approved",
  "Vendor profile not found": "Vendor profile not found",
  "Wrong password": "Wrong password",
  "You don't have permission to manage this request":
    "You do not have rights to manage this request",
  "initData already used": "Authorization data already used, please reopen the app",
  "initData expired": "Authorization data expired, please reopen the app",
  "min_selected cannot be greater than max_selected":
    "The minimum number of options cannot exceed the maximum",
  promo_first_order_only: "This promo code is valid for the first order only",
  promo_min_order_amount: "The order total is below the minimum for this promo code",
} as const;

export const apiErrorsByStatus = {
  "400": "Bad request",
  "401": "Authentication required",
  "403": "Access denied",
  "404": "Resource not found",
  "409": "Data conflict",
  "422": "Validation error",
  "429": "Too many requests, please try again later",
  "500": "Internal server error",
  "502": "Server temporarily unavailable",
  "503": "Service temporarily unavailable",
} as const;
