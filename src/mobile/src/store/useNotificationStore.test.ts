import { useNotificationStore } from "@/store/useNotificationStore";

jest.mock("@/services/api", () => ({
  createNotificationWebSocket: jest.fn(),
}));

describe("useNotificationStore", () => {
  it("creates a bound notification store", () => {
    expect(typeof useNotificationStore.getState).toBe("function");
    expect(useNotificationStore.getState().unreadCount).toBe(0);
  });
});
