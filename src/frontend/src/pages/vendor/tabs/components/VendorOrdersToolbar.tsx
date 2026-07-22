import type { Dispatch, SetStateAction } from 'react';
import { ArrowsClockwiseIcon, DownloadSimpleIcon } from '@phosphor-icons/react';
import { useTranslation } from '@shared/i18n/useTranslation';
import type { Restaurant } from '@shared/types/models';
import styles from './VendorOrders.module.css';

const STATUS_CHIPS: { key: string; labelKey: string }[] = [
  { key: '', labelKey: 'vendor.orders.filters.all' },
  { key: 'PENDING', labelKey: 'vendor.orders.filters.pending' },
  { key: 'ACCEPTED', labelKey: 'vendor.orders.filters.accepted' },
  { key: 'READY', labelKey: 'vendor.orders.filters.ready' },
  { key: 'COMPLETED', labelKey: 'vendor.orders.filters.completed' },
];

interface VendorOrdersToolbarProps {
  ordersStatusFilter: string;
  setOrdersStatusFilter: Dispatch<SetStateAction<string>>;
  ordersDateFromFilter: string;
  setOrdersDateFromFilter: Dispatch<SetStateAction<string>>;
  ordersDateToFilter: string;
  setOrdersDateToFilter: Dispatch<SetStateAction<string>>;
  setOrdersPage: Dispatch<SetStateAction<number>>;
  ordersLoading: boolean;
  exportLoading: boolean;
  todayStr: string;
  selectedRestaurant: Restaurant | null;
  handleVendorExport: (
    exportFn: () => Promise<Blob>,
    filename: string,
  ) => void;
  fetchVendorOrders: () => void;
  vendorService: {
    exportOrdersCSV: (params: Record<string, unknown>) => Promise<Blob>;
    [key: string]: (...args: never[]) => Promise<unknown>;
  };
}

export function VendorOrdersToolbar({
  ordersStatusFilter,
  setOrdersStatusFilter,
  ordersDateFromFilter,
  setOrdersDateFromFilter,
  ordersDateToFilter,
  setOrdersDateToFilter,
  setOrdersPage,
  ordersLoading,
  exportLoading,
  todayStr,
  selectedRestaurant,
  handleVendorExport,
  fetchVendorOrders,
  vendorService,
}: VendorOrdersToolbarProps) {
  const { t } = useTranslation();
  return (
    <>
      <div className={styles['header']}>
        <div>
          <div className={styles['headerTitle']}>{t('vendor.orders.toolbarTitle')}</div>
          <div className={styles['headerSubtitle']}>
            {t('vendor.orders.toolbarHint')}
          </div>
        </div>
        <div className={styles['headerActions']}>
          <button
            type="button"
            className="btn btn-secondary btn-sm"
            disabled={exportLoading}
            onClick={() =>
              { handleVendorExport(
                () =>
                  vendorService.exportOrdersCSV({
                    restaurant_id: selectedRestaurant?.id || undefined,
                    status: ordersStatusFilter || undefined,
                  }),
                t('vendor.exportFiles.orders', { date: todayStr })
              ); }
            }
          >
            {exportLoading ? '...' : <><DownloadSimpleIcon size={16} weight="bold" /> CSV</>}
          </button>
          <button
            type="button"
            className={`btn btn-secondary btn-sm ${styles['refreshBtn']}`}
            onClick={() => { fetchVendorOrders(); }}
            disabled={ordersLoading}
          >
            <ArrowsClockwiseIcon size={14} />
            {ordersLoading ? '...' : t('common.actions.refresh')}
          </button>
        </div>
      </div>
      <div className={styles['chips']}>
        {STATUS_CHIPS.map(({ key, labelKey }) => (
          <button
            key={key}
            className={`category-chip${ordersStatusFilter === key ? ' active' : ''} ${styles['chip']}`}
            onClick={() => {
              setOrdersStatusFilter(key);
              setOrdersPage(1);
            }}
          >
            {t(labelKey)}
          </button>
        ))}
      </div>
      <div className={styles['dateRow']}>
        <input
          className={`form-input ${styles['dateInput']}`}
          type="date"
          value={ordersDateFromFilter}
          onChange={(e) => {
            setOrdersDateFromFilter(e.target.value);
            setOrdersPage(1);
          }}
          aria-label={t('vendor.orders.dateFrom')}
        />
        <span className={styles['dateDash']}>—</span>
        <input
          className={`form-input ${styles['dateInput']}`}
          type="date"
          value={ordersDateToFilter}
          onChange={(e) => {
            setOrdersDateToFilter(e.target.value);
            setOrdersPage(1);
          }}
          aria-label={t('vendor.orders.dateTo')}
        />
        {(ordersDateFromFilter || ordersDateToFilter) && (
          <button
            type="button"
            className="btn btn-secondary btn-sm"
            onClick={() => {
              setOrdersDateFromFilter('');
              setOrdersDateToFilter('');
              setOrdersPage(1);
            }}
          >
            {t('vendor.orders.resetPeriod')}
          </button>
        )}
      </div>
    </>
  );
}
