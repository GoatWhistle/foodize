import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { CaretRightIcon, CheckIcon, FileTextIcon, ShieldIcon } from "@phosphor-icons/react";
import { ThemeSwitcher } from "@shared/components/ThemeSwitcher/ThemeSwitcher";
import { useProfilePage } from "@shared/hooks/useProfilePage";
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
      <h1 className={s['title']}>Настройки</h1>

      <section className={s['section']}>
        <div className={s['sectionTitle']}>Оформление</div>
        <div className={s['card']}>
          <ThemeSwitcher />
        </div>
      </section>

      <section className={s['section']}>
        <div className={s['sectionTitle']}>Данные профиля</div>
        <div className={s['card']}>
          <label className={s['label']}>Отображаемое имя</label>
          <input className="form-input" placeholder="Отображаемое имя" value={editForm.name} onChange={(e) => { setEditForm((f) => ({ ...f, name: e.target.value })); }} />
          <label className={s['label']}>ФИО</label>
          <div className={s['row']}>
            <input className="form-input" placeholder="Имя" value={editForm.first_name} onChange={(e) => { setEditForm((f) => ({ ...f, first_name: e.target.value })); }} />
            <input className="form-input" placeholder="Фамилия" value={editForm.last_name} onChange={(e) => { setEditForm((f) => ({ ...f, last_name: e.target.value })); }} />
          </div>
          <input className="form-input" placeholder="Отчество" value={editForm.middle_name} onChange={(e) => { setEditForm((f) => ({ ...f, middle_name: e.target.value })); }} />
          <label className={s['label']}>Email</label>
          <input className="form-input" type="email" placeholder="Email" value={editForm.email} onChange={(e) => { setEditForm((f) => ({ ...f, email: e.target.value })); }} />
          {editError && <div className="form-error">{editError}</div>}
          {editSuccess && <div className={s['success']}><CheckIcon size={14} weight="bold" /> Данные сохранены</div>}
          <button className="btn btn-primary" onClick={() => { void handleSave(); }} disabled={editLoading} style={{ marginTop: 4 }}>
            {editLoading ? "Сохраняем..." : "Сохранить"}
          </button>
        </div>
      </section>

      {showPasswordChange && (
        <section className={s['section']}>
          <div className={s['sectionTitle']}>Безопасность</div>
          <form className={s['card']} onSubmit={(e) => { void handlePasswordChange(e); }}>
            <label className={s['label']}>Текущий пароль</label>
            <input className="form-input" type="password" placeholder="Текущий пароль" value={pwForm.old_password} onChange={(e) => { setPwForm((f) => ({ ...f, old_password: e.target.value })); }} required />
            <label className={s['label']}>Новый пароль</label>
            <input className="form-input" type="password" placeholder="Минимум 8 символов" value={pwForm.new_password} onChange={(e) => { setPwForm((f) => ({ ...f, new_password: e.target.value })); }} minLength={8} required />
            {pwError && <div className="form-error">{pwError}</div>}
            {pwSuccess && <div className={s['success']}><CheckIcon size={14} weight="bold" /> Пароль изменён</div>}
            <button className="btn btn-primary" type="submit" disabled={pwLoading} style={{ marginTop: 4 }}>
              {pwLoading ? "Меняем..." : "Сменить пароль"}
            </button>
          </form>
        </section>
      )}

      <section className={s['section']}>
        <div className={s['sectionTitle']}>Документы</div>
        <button className={s['menuItem']} onClick={() => { navTo(routes.terms ?? "/legal/terms"); }}>
          <span className={s['menuItemLeft']}>
            <FileTextIcon size={20} weight="bold" />
            Условия сервиса
          </span>
          <CaretRightIcon size={16} color="var(--text-3)" />
        </button>
        <button className={s['menuItem']} onClick={() => { navTo(routes.privacy ?? "/legal/privacy"); }}>
          <span className={s['menuItemLeft']}>
            <ShieldIcon size={20} weight="bold" />
            Политика конфиденциальности
          </span>
          <CaretRightIcon size={16} color="var(--text-3)" />
        </button>
      </section>
    </div>
  );
};
