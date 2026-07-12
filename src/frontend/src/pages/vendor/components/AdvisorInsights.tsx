import { ChartLineUpIcon, ArrowsClockwiseIcon } from '@phosphor-icons/react';
import styles from './VendorAdvisor.module.css';

interface AdvisorInsightsProps {
  insights: string | null;
  insightsLoading: boolean;
  onLoad: () => void;
}

export function AdvisorInsights({ insights, insightsLoading, onLoad }: AdvisorInsightsProps) {
  return (
    <div className={styles.card}>
      <div className={styles.insightsHeader}>
        <h3 className={styles.insightsTitle}>
          <ChartLineUpIcon size={20} /> Анализ бизнеса
        </h3>
        <button
          className={`btn btn-primary ${styles.insightsBtn}`}
          disabled={insightsLoading}
          onClick={onLoad}
        >
          {insights ? <ArrowsClockwiseIcon size={16} /> : <ChartLineUpIcon size={16} />}
          {insightsLoading ? 'Анализирую…' : insights ? 'Обновить' : 'Получить анализ'}
        </button>
      </div>
      {insights && <div className={styles.insightsText}>{insights}</div>}
    </div>
  );
}
