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

const ENTITY_TAB_IDS = new Set(['users', 'orders', 'restaurants', 'vendors', 'reviews']);

interface TabDef {
  id: string;
  label: string;
  icon: ReactNode;
}

interface TabButtonProps {
  tab: TabDef;
  activeTab: string;
  indented?: boolean;
  onClick: (id: string) => void;
}

const TabButton = memo(({ tab, activeTab, indented, onClick }: TabButtonProps) => (
  <button
    className={`btn ${activeTab === tab.id ? 'btn-primary' : 'btn-secondary'}`}
    onClick={() => { onClick(tab.id); }}
    style={{
      justifyContent: 'flex-start',
      border: 'none',
      padding: indented ? '8px 16px' : '10px 16px',
      gap: 10,
      fontSize: indented ? '0.88rem' : '0.95rem',
      fontWeight: activeTab === tab.id ? 700 : 500,
    }}
  >
    {tab.icon}
    {tab.label}
  </button>
));

const tabs: TabDef[] = [
  { id: 'stats', label: 'Статистика', icon: <ChartLineUpIcon size={18} /> },
  { id: 'users', label: 'Пользователи', icon: <UsersThreeIcon size={18} /> },
  { id: 'orders', label: 'Заказы', icon: <PackageIcon size={18} /> },
  { id: 'resolution', label: 'Модерация', icon: <ShieldWarningIcon size={18} /> },
  { id: 'restaurants', label: 'Рестораны', icon: <StorefrontIcon size={18} /> },
  { id: 'vendors', label: 'Вендоры', icon: <UsersThreeIcon size={18} /> },
  { id: 'reviews', label: 'Отзывы', icon: <StarIcon size={18} /> },
  { id: 'finance', label: 'Аналитика', icon: <ChartLineUpIcon size={18} /> },
  { id: 'audit', label: 'Логи', icon: <ClockIcon size={18} /> },
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
  const handleTabClick = useCallback((id: string) => { setActiveTab(id); }, [setActiveTab]);

  return (
    <div
      className="admin-sidebar"
      style={{
        width: 240, flexShrink: 0, position: 'sticky', top: 80,
        display: 'flex', flexDirection: 'column', gap: 6,
        background: 'var(--bg-card)', padding: 16,
        borderRadius: 'var(--r-md)', border: '1px solid var(--border)',
      }}
    >
      <h1 style={{ fontSize: '1.2rem', fontWeight: 900, marginBottom: 16 }}>Админ-панель</h1>
      {tabs
        .filter((t) => t.id === 'stats')
        .map((tab) => <TabButton key={tab.id} tab={tab} activeTab={activeTab} onClick={handleTabClick} />)}
      <div>
        <button
          onClick={() => { setEntitiesOpen((o) => !o); }}
          style={{
            display: 'flex', alignItems: 'center', gap: 8, width: '100%',
            padding: '10px 14px',
            background: entitiesOpen ? 'var(--bg-surface)' : 'none',
            border: '1px solid',
            borderColor: entitiesOpen ? 'var(--border)' : 'transparent',
            cursor: 'pointer', color: 'var(--text-2)', fontSize: '0.9rem',
            fontWeight: 700, borderRadius: 'var(--r-sm)', marginTop: 4,
            transition: 'background 0.15s, border-color 0.15s',
          }}
        >
          <RowsIcon size={16} weight="bold" />
          Сущности
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
              .filter((t) => ENTITY_TAB_IDS.has(t.id))
              .map((tab) => <TabButton key={tab.id} tab={tab} activeTab={activeTab} indented onClick={handleTabClick} />)}
          </div>
        )}
      </div>
      {tabs
        .filter((t) => !ENTITY_TAB_IDS.has(t.id) && t.id !== 'stats')
        .map((tab) => <TabButton key={tab.id} tab={tab} activeTab={activeTab} onClick={handleTabClick} />)}
    </div>
  );
}
