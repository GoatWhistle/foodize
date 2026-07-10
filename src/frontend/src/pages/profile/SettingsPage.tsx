import SharedSettingsPage from "@shared/pages/SettingsPage/SettingsPage";
import { ROUTES } from "../../constants/routes";

const SettingsPage = () => (
  <SharedSettingsPage
    routes={{
      profile: ROUTES.PROFILE,
      terms: "/legal/terms",
      privacy: "/legal/privacy",
    }}
    showPasswordChange
  />
);

export default SettingsPage;
