import { useState, useEffect } from 'react';
import { CheckCircleIcon, HourglassMediumIcon, XCircleIcon } from '@phosphor-icons/react';
import type { Icon } from '@phosphor-icons/react';
import { staffService } from '@shared/services/staffService';
import { EmptyState } from '@shared/components/EmptyState/EmptyState';
import { useTranslation } from '@shared/i18n/useTranslation';
import type { StaffRequest, StaffRequestStatus } from '@shared/types/models';

interface ApplicationStatusConfigEntry {
  Icon: Icon;
  iconColor: string;
  titleKey: string;
  descriptionKey: string;
  color: string;
  bg: string;
}

const APPLICATION_STATUS_CONFIG: Record<StaffRequestStatus, ApplicationStatusConfigEntry> = {
  PENDING: {
    Icon: HourglassMediumIcon,
    iconColor: 'var(--color-warning)',
    titleKey: 'staff.application.pending.title',
    descriptionKey: 'staff.application.pending.description',
    color: 'var(--color-warning-dim)',
    bg: 'var(--color-warning-bg)',
  },
  ACCEPTED: {
    Icon: CheckCircleIcon,
    iconColor: 'var(--color-success)',
    titleKey: 'staff.application.accepted.title',
    descriptionKey: 'staff.application.accepted.description',
    color: 'var(--color-success-dim)',
    bg: 'var(--color-success-bg)',
  },
  REJECTED: {
    Icon: XCircleIcon,
    iconColor: 'var(--color-error)',
    titleKey: 'staff.application.rejected.title',
    descriptionKey: 'staff.application.rejected.description',
    color: 'var(--color-error)',
    bg: 'var(--color-error-bg)',
  },
};

export const ApplicationStatus = () => {
  const { t } = useTranslation();
  const [application, setApplication] = useState<StaffRequest | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    void (async () => {
      try {
        const response = await staffService.getMyApplication();
        setApplication(response.data.data);
      } catch {
        setApplication(null);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading) {
    return (
      <div className="loading-center" style={{ minHeight: '60vh' }}>
        <div className="spinner" />
      </div>
    );
  }

  if (!application) {
    return (
      <div style={{ padding: '40px 20px', maxWidth: 500, margin: '0 auto' }}>
        <EmptyState
          title={t('staff.application.noProfileTitle')}
          subtitle={t('staff.application.noProfileSubtitle')}
        />
      </div>
    );
  }

  const config = APPLICATION_STATUS_CONFIG[application.status];

  return (
    <div style={{ padding: '40px 20px', maxWidth: 480, margin: '0 auto' }}>
      <div
        style={{
          background: config.bg,
          border: `1px solid ${config.color}44`,
          borderRadius: 'var(--r-lg)',
          padding: '32px 24px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 16,
          textAlign: 'center',
        }}
      >
        <config.Icon size={48} color={config.iconColor} weight="fill" />
        <div>
          <h2
            style={{
              fontWeight: 800,
              fontSize: "var(--text-md)",
              color: 'var(--text-1)',
              marginBottom: 8,
            }}
          >
            {t(config.titleKey)}
          </h2>
          <p
            style={{
              color: 'var(--text-3)',
              fontSize: "var(--text-base)",
              lineHeight: 1.5,
              margin: 0,
            }}
          >
            {t(config.descriptionKey)}
          </p>
        </div>
        <div
          style={{
            background: 'var(--bg-card)',
            border: '1px solid var(--border)',
            borderRadius: 'var(--r-sm)',
            padding: '10px 16px',
            fontSize: "var(--text-sm)",
            color: 'var(--text-3)',
            fontFamily: 'monospace',
          }}
        >
          {t('staff.application.number', { id: application.id.slice(0, 8) })}
        </div>
      </div>
    </div>
  );
};
