import { useState, useEffect } from 'react';
import { CheckCircle, HourglassMedium, XCircle } from '@phosphor-icons/react';
import { staffService } from '../../../services/staffService';
import EmptyState from '../../../components/ui/EmptyState';

const APPLICATION_STATUS_CONFIG = {
  PENDING: {
    Icon: HourglassMedium,
    iconColor: '#f59e0b',
    title: 'Заявка на рассмотрении',
    description:
      'Ваша заявка отправлена и ожидает решения менеджера. Обычно это занимает несколько часов.',
    color: '#f59e0b',
    bg: '#f59e0b22',
  },
  ACCEPTED: {
    Icon: CheckCircle,
    iconColor: '#22c55e',
    title: 'Заявка одобрена',
    description:
      'Ваша заявка принята. Обратитесь к менеджеру для завершения оформления.',
    color: '#22c55e',
    bg: '#22c55e22',
  },
  REJECTED: {
    Icon: XCircle,
    iconColor: '#ef4444',
    title: 'Заявка отклонена',
    description:
      'К сожалению, ваша заявка была отклонена. Вы можете попробовать снова через 24 часа.',
    color: '#ef4444',
    bg: '#ef444422',
  },
};

const ApplicationStatus = () => {
  const [application, setApplication] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    staffService
      .getMyApplication()
      .then((res) => setApplication(res.data.data))
      .catch(() => {})
      .finally(() => setLoading(false));
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

  const config =
    APPLICATION_STATUS_CONFIG[application.status] ||
    APPLICATION_STATUS_CONFIG.PENDING;

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
