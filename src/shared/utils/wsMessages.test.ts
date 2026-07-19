import { describe, it, expect } from "vitest";
import {
  parseOrderMessage,
  parseNotificationMessage,
} from "@shared/utils/wsMessages";

describe("parseOrderMessage", () => {
  it("returns the order for a valid shape", () => {
    const data = { id: "o1", status: "PENDING", display_id: 42 };
    const result = parseOrderMessage(data);
    expect(result).toEqual(data);
  });

  it("returns null when id is missing", () => {
    expect(parseOrderMessage({ status: "PENDING", display_id: 42 })).toBeNull();
  });

  it("returns null when status is not a string", () => {
    expect(
      parseOrderMessage({ id: "o1", status: 5, display_id: 42 }),
    ).toBeNull();
  });

  it("returns null when display_id is not a number", () => {
    expect(
      parseOrderMessage({ id: "o1", status: "PENDING", display_id: "42" }),
    ).toBeNull();
  });

  it("returns null for empty object", () => {
    expect(parseOrderMessage({})).toBeNull();
  });
});

describe("parseNotificationMessage", () => {
  it("returns the notification for a valid shape", () => {
    const data = {
      id: "n1",
      type: "order_update",
      title: "Заказ",
      message: "Готов",
    };
    const result = parseNotificationMessage(data);
    expect(result).toEqual(data);
  });

  it("returns null when title is missing", () => {
    expect(
      parseNotificationMessage({
        id: "n1",
        type: "order_update",
        message: "Готов",
      }),
    ).toBeNull();
  });

  it("returns null when message is not a string", () => {
    expect(
      parseNotificationMessage({
        id: "n1",
        type: "order_update",
        title: "Заказ",
        message: 123,
      }),
    ).toBeNull();
  });

  it("returns null when type is missing", () => {
    expect(
      parseNotificationMessage({
        id: "n1",
        title: "Заказ",
        message: "Готов",
      }),
    ).toBeNull();
  });

  it("returns null for empty object", () => {
    expect(parseNotificationMessage({})).toBeNull();
  });
});
