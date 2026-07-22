import { describe, it, expect, afterEach } from "vitest";
import {
  ALL_PERMISSIONS,
  normalizePermissions,
  hasPermission,
  inferPermissionPreset,
  permissionLabel,
  permissionPresetName,
  permissionPresetLabel,
  formatPermissions,
} from "@shared/utils/permissions";
import { t } from "@shared/i18n/useTranslation";
import { useLanguageStore } from "@shared/store/useLanguageStore";

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
  afterEach(() => {
    useLanguageStore.setState({ language: "ru" });
  });

  it("maps preset to its localized label", () => {
    expect(permissionPresetLabel(["admin.access"])).toBe(
      t("enums.permissionPreset.ADMIN"),
    );
    expect(permissionPresetLabel(["vendors.read_own"])).toBe(
      t("enums.permissionPreset.VENDOR"),
    );
    expect(permissionPresetLabel([])).toBe(t("enums.permissionPreset.CUSTOMER"));
  });

  it("follows the active language", () => {
    useLanguageStore.setState({ language: "ru" });
    const ru = permissionPresetLabel(["admin.access"]);
    useLanguageStore.setState({ language: "en" });
    const en = permissionPresetLabel(["admin.access"]);
    expect(ru).toBe("Администратор");
    expect(en).toBe("Administrator");
  });
});

describe("permissionPresetName", () => {
  it("resolves every preset to a non-key label", () => {
    for (const preset of ["CUSTOMER", "VENDOR", "STAFF", "ADMIN"] as const) {
      const label = permissionPresetName(preset);
      expect(label).toBe(t(`enums.permissionPreset.${preset}`));
      expect(label).not.toBe(`enums.permissionPreset.${preset}`);
    }
  });
});

describe("permissionLabel", () => {
  it("resolves every known permission to a translated label", () => {
    for (const permission of ALL_PERMISSIONS) {
      const label = permissionLabel(permission);
      expect(label).toBe(t(`enums.permission.${permission}`));
      expect(label).not.toBe(`enums.permission.${permission}`);
    }
  });

  it("keeps an unknown permission key as-is", () => {
    expect(permissionLabel("custom.thing")).toBe("custom.thing");
  });
});

describe("formatPermissions", () => {
  it("maps known permissions to labels and joins them", () => {
    expect(formatPermissions(["menu.manage", "orders.create"])).toBe(
      `${t("enums.permission.menu.manage")}, ${t("enums.permission.orders.create")}`,
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
