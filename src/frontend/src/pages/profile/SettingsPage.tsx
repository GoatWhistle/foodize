import { SettingsPage as SharedSettingsPage } from "@shared/pages/SettingsPage/SettingsPage";
import { ROUTES } from "../../constants/routes";

export const SettingsPage = () => (
  <SharedSettingsPage
    routes={{
      profile: ROUTES.PROFILE,
      terms: "/legal/terms",
      privacy: "/legal/privacy",
    }}
    showPasswordChange
  />
);
