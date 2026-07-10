import SharedSettingsPage from "@shared/pages/SettingsPage/SettingsPage";
import { getBackButton, getTelegramInitData } from "../../telegram/sdk";
import s from "./ProfilePage.module.css";

const isTelegramUser = (): boolean => {
  try {
    return getTelegramInitData().length > 0;
  } catch {
    return false;
  }
};

const SettingsPage = () => {
  const hasTelegramSession = isTelegramUser();

  return (
    <SharedSettingsPage
      routes={{
        profile: "/profile",
        terms: "/legal/terms",
        privacy: "/legal/privacy",
      }}
      BackButton={getBackButton()}
      showPasswordChange={!hasTelegramSession}
      pageClassName={s.page}
    />
  );
};

export default SettingsPage;
