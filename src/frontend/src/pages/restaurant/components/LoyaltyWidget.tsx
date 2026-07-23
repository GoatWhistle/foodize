import { useEffect, useState } from 'react';
import { MedalIcon } from '@phosphor-icons/react';
import { loyaltyService } from '@shared/services/loyaltyService';
import { useTranslation } from '@shared/i18n/useTranslation';
import { formatPrice } from '@shared/utils/price';
import type { LoyaltyStatus } from '@shared/types/models';

interface LoyaltyWidgetProps {
  restaurantId: string;
}

export function LoyaltyWidget({ restaurantId }: LoyaltyWidgetProps) {
  const { t } = useTranslation();
  const [status, setStatus] = useState<LoyaltyStatus | null>(null);

  useEffect(() => {
    const state = { cancelled: false };
    void (async () => {
      try {
        const response = await loyaltyService.getStatus(restaurantId);
        if (!state.cancelled) setStatus(response.data.data);
      } catch {
        if (!state.cancelled) setStatus(null);
      }
    })();
    return () => {
      state.cancelled = true;
    };
  }, [restaurantId]);

  const program = status?.program;
  if (!status || !program) return null;

  const availableRewards = status.rewards.filter((reward) => reward.status === 'AVAILABLE');
  const isSpentBasis = program.tier_basis === 'SPENT';
  const basisValue = isSpentBasis ? status.total_spent : status.orders_count;

  return (
    <div
      style={{
        padding: '12px 16px',
        background: 'var(--bg-card)',
        border: '1px solid var(--border)',
        borderRadius: 'var(--r-md)',
        marginBottom: 16,
        display: 'flex',
        flexDirection: 'column',
        gap: 6,
        fontSize: 'var(--text-base)',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontWeight: 800 }}>
        <MedalIcon size={16} weight="fill" />
        {t('loyalty.widget.title')}
        <span style={{ fontWeight: 500, color: 'var(--text-3)' }}>
          {t(`loyalty.programType.${program.type}`)}
        </span>
      </div>

      {program.type === 'PUNCH_CARD' ? (
        <div>
          {t('loyalty.widget.punchesProgress', {
            count: status.punches_count,
            total: program.punches_required ?? 0,
          })}
        </div>
      ) : (
        <>
          <div>
            {t('loyalty.widget.pointsBalance')}: {formatPrice(status.points_balance)}
          </div>
          {status.current_tier && (
            <div>
              {t('loyalty.widget.yourTier')}: {status.current_tier.name} ·{' '}
              {t('loyalty.widget.cashbackPercent', {
                percent: status.current_tier.cashback_percent,
              })}
            </div>
          )}
          <div style={{ color: 'var(--text-3)' }}>
            {status.next_tier
              ? t('loyalty.widget.progressToNext', {
                  tier: status.next_tier.name,
                  count: isSpentBasis ? formatPrice(basisValue) : basisValue,
                  total: isSpentBasis
                    ? formatPrice(status.next_tier.threshold)
                    : status.next_tier.threshold,
                })
              : t('loyalty.widget.maxTierReached')}
          </div>
        </>
      )}

      {availableRewards.length > 0 && (
        <div style={{ color: 'var(--color-success)', fontWeight: 700 }}>
          {t('loyalty.widget.availableRewards', { count: availableRewards.length })}
        </div>
      )}
    </div>
  );
}
