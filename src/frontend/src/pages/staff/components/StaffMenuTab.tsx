import EmptyState from '@shared/components/EmptyState/EmptyState';
import type { MenuItem } from '@shared/types/models';

interface StaffMenuTabProps {
  menuItems: MenuItem[];
  menuLoading: boolean;
  menuError: string;
  onToggleAvailability: (item: MenuItem) => void;
}

const StaffMenuTab = ({ menuItems, menuLoading, menuError, onToggleAvailability }: StaffMenuTabProps) => (
  <div>
    {menuLoading ? (
      <div className="loading-center">
        <div className="spinner" />
      </div>
    ) : menuError ? (
      <div className="form-error">{menuError}</div>
    ) : menuItems.length === 0 ? (
      <EmptyState
        title="Меню пусто"
        subtitle="В этом ресторане пока нет блюд"
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
                  fontSize: '0.95rem',
                  color: 'var(--text-1)',
                }}
              >
                {item.name}
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-3)' }}>
                {item.price} ₽
              </div>
            </div>
            <button
              onClick={() => onToggleAvailability(item)}
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
                fontSize: '0.7rem',
                fontWeight: 800,
                cursor: 'pointer',
              }}
            >
              {item.is_available ? 'ВКЛ' : 'ВЫКЛ'}
            </button>
          </div>
        ))}
      </div>
    )}
  </div>
);

export default StaffMenuTab;
