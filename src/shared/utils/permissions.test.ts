import { describe, it, expect } from "vitest";
import {
  normalizePermissions,
  hasPermission,
  inferPermissionPreset,
  permissionPresetLabel,
  formatPermissions,
} from "@shared/utils/permissions";

describe("normalizePermissions", () => {
  it("returns the array when given one", () => {
    expect(normalizePermissions(["a", "b"])).toEqual(["a", "b"]);
  });

  it("returns empty array for null/undefined", () => {
    expect(normalizePermissions(null)).toEqual([]);
    expect(normalizePermissions(undefined)).toEqual([]);
  });
});

describe("hasPermission", () => {
  it("returns true when the user has the permission", () => {
    expect(hasPermission({ permissions: ["menu.manage"] }, "menu.manage")).toBe(
      true,
    );
  });

  it("returns true when the user has admin access", () => {
    expect(hasPermission({ permissions: ["admin.access"] }, "menu.manage")).toBe(
      true,
    );
  });

  it("returns false when the user lacks the permission", () => {
    expect(hasPermission({ permissions: ["menu.read"] }, "menu.manage")).toBe(
      false,
    );
  });

  it("returns false for null/undefined user", () => {
    expect(hasPermission(null, "menu.manage")).toBe(false);
    expect(hasPermission(undefined, "menu.manage")).toBe(false);
  });
});

describe("inferPermissionPreset", () => {
  it("returns ADMIN when admin access present", () => {
    expect(inferPermissionPreset(["admin.access"])).toBe("ADMIN");
  });

  it("returns VENDOR when vendor read own present", () => {
    expect(inferPermissionPreset(["vendors.read_own"])).toBe("VENDOR");
  });

  it("returns STAFF when staff profile read present", () => {
    expect(inferPermissionPreset(["staff.profile_read"])).toBe("STAFF");
  });

  it("returns CUSTOMER by default", () => {
    expect(inferPermissionPreset(["menu.read"])).toBe("CUSTOMER");
    expect(inferPermissionPreset()).toBe("CUSTOMER");
  });
});

describe("permissionPresetLabel", () => {
  it("maps preset to its Russian label", () => {
    expect(permissionPresetLabel(["admin.access"])).toBe("Администратор");
    expect(permissionPresetLabel(["vendors.read_own"])).toBe("Вендор");
    expect(permissionPresetLabel([])).toBe("Клиент");
  });
});

describe("formatPermissions", () => {
  it("maps known permissions to Russian and joins them", () => {
    expect(formatPermissions(["menu.manage", "orders.create"])).toBe(
      "Меню: управление, Заказы: создание",
    );
  });

  it("keeps unknown permission keys as-is", () => {
    expect(formatPermissions(["custom.thing"])).toBe("custom.thing");
  });

  it("returns empty string for empty/nullish input", () => {
    expect(formatPermissions([])).toBe("");
    expect(formatPermissions(null)).toBe("");
  });
});
