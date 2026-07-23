import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  CookingPotIcon,
  ReceiptIcon,
  ShieldCheckIcon,
  SparkleIcon,
  StorefrontIcon,
  UserCircleIcon,
  UserIcon,
} from '@phosphor-icons/react';

import { ROUTES } from '../../constants/routes';
import { useAccountRoles } from '../../hooks/useAccountRoles';
import { useTranslation } from '@shared/i18n/useTranslation';

export const AccountMenu = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const roles = useAccountRoles(open);

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (event: PointerEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false);
    };
    document.addEventListener('pointerdown', onPointerDown);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('pointerdown', onPointerDown);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [open]);

  const go = (path: string) => {
    setOpen(false);
    void navigate(path);
  };

  const rolesReady = !roles.checkingVendor && !roles.checkingStaff;
  const showVendorDashboard = rolesReady && (roles.isVendor || roles.isAdmin);
  const showBecomeVendor = rolesReady && !roles.isVendor && !roles.isAdmin;
  const hasManagementItems = rolesReady && (roles.isStaff || roles.isAdmin || showVendorDashboard);

  return (
    <div className="account-menu" ref={containerRef}>
      <button
        className="account-menu-trigger"
        aria-label={t('profile.nav.account')}
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => { setOpen((value) => !value); }}
      >
        <UserCircleIcon size={24} weight="bold" />
      </button>
      {open && (
        <div className="account-menu-dropdown" role="menu">
          <button role="menuitem" className="account-menu-item" onClick={() => { go(ROUTES.PROFILE); }}>
            <UserIcon size={18} weight="bold" />
            {t('profile.nav.profile')}
          </button>
          <button role="menuitem" className="account-menu-item" onClick={() => { go(ROUTES.ORDERS); }}>
            <ReceiptIcon size={18} weight="bold" />
            {t('profile.page.myOrders')}
          </button>
          {hasManagementItems && <div className="account-menu-divider" />}
          {rolesReady && roles.isStaff && (
            <button role="menuitem" className="account-menu-item" onClick={() => { go(ROUTES.STAFF_DASHBOARD); }}>
              <CookingPotIcon size={18} weight="bold" />
              {t('profile.roles.staffDashboard')}
            </button>
          )}
          {showVendorDashboard && roles.canOpenVendorDashboard && (
            <button role="menuitem" className="account-menu-item" onClick={() => { go(ROUTES.VENDOR_DASHBOARD); }}>
              <StorefrontIcon size={18} weight="bold" />
              {t('profile.roles.vendorDashboard')}
            </button>
          )}
          {showVendorDashboard && !roles.canOpenVendorDashboard && (
            <div className="account-menu-item account-menu-item-muted">
              <StorefrontIcon size={18} weight="bold" />
              <span>
                {t('profile.roles.vendorDashboard')}
                <span className="account-menu-subtext">{t('profile.roles.vendorPending')}</span>
              </span>
            </div>
          )}
          {rolesReady && roles.isAdmin && (
            <button role="menuitem" className="account-menu-item" onClick={() => { go(ROUTES.ADMIN); }}>
              <ShieldCheckIcon size={18} weight="bold" />
              {t('profile.page.adminPanelShort')}
            </button>
          )}
          {showBecomeVendor && (
            <>
              <div className="account-menu-divider" />
              <button
                role="menuitem"
                className="account-menu-item account-menu-item-muted"
                disabled={roles.vendorLoading}
                onClick={() => { void roles.becomeVendor(); }}
              >
                <SparkleIcon size={18} weight="bold" />
                {roles.vendorLoading ? t('common.states.loading') : t('profile.roles.becomeVendor')}
              </button>
              {roles.vendorError && <div className="account-menu-error">{roles.vendorError}</div>}
            </>
          )}
        </div>
      )}
    </div>
  );
};
