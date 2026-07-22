import { formatOptionsSummary } from "@shared/utils/price";
import type { Order } from "@shared/types/models";
import { useTranslation } from "@shared/i18n/useTranslation";
import styles from "./OrderStatusSections.module.css";
import { formatPrice } from "@shared/utils/price";

interface OrderStatusSkeletonProps {
  screenClassName: string;
  loadError: string;
}

export const OrderStatusSkeleton = ({ screenClassName, loadError }: OrderStatusSkeletonProps) => {
  const { t } = useTranslation();
  return (
  <div className={screenClassName} role="status" aria-busy="true" aria-label={t("order.status.loadingLabel")}>
    {loadError && (
      <div className={`form-error ${styles['skeletonError']}`}>{loadError}</div>
    )}
    <div className={`skeleton ${styles['skelLabel']}`} />
    <div className={`skeleton ${styles['skelNumber']}`} />
    <div className={`skeleton ${styles['skelPill']}`} />
    <div className={styles['skelCard']}>
      {[1, 2, 3].map((i) => (
        <div key={i} className={styles['skelRow']}>
          <div className={`skeleton ${styles['skelRowName']}`} />
          <div className={`skeleton ${styles['skelRowValue']}`} />
        </div>
      ))}
    </div>
  </div>
  );
};

interface OrderDetailsProps {
  order: Order;
}

export const OrderDetails = ({ order }: OrderDetailsProps) => {
  const { t } = useTranslation();
  return (
  <>
    <div className={styles['detailsCard']}>
      <div className={styles['detailsTitle']}>{t("order.details.composition")}</div>
      {Array.isArray(order.items) && order.items.map((item) => (
        <div key={item.id} className={styles['itemRow']}>
          <span className={styles['itemQty']}>×{item.quantity}</span>
          <div className={styles['itemBody']}>
            <div className={styles['itemName']}>{item.menu_item_name}</div>
            {item.selected_options.length > 0 && (
              <div className={styles['itemOptions']}>{formatOptionsSummary(item.selected_options)}</div>
            )}
          </div>
          <span className={styles['itemPrice']}>{formatPrice(item.price_at_purchase * item.quantity)}</span>
        </div>
      ))}
      <div className={styles['totalRow']}>
        <span className={styles['totalLabel']}>{t("order.details.total")}</span>
        <span className={styles['totalValue']}>{formatPrice(order.total_price)}</span>
      </div>
    </div>

    {(order.restaurant_name || order.restaurant_address) && (
      <div className={styles['restaurantCard']}>
        {order.restaurant_name && (
          <div className={styles['restaurantName']}>{order.restaurant_name}</div>
        )}
        {order.restaurant_address && (
          <div className={styles['restaurantAddress']}>{order.restaurant_address}</div>
        )}
      </div>
    )}
  </>
  );
};
