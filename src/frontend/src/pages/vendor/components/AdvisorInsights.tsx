import { ChartLineUpIcon, ArrowsClockwiseIcon } from '@phosphor-icons/react';
import { useTranslation } from '@shared/i18n/useTranslation';
import styles from './VendorAdvisor.module.css';

interface AdvisorInsightsProps {
  insights: string | null;
  insightsLoading: boolean;
  onLoad: () => void;
}

export function AdvisorInsights({ insights, insightsLoading, onLoad }: AdvisorInsightsProps) {
  const { t } = useTranslation();
  return (
    <div className={styles['card']}>
      <div className={styles['insightsHeader']}>
        <h3 className={styles['insightsTitle']}>
          <ChartLineUpIcon size={20} /> {t('vendor.advisor.insightsTitle')}
        </h3>
        <button
          className={`btn btn-primary ${styles['insightsBtn']}`}
          disabled={insightsLoading}
          onClick={onLoad}
        >
          {insights ? <ArrowsClockwiseIcon size={16} /> : <ChartLineUpIcon size={16} />}
          {insightsLoading ? t('vendor.advisor.analyzing') : insights ? t('common.actions.refresh') : t('vendor.advisor.getInsights')}
        </button>
      </div>
      {insights && <div className={styles['insightsText']}>{insights}</div>}
    </div>
  );
}
