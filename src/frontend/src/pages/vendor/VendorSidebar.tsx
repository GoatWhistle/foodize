import {
  ForkKnifeIcon,
  PackageIcon,
  GearIcon,
  ClockIcon,
  ChartLineUpIcon,
  MonitorPlayIcon,
  QrCodeIcon,
  UsersIcon,
  TagIcon,
  MedalIcon,
} from '@phosphor-icons/react';
import type { Dispatch, SetStateAction } from 'react';
import { ROUTES } from '../../constants/routes';
import { useTranslation } from '@shared/i18n/useTranslation';
import type { Restaurant } from '@shared/types/models';
import type { QrType } from './useVendorDashboard';

interface VendorSidebarProps {
  selectedRestaurant: Restaurant;
  activeTab: string;
  setActiveTab: Dispatch<SetStateAction<string>>;
  setEditRestaurant: Dispatch<SetStateAction<Restaurant | null>>;
  setQrType: Dispatch<SetStateAction<QrType>>;
  setShowQr: Dispatch<SetStateAction<boolean>>;
}

const TABS = [
  { id: 'menu', labelKey: 'vendor.sidebar.tabs.menu', icon: <ForkKnifeIcon size={18} /> },
  { id: 'orders', labelKey: 'vendor.sidebar.tabs.orders', icon: <PackageIcon size={18} /> },
  { id: 'analytics', labelKey: 'vendor.sidebar.tabs.analytics', icon: <ChartLineUpIcon size={18} /> },
  { id: 'ai', labelKey: 'vendor.sidebar.tabs.ai', icon: <ChartLineUpIcon size={18} /> },
  { id: 'promos', labelKey: 'vendor.sidebar.tabs.promos', icon: <TagIcon size={18} /> },
  { id: 'loyalty', labelKey: 'vendor.sidebar.tabs.loyalty', icon: <MedalIcon size={18} /> },
  { id: 'schedule', labelKey: 'vendor.sidebar.tabs.schedule', icon: <ClockIcon size={18} /> },
  { id: 'staff', labelKey: 'vendor.sidebar.tabs.staff', icon: <UsersIcon size={18} /> },
  { id: 'settings', labelKey: 'vendor.sidebar.tabs.settings', icon: <GearIcon size={18} /> },
];

export function VendorSidebar({
  selectedRestaurant,
  activeTab,
  setActiveTab,
  setEditRestaurant,
  setQrType,
  setShowQr,
}: VendorSidebarProps) {
  const { t } = useTranslation();
  return (
    <div
      className="admin-sidebar"
      style={{
        width: 220,
        flexShrink: 0,
        position: 'sticky',
        top: 80,
        display: 'flex',
        flexDirection: 'column',
        gap: 6,
        background: 'var(--bg-card)',
        padding: 16,
        borderRadius: 'var(--r-md)',
        border: '1px solid var(--border)',
      }}
    >
      <div
        style={{
          fontWeight: 800,
          fontSize: "var(--text-md)",
          marginBottom: selectedRestaurant.display_id ? 4 : 12,
          color: 'var(--text-1)',
        }}
      >
        {selectedRestaurant.name}
      </div>
      {selectedRestaurant.display_id && (
        <div
          style={{
            fontSize: "var(--text-sm)",
            color: 'var(--text-3)',
            marginBottom: 12,
            fontFamily: 'monospace',
            background: 'var(--bg-surface)',
            padding: '2px 6px',
            borderRadius: '4px',
            display: 'inline-block',
            border: '1px solid var(--border)',
            alignSelf: 'flex-start',
          }}
        >
          @{selectedRestaurant.display_id}
        </div>
      )}

      <div role="tablist" aria-label={t('vendor.sidebar.ariaLabel')} aria-orientation="vertical" style={{ display: 'contents' }}>
        {TABS.map((tab) => (
          <button
            key={tab.id}
            role="tab"
            aria-selected={activeTab === tab.id}
            aria-controls={`vendor-panel-${tab.id}`}
            className={`btn ${activeTab === tab.id ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => {
              setActiveTab(tab.id);
              if (tab.id === 'settings') {
                setEditRestaurant({ ...selectedRestaurant });
              }
            }}
            style={{
              justifyContent: 'flex-start',
              border: 'none',
              padding: '10px 14px',
              gap: 10,
              fontSize: "var(--text-base)",
              fontWeight: activeTab === tab.id ? 700 : 500,
            }}
          >
            {tab.icon}
            {t(tab.labelKey)}
          </button>
        ))}
      </div>

      <div
        style={{
          borderTop: '1px solid var(--border)',
          marginTop: 8,
          paddingTop: 8,
          display: 'flex',
          flexDirection: 'column',
          gap: 4,
        }}
      >
        <a
          href={ROUTES.DISPLAY_BOARD.replace(':restaurantId', selectedRestaurant.id)}
          target="_blank"
          rel="noopener noreferrer"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            padding: '10px 14px',
            fontSize: "var(--text-base)",
            fontWeight: 600,
            color: 'var(--fire)',
            textDecoration: 'none',
            borderRadius: 'var(--r-sm)',
          }}
        >
          <MonitorPlayIcon size={18} weight="bold" />
          {t('vendor.sidebar.openDisplayBoard')}
        </a>
        <button
          className="btn btn-secondary"
          onClick={() => {
            setQrType('site');
            setShowQr(true);
          }}
          style={{
            justifyContent: 'flex-start',
            border: 'none',
            padding: '10px 14px',
            gap: 10,
            fontSize: "var(--text-base)",
            fontWeight: 600,
            color: 'var(--text-2)',
          }}
        >
          <QrCodeIcon size={18} />
          {t('vendor.sidebar.qrSite')}
        </button>
        <button
          className="btn btn-secondary"
          onClick={() => {
            setQrType('telegram');
            setShowQr(true);
          }}
          style={{
            justifyContent: 'flex-start',
            border: 'none',
            padding: '10px 14px',
            gap: 10,
            fontSize: "var(--text-base)",
            fontWeight: 600,
            color: 'var(--text-2)',
          }}
        >
          <QrCodeIcon size={18} />
          {t('vendor.sidebar.qrTelegram')}
        </button>
      </div>
    </div>
  );
}
