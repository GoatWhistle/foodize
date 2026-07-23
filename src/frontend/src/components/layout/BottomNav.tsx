import { useLocation, useNavigate } from 'react-router-dom';
import { ReceiptIcon, ShoppingCartIcon, StorefrontIcon, UserIcon } from '@phosphor-icons/react';

import { BottomNav as SharedBottomNav } from '@shared/components/BottomNav/BottomNav';
import type { BottomNavTab } from '@shared/components/BottomNav/BottomNav';
import { ROUTES } from '../../constants/routes';
import { useTranslation } from '@shared/i18n/useTranslation';

interface BottomNavProps {
  cartCount: number;
  onCartClick: () => void;
  isAuthenticated: boolean;
}

export const BottomNav = ({ cartCount, onCartClick, isAuthenticated }: BottomNavProps) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { pathname } = useLocation();

  const isActive = (path: string): boolean =>
    path === ROUTES.HOME ? pathname === ROUTES.HOME : pathname.startsWith(path);

  const goTo = (path: string) => {
    void navigate(isAuthenticated || path === ROUTES.HOME ? path : ROUTES.LOGIN);
  };

  const tabs: BottomNavTab[] = [
    {
      key: 'home',
      icon: StorefrontIcon,
      label: t('profile.nav.restaurants'),
      active: isActive(ROUTES.HOME),
      onSelect: () => { goTo(ROUTES.HOME); },
    },
    {
      key: 'orders',
      icon: ReceiptIcon,
      label: t('profile.nav.orders'),
      active: isActive(ROUTES.ORDERS),
      onSelect: () => { goTo(ROUTES.ORDERS); },
    },
    {
      key: 'cart',
      icon: ShoppingCartIcon,
      label: t('profile.nav.cart'),
      disabled: cartCount === 0,
      ...(cartCount > 0 ? { badge: cartCount > 9 ? '9+' : String(cartCount) } : {}),
      onSelect: onCartClick,
    },
    {
      key: 'profile',
      icon: UserIcon,
      label: t('profile.nav.profile'),
      active: isActive(ROUTES.PROFILE),
      onSelect: () => { goTo(ROUTES.PROFILE); },
    },
  ];

  return <SharedBottomNav tabs={tabs} hideOnDesktop />;
};
