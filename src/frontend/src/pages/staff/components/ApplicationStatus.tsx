import { useState, useEffect } from 'react';
import { CheckCircleIcon, HourglassMediumIcon, XCircleIcon } from '@phosphor-icons/react';
import type { Icon } from '@phosphor-icons/react';
import { staffService } from '@shared/services/staffService';
import EmptyState from '@shared/components/EmptyState/EmptyState';
import type { StaffRequest, StaffRequestStatus } from '@shared/types/models';

interface ApplicationStatusConfigEntry {
  Icon: Icon;
  iconColor: string;
  title: string;
  description: string;
  color: string;
  bg: string;
}

const APPLICATION_STATUS_CONFIG: Record<StaffRequestStatus, ApplicationStatusConfigEntry> = {
  PENDING: {
    Icon: HourglassMediumIcon,
    iconColor: 'var(--color-warning)',
    title: 'Заявка на рассмотрении',
    description:
      'Ваша заявка отправлена и ожидает решения менеджера. Обычно это занимает несколько часов.',
    color: 'var(--color-warning-dim)',
    bg: 'var(--color-warning-bg)',
  },
  ACCEPTED: {
    Icon: CheckCircleIcon,
    iconColor: 'var(--color-success)',
    title: 'Заявка одобрена',
    description:
      'Ваша заявка принята. Обратитесь к менеджеру для завершения оформления.',
    color: 'var(--color-success-dim)',
    bg: 'var(--color-success-bg)',
  },
  REJECTED: {
    Icon: XCircleIcon,
    iconColor: 'var(--color-error)',
    title: 'Заявка отклонена',
    description:
      'К сожалению, ваша заявка была отклонена. Вы можете попробовать снова через 24 часа.',
    color: 'var(--color-error)',
    bg: 'var(--color-error-bg)',
  },
};

const ApplicationStatus = () => {
  const [application, setApplication] = useState<StaffRequest | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    staffService
      .getMyApplication()
      .then((res) => { setApplication(res.data.data); })
      .catch(() => {})
      .finally(() => { setLoading(false); });
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
          title="Нет профиля сотрудника"
          subtitle="Вы не привязаны ни к одному заведению. Обратитесь к менеджеру."
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
              fontSize: '1.2rem',
              color: 'var(--text-1)',
              marginBottom: 8,
            }}
          >
            {config.title}
          </h2>
          <p
            style={{
              color: 'var(--text-3)',
              fontSize: '0.875rem',
              lineHeight: 1.5,
              margin: 0,
            }}
          >
            {config.description}
          </p>
        </div>
        <div
          style={{
            background: 'var(--bg-card)',
            border: '1px solid var(--border)',
            borderRadius: 'var(--r-sm)',
            padding: '10px 16px',
            fontSize: '0.78rem',
            color: 'var(--text-3)',
            fontFamily: 'monospace',
          }}
        >
          Заявка #{application.id.slice(0, 8)}
        </div>
      </div>
    </div>
  );
};

export default ApplicationStatus;
