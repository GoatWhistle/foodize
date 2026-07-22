import { memo, useCallback } from 'react';
import type { Dispatch, ReactNode, SetStateAction } from 'react';
import {
  ChartLineUpIcon,
  UsersThreeIcon,
  PackageIcon,
  StorefrontIcon,
  StarIcon,
  ClockIcon,
  CaretDownIcon,
  RowsIcon,
  ShieldWarningIcon,
} from '@phosphor-icons/react';
import { useTranslation } from '@shared/i18n/useTranslation';

const ENTITY_TAB_IDS = new Set(['users', 'orders', 'restaurants', 'vendors', 'reviews']);

interface TabDef {
  id: string;
  labelKey: string;
  icon: ReactNode;
}

interface TabButtonProps {
  tab: TabDef;
  label: string;
  activeTab: string;
  indented?: boolean;
  onClick: (id: string) => void;
}

const TabButton = memo(({ tab, label, activeTab, indented, onClick }: TabButtonProps) => (
  <button
    role="tab"
    aria-selected={activeTab === tab.id}
    aria-controls={`admin-panel-${tab.id}`}
    className={`btn ${activeTab === tab.id ? 'btn-primary' : 'btn-secondary'}`}
    onClick={() => { onClick(tab.id); }}
    style={{
      justifyContent: 'flex-start',
      border: 'none',
      padding: indented ? '8px 16px' : '10px 16px',
      gap: 10,
      fontSize: 'var(--text-base)',
      fontWeight: activeTab === tab.id ? 700 : 500,
    }}
  >
    {tab.icon}
    {label}
  </button>
));

const tabs: TabDef[] = [
  { id: 'stats', labelKey: 'admin.sidebar.tabs.stats', icon: <ChartLineUpIcon size={18} /> },
  { id: 'users', labelKey: 'admin.sidebar.tabs.users', icon: <UsersThreeIcon size={18} /> },
  { id: 'orders', labelKey: 'admin.sidebar.tabs.orders', icon: <PackageIcon size={18} /> },
  { id: 'resolution', labelKey: 'admin.sidebar.tabs.resolution', icon: <ShieldWarningIcon size={18} /> },
  { id: 'restaurants', labelKey: 'admin.sidebar.tabs.restaurants', icon: <StorefrontIcon size={18} /> },
  { id: 'vendors', labelKey: 'admin.sidebar.tabs.vendors', icon: <UsersThreeIcon size={18} /> },
  { id: 'reviews', labelKey: 'admin.sidebar.tabs.reviews', icon: <StarIcon size={18} /> },
  { id: 'finance', labelKey: 'admin.sidebar.tabs.finance', icon: <ChartLineUpIcon size={18} /> },
  { id: 'audit', labelKey: 'admin.sidebar.tabs.audit', icon: <ClockIcon size={18} /> },
];

interface AdminSidebarProps {
  activeTab: string;
  setActiveTab: (id: string) => void;
  entitiesOpen: boolean;
  setEntitiesOpen: Dispatch<SetStateAction<boolean>>;
}

export function AdminSidebar({
  activeTab,
  setActiveTab,
  entitiesOpen,
  setEntitiesOpen,
}: AdminSidebarProps) {
  const { t } = useTranslation();
  const handleTabClick = useCallback((id: string) => { setActiveTab(id); }, [setActiveTab]);

  return (
    <div
      className="admin-sidebar"
      role="tablist"
      aria-label={t('admin.sidebar.ariaLabel')}
      aria-orientation="vertical"
      style={{
        width: 240, flexShrink: 0, position: 'sticky', top: 80,
        display: 'flex', flexDirection: 'column', gap: 6,
        background: 'var(--bg-card)', padding: 16,
        borderRadius: 'var(--r-md)', border: '1px solid var(--border)',
      }}
    >
      <h1 style={{ fontSize: "var(--text-md)", fontWeight: 900, marginBottom: 16 }}>
        {t('admin.sidebar.title')}
      </h1>
      {tabs
        .filter((tab) => tab.id === 'stats')
        .map((tab) => (
          <TabButton key={tab.id} tab={tab} label={t(tab.labelKey)} activeTab={activeTab} onClick={handleTabClick} />
        ))}
      <div>
        <button
          onClick={() => { setEntitiesOpen((o) => !o); }}
          aria-expanded={entitiesOpen}
          style={{
            display: 'flex', alignItems: 'center', gap: 8, width: '100%',
            padding: '10px 14px',
            background: entitiesOpen ? 'var(--bg-surface)' : 'none',
            border: '1px solid',
            borderColor: entitiesOpen ? 'var(--border)' : 'transparent',
            cursor: 'pointer', color: 'var(--text-2)', fontSize: "var(--text-base)",
            fontWeight: 700, borderRadius: 'var(--r-sm)', marginTop: 4,
            transition: 'background 0.15s, border-color 0.15s',
          }}
        >
          <RowsIcon size={16} weight="bold" />
          {t('admin.sidebar.entities')}
          <CaretDownIcon
            size={14} weight="bold"
            style={{
              marginLeft: 'auto',
              transform: entitiesOpen ? 'rotate(180deg)' : 'none',
              transition: 'transform 0.2s', color: 'var(--text-3)',
            }}
          />
        </button>
        {entitiesOpen && (
          <div style={{ paddingLeft: 8, display: 'flex', flexDirection: 'column', gap: 4 }}>
            {tabs
              .filter((tab) => ENTITY_TAB_IDS.has(tab.id))
              .map((tab) => (
                <TabButton key={tab.id} tab={tab} label={t(tab.labelKey)} activeTab={activeTab} indented onClick={handleTabClick} />
              ))}
          </div>
        )}
      </div>
      {tabs
        .filter((tab) => !ENTITY_TAB_IDS.has(tab.id) && tab.id !== 'stats')
        .map((tab) => (
          <TabButton key={tab.id} tab={tab} label={t(tab.labelKey)} activeTab={activeTab} onClick={handleTabClick} />
        ))}
    </div>
  );
}
