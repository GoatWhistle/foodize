import { CookingPotIcon, BellIcon } from '@phosphor-icons/react';
import { STAFF_ROLE_RU, translate } from '@shared/utils/locales';
import type { StaffProfile } from '@shared/types/models';

interface StaffHeaderProps {
  profile: StaffProfile;
  newOrderAlert: boolean;
  onDismissAlert: () => void;
  autoEta: boolean;
  onToggleAutoEta: (checked: boolean) => void;
}

export const StaffHeader = ({ profile, newOrderAlert, onDismissAlert, autoEta, onToggleAutoEta }: StaffHeaderProps) => (
  <div style={{ marginBottom: 24 }}>
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        marginBottom: 6,
      }}
    >
      <CookingPotIcon size={28} weight="fill" color="var(--fire)" />
      <h1
        style={{
          fontFamily: 'var(--font-sans)',
          fontSize: "var(--text-xl)",
          fontWeight: 800,
          color: 'var(--text-1)',
          margin: 0,
        }}
      >
        Кабинет сотрудника
      </h1>
      {newOrderAlert && (
        <button
          style={{
            background: 'var(--color-success)',
            border: 'none',
            borderRadius: 'var(--r-sm)',
            padding: '4px 10px',
            color: 'var(--fire-text)',
            fontSize: "var(--text-sm)",
            fontWeight: 700,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: 4,
          }}
          onClick={onDismissAlert}
        >
          <BellIcon size={12} weight="fill" />
          Новый заказ!
        </button>
      )}
    </div>
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 12,
      }}
    >
      <p style={{ color: 'var(--text-3)', fontSize: "var(--text-base)", margin: 0 }}>
        Роль:{' '}
        <strong style={{ color: 'var(--text-2)' }}>
          {translate(STAFF_ROLE_RU, profile.role, profile.role)}
        </strong>
      </p>
      <label
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          cursor: 'pointer',
          padding: '5px 10px',
          borderRadius: 'var(--r-sm)',
          border: `1px solid ${autoEta ? 'var(--fire)' : 'var(--border)'}`,
          background: autoEta ? 'var(--fire-subtle)' : 'var(--bg-card)',
          transition: 'all 0.15s',
          userSelect: 'none',
        }}
      >
        <input
          type="checkbox"
          checked={autoEta}
          onChange={(e) => { onToggleAutoEta(e.target.checked); }}
          style={{
            width: 14,
            height: 14,
            cursor: 'pointer',
            accentColor: 'var(--fire)',
          }}
        />
        <span
          style={{
            fontSize: "var(--text-sm)",
            fontWeight: 600,
            color: autoEta ? 'var(--fire)' : 'var(--text-2)',
            whiteSpace: 'nowrap',
          }}
        >
          Авто-время по блюдам
        </span>
      </label>
    </div>
  </div>
);
