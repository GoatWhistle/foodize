import { common as commonRu } from "./ru/common";
import { enums as enumsRu } from "./ru/enums";
import { apiErrors as apiErrorsRu } from "./ru/apiErrors";
import { order as orderRu } from "./ru/order";
import { catalog as catalogRu } from "./ru/catalog";
import { profile as profileRu } from "./ru/profile";
import { auth as authRu } from "./ru/auth";
import { admin as adminRu } from "./ru/admin";
import { vendor as vendorRu } from "./ru/vendor";
import { staff as staffRu } from "./ru/staff";
import { loyalty as loyaltyRu } from "./ru/loyalty";
import { legal as legalRu } from "./ru/legal";
import { notifications as notificationsRu } from "./ru/notifications";

import { common as commonEn } from "./en/common";
import { enums as enumsEn } from "./en/enums";
import { apiErrors as apiErrorsEn } from "./en/apiErrors";
import { order as orderEn } from "./en/order";
import { catalog as catalogEn } from "./en/catalog";
import { profile as profileEn } from "./en/profile";
import { auth as authEn } from "./en/auth";
import { admin as adminEn } from "./en/admin";
import { vendor as vendorEn } from "./en/vendor";
import { staff as staffEn } from "./en/staff";
import { loyalty as loyaltyEn } from "./en/loyalty";
import { legal as legalEn } from "./en/legal";
import { notifications as notificationsEn } from "./en/notifications";

import type { Language, TranslationTree } from "../types";

export const dictionaries: Record<Language, TranslationTree> = {
  ru: {
    common: commonRu,
    enums: enumsRu,
    apiErrors: apiErrorsRu,
    order: orderRu,
    catalog: catalogRu,
    profile: profileRu,
    auth: authRu,
    admin: adminRu,
    vendor: vendorRu,
    staff: staffRu,
    loyalty: loyaltyRu,
    legal: legalRu,
    notifications: notificationsRu,
  },
  en: {
    common: commonEn,
    enums: enumsEn,
    apiErrors: apiErrorsEn,
    order: orderEn,
    catalog: catalogEn,
    profile: profileEn,
    auth: authEn,
    admin: adminEn,
    vendor: vendorEn,
    staff: staffEn,
    loyalty: loyaltyEn,
    legal: legalEn,
    notifications: notificationsEn,
  },
};
