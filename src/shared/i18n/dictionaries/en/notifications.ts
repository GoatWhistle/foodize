export const notifications = {
  orderReady: {
    title: "Your order is ready!",
    message: "Your order from {restaurant} is ready for pickup. Enjoy your meal!",
  },
  orderStatusChanged: {
    title: "Order status changed",
    message: "Your order from {restaurant} is now: {status}.",
  },
  feedbackRequested: {
    title: "Rate your order",
    message:
      "How was your order from {restaurant}? Please leave a review in the mini app — it helps the restaurant improve!",
  },
  orderPlaced: {
    title: "Order at {restaurant} accepted",
    message: "Your order for {total} ₽ has been placed and is awaiting confirmation.",
  },
  orderStatus: {
    PENDING: "Pending",
    ACCEPTED: "Accepted",
    READY: "Ready",
    COMPLETED: "Completed",
    CANCELLED: "Cancelled",
  },
} as const;
