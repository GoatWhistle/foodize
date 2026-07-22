import { EmptyState } from '@shared/components/EmptyState/EmptyState';
import type { MenuItem } from '@shared/types/models';
import { formatPrice } from '@shared/utils/price';
import { useTranslation } from '@shared/i18n/useTranslation';

interface StaffMenuTabProps {
  menuItems: MenuItem[];
  menuLoading: boolean;
  menuError: string;
  onToggleAvailability: (item: MenuItem) => void;
}

export const StaffMenuTab = ({ menuItems, menuLoading, menuError, onToggleAvailability }: StaffMenuTabProps) => {
  const { t } = useTranslation();
  return (
  <div>
    {menuLoading ? (
      <div className="loading-center">
        <div className="spinner" />
      </div>
    ) : menuError ? (
      <div className="form-error">{menuError}</div>
    ) : menuItems.length === 0 ? (
      <EmptyState
        title={t('staff.menuTab.emptyTitle')}
        subtitle={t('staff.menuTab.emptySubtitle')}
      />
    ) : (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {menuItems.map((item) => (
          <div
            key={item.id}
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '12px 16px',
              background: 'var(--bg-card)',
              border: '1px solid var(--border)',
              borderRadius: 'var(--r-md)',
              opacity: item.is_available ? 1 : 0.6,
            }}
          >
            <div>
              <div
                style={{
                  fontWeight: 700,
                  fontSize: "var(--text-base)",
                  color: 'var(--text-1)',
                }}
              >
                {item.name}
              </div>
              <div style={{ fontSize: "var(--text-sm)", color: 'var(--text-3)' }}>
                {formatPrice(item.price)}
              </div>
            </div>
            <button
              onClick={() => { onToggleAvailability(item); }}
              style={{
                padding: '6px 12px',
                borderRadius: '20px',
                border: `1px solid ${item.is_available ? 'var(--color-success-border)' : 'var(--border)'}`,
                background: item.is_available
                  ? 'var(--color-success-bg)'
                  : 'var(--bg-raised)',
                color: item.is_available
                  ? 'var(--color-success-dim)'
                  : 'var(--text-3)',
                fontSize: "var(--text-xs)",
                fontWeight: 800,
                cursor: 'pointer',
              }}
            >
              {item.is_available ? t('staff.menuTab.on') : t('staff.menuTab.off')}
            </button>
          </div>
        ))}
      </div>
    )}
  </div>
  );
};
