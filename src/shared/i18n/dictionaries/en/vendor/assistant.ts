export const vendorAdvisor = {
  insightsTitle: "Business analysis",
  analyzing: "Analyzing…",
  getInsights: "Get analysis",
  chatTitle: "Ask the analyst",
  inputPlaceholder: "For example: what should I add to the menu?",
  suggestions: {
    whatToAdd: "What should I add to the menu?",
    peakHours: "When are my peak hours?",
    unpopularItems: "Which items hardly sell?",
    raiseAov: "How can I raise the average order value?",
  },
  errors: {
    chatFailed: "Could not get a response. Check your connection and the model key.",
    insightsFailed: "Could not get the business analysis.",
  },
} as const;

export const vendorAssistant = {
  launcher: "Assistant",
  ariaLabel: "Order assistant",
  title: "Order assistant",
  intro: "Tell me what you'd like to order — I'll find it and help you check out.",
  inputPlaceholder: "What would you like to order?",
  sendAriaLabel: "Send message",
  suggestions: {
    cheapSpicyShaurma: "Where is spicy shawarma under 350?",
    twoBurgersAndCola: "I want two burgers and a cola",
    dessert: "What's for dessert?",
  },
  errors: {
    requestFailed: "Could not get a response. Please try again.",
  },
} as const;
