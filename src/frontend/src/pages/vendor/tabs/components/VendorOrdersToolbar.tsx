import type { Dispatch, SetStateAction } from 'react';
import { ArrowsClockwiseIcon, DownloadSimpleIcon } from '@phosphor-icons/react';
import type { Restaurant } from '@shared/types/models';
import styles from './VendorOrders.module.css';

const STATUS_CHIPS: { key: string; label: string }[] = [
  { key: '', label: 'Все' },
  { key: 'PENDING', label: 'Новые' },
  { key: 'ACCEPTED', label: 'Принятые' },
  { key: 'READY', label: 'Готовые' },
  { key: 'COMPLETED', label: 'Выданные' },
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
  return (
    <>
      <div className={styles['header']}>
        <div>
          <div className={styles['headerTitle']}>Заказы заведения</div>
          <div className={styles['headerSubtitle']}>
            Новые заказы обновляются автоматически
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
                `заказы_${todayStr}.csv`
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
            {ordersLoading ? '...' : 'Обновить'}
          </button>
        </div>
      </div>
      <div className={styles['chips']}>
        {STATUS_CHIPS.map(({ key, label }) => (
          <button
            key={key}
            className={`category-chip${ordersStatusFilter === key ? ' active' : ''} ${styles['chip']}`}
            onClick={() => {
              setOrdersStatusFilter(key);
              setOrdersPage(1);
            }}
          >
            {label}
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
          aria-label="Дата с"
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
          aria-label="Дата по"
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
            Сбросить период
          </button>
        )}
      </div>
    </>
  );
}
