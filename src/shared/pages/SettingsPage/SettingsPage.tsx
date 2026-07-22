import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { CaretRightIcon, CheckIcon, FileTextIcon, ShieldIcon } from "@phosphor-icons/react";
import { ThemeSwitcher } from "@shared/components/ThemeSwitcher/ThemeSwitcher";
import { LanguageSwitcher } from "@shared/components/LanguageSwitcher/LanguageSwitcher";
import { useProfilePage } from "@shared/hooks/useProfilePage";
import { useTranslation } from "@shared/i18n/useTranslation";
import s from "./SettingsPage.module.css";

interface BackButtonControl {
  show: () => void;
  hide: () => void;
  onClick: (handler: () => void) => void;
  offClick: (handler: () => void) => void;
}

interface SettingsPageRoutes {
  profile?: string;
  terms?: string;
  privacy?: string;
}

interface SettingsPageProps {
  routes?: SettingsPageRoutes;
  BackButton?: BackButtonControl | null;
  showPasswordChange?: boolean;
  pageClassName?: string | undefined;
}

export const SettingsPage = ({
  routes = {},
  BackButton = null,
  showPasswordChange = true,
  pageClassName = "",
}: SettingsPageProps) => {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const {
    editForm,
    setEditForm,
    editLoading,
    editError,
    editSuccess,
    startEdit,
    handleSave,
    pwForm,
    setPwForm,
    pwLoading,
    pwError,
    pwSuccess,
    handlePasswordChange,
  } = useProfilePage();

  useEffect(() => {
    startEdit();
  }, [startEdit]);

  useEffect(() => {
    if (!BackButton) return;
    BackButton.show();
    const handler = () => { void navigate(routes.profile ?? "/profile"); };
    BackButton.onClick(handler);
    return () => { BackButton.offClick(handler); BackButton.hide(); };
  }, [navigate, BackButton, routes.profile]);

  const navTo = (path?: string) => {
    if (path) void navigate(path);
  };

  return (
    <div className={`${s['page']}${pageClassName ? ` ${pageClassName}` : ""}`}>
      <h1 className={s['title']}>{t("profile.settings.title")}</h1>

      <section className={s['section']}>
        <div className={s['sectionTitle']}>{t("profile.settings.appearance")}</div>
        <div className={s['card']}>
          <ThemeSwitcher />
          <LanguageSwitcher />
        </div>
      </section>

      <section className={s['section']}>
        <div className={s['sectionTitle']}>{t("profile.settings.profileData")}</div>
        <div className={s['card']}>
          <label className={s['label']}>{t("common.labels.displayName")}</label>
          <input className="form-input" placeholder={t("common.labels.displayName")} value={editForm.name} onChange={(e) => { setEditForm((f) => ({ ...f, name: e.target.value })); }} />
          <label className={s['label']}>{t("common.labels.fullName")}</label>
          <div className={s['row']}>
            <input className="form-input" placeholder={t("common.labels.name")} value={editForm.first_name} onChange={(e) => { setEditForm((f) => ({ ...f, first_name: e.target.value })); }} />
            <input className="form-input" placeholder={t("common.labels.surname")} value={editForm.last_name} onChange={(e) => { setEditForm((f) => ({ ...f, last_name: e.target.value })); }} />
          </div>
          <input className="form-input" placeholder={t("common.labels.patronymic")} value={editForm.middle_name} onChange={(e) => { setEditForm((f) => ({ ...f, middle_name: e.target.value })); }} />
          <label className={s['label']}>{t("common.labels.email")}</label>
          <input className="form-input" type="email" placeholder="Email" value={editForm.email} onChange={(e) => { setEditForm((f) => ({ ...f, email: e.target.value })); }} />
          {editError && <div className="form-error">{editError}</div>}
          {editSuccess && <div className={s['success']}><CheckIcon size={14} weight="bold" /> {t("profile.settings.saved")}</div>}
          <button className="btn btn-primary" onClick={() => { void handleSave(); }} disabled={editLoading} style={{ marginTop: 4 }}>
            {editLoading ? t("common.actions.saving") : t("common.actions.save")}
          </button>
        </div>
      </section>

      {showPasswordChange && (
        <section className={s['section']}>
          <div className={s['sectionTitle']}>{t("profile.settings.security")}</div>
          <form className={s['card']} onSubmit={(e) => { void handlePasswordChange(e); }}>
            <label className={s['label']}>{t("profile.settings.currentPassword")}</label>
            <input className="form-input" type="password" placeholder={t("profile.settings.currentPassword")} value={pwForm.old_password} onChange={(e) => { setPwForm((f) => ({ ...f, old_password: e.target.value })); }} required />
            <label className={s['label']}>{t("profile.settings.newPassword")}</label>
            <input className="form-input" type="password" placeholder={t("profile.settings.newPasswordHint")} value={pwForm.new_password} onChange={(e) => { setPwForm((f) => ({ ...f, new_password: e.target.value })); }} minLength={8} required />
            {pwError && <div className="form-error">{pwError}</div>}
            {pwSuccess && <div className={s['success']}><CheckIcon size={14} weight="bold" /> {t("profile.settings.passwordChanged")}</div>}
            <button className="btn btn-primary" type="submit" disabled={pwLoading} style={{ marginTop: 4 }}>
              {pwLoading ? t("profile.settings.changingPassword") : t("profile.settings.changePassword")}
            </button>
          </form>
        </section>
      )}

      <section className={s['section']}>
        <div className={s['sectionTitle']}>{t("profile.settings.documents")}</div>
        <button className={s['menuItem']} onClick={() => { navTo(routes.terms ?? "/legal/terms"); }}>
          <span className={s['menuItemLeft']}>
            <FileTextIcon size={20} weight="bold" />
            {t("profile.settings.terms")}
          </span>
          <CaretRightIcon size={16} color="var(--text-3)" />
        </button>
        <button className={s['menuItem']} onClick={() => { navTo(routes.privacy ?? "/legal/privacy"); }}>
          <span className={s['menuItemLeft']}>
            <ShieldIcon size={20} weight="bold" />
            {t("profile.settings.privacy")}
          </span>
          <CaretRightIcon size={16} color="var(--text-3)" />
        </button>
      </section>
    </div>
  );
};
