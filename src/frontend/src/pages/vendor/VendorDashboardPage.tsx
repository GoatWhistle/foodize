import { StorefrontIcon } from '@phosphor-icons/react';
import type { Order } from '@shared/types/models';
import { ORDER_STATUS_RU } from '@shared/utils/locales';
import { QRCodeModal } from '../../components/QRCodeModal/QRCodeModal';
import { vendorService } from '@shared/services/vendorService';
import { VendorRestaurantList } from './VendorRestaurantList';
import { VendorSidebar } from './VendorSidebar';
import { VendorApprovalBanner } from './VendorApprovalBanner';
import { VendorTabContent } from './components/VendorTabContent';
import { useVendorDashboard } from './useVendorDashboard';

const STATUS_LABEL_RU = ORDER_STATUS_RU;

interface OrderGroup {
  dateKey: string;
  title: string;
  orders: Order[];
}

const toDateInputValue = (date: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const getOrderDisplayId = (order: Order): string | number => order.display_id;

const formatOrderTime = (value?: string | null): string => {
  if (!value) return '';
  return new Intl.DateTimeFormat('ru-RU', { hour: '2-digit', minute: '2-digit' }).format(
    new Date(value)
  );
};

const groupOrdersByDate = (orders: Order[]): OrderGroup[] => {
  const today = new Date();
  const yesterday = new Date();
  yesterday.setDate(today.getDate() - 1);

  const formatGroup = (dateKey: string): string => {
    if (dateKey === 'unknown') return 'Без даты';
    if (dateKey === toDateInputValue(today)) return 'Сегодня';
    if (dateKey === toDateInputValue(yesterday)) return 'Вчера';
    return new Intl.DateTimeFormat('ru-RU', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    }).format(new Date(`${dateKey}T00:00:00`));
  };

  return (Array.isArray(orders) ? orders : []).reduce<OrderGroup[]>((groups, order) => {
    const dateKey = order.created_at
      ? toDateInputValue(new Date(order.created_at))
      : 'unknown';
    const group = groups.find((g) => g.dateKey === dateKey);
    if (group) {
      group.orders.push(order);
    } else {
      groups.push({ dateKey, title: formatGroup(dateKey), orders: [order] });
    }
    return groups;
  }, []);
};

const todayStr = (() => {
  const dashboard = new Date();
  return `${dashboard.getFullYear()}-${String(dashboard.getMonth() + 1).padStart(2, '0')}-${String(dashboard.getDate()).padStart(2, '0')}`;
})();

export const VendorDashboardPage = () => {
  const dashboard = useVendorDashboard();

  const getVendorRestaurantLabel = () =>
    (dashboard.selectedRestaurant?.name || 'все').replace(/\s+/g, '_');

  const getVendorDateRange = () => {
    const from = dashboard.financeFilters.date_from || todayStr;
    const to = dashboard.financeFilters.date_to || todayStr;
    return `${from}_${to}`;
  };

  const handleVendorExport = (
    exportFn: () => ReturnType<typeof vendorService.exportMenuCSV>,
    filename: string
  ): void => {
    void dashboard.handleVendorExport(exportFn, filename);
  };

  const groupedRestaurantOrders = groupOrdersByDate(dashboard.restaurantOrders);

  return (
    <div className="vendor-page page-enter">
      <h1
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          fontSize: "var(--text-xl)",
          fontWeight: 800,
          letterSpacing: '-0.03em',
          marginBottom: 16,
        }}
      >
        <StorefrontIcon /> Дашборд вендора
      </h1>

      <VendorApprovalBanner vendorProfile={dashboard.vendorProfile} />

      <VendorRestaurantList
        restaurants={dashboard.restaurants}
        loading={dashboard.loading}
        selectedRestaurant={dashboard.selectedRestaurant}
        setSelectedRestaurant={dashboard.setSelectedRestaurant}
        vendorProfile={dashboard.vendorProfile}
        showAddRestaurant={dashboard.showAddRestaurant}
        setShowAddRestaurant={dashboard.setShowAddRestaurant}
        newRestaurant={dashboard.newRestaurant}
        setNewRestaurant={dashboard.setNewRestaurant}
        formError={dashboard.formError}
        formLoading={dashboard.formLoading}
        handleCreateRestaurant={(e) => {
          void dashboard.handleCreateRestaurant(e);
        }}
      />

      {dashboard.selectedRestaurant && (
        <div style={{ display: 'flex', gap: 24, alignItems: 'flex-start', marginTop: 24 }}>
          <VendorSidebar
            selectedRestaurant={dashboard.selectedRestaurant}
            activeTab={dashboard.activeTab}
            setActiveTab={dashboard.setActiveTab}
            setEditRestaurant={dashboard.setEditRestaurant}
            setQrType={dashboard.setQrType}
            setShowQr={dashboard.setShowQr}
          />

          <VendorTabContent
            dashboard={dashboard}
            todayStr={todayStr}
            statusLabelRu={STATUS_LABEL_RU}
            groupedRestaurantOrders={groupedRestaurantOrders}
            handleVendorExport={handleVendorExport}
            getVendorRestaurantLabel={getVendorRestaurantLabel}
            getVendorDateRange={getVendorDateRange}
            getOrderDisplayId={getOrderDisplayId}
            formatOrderTime={formatOrderTime}
          />
        </div>
      )}

      {dashboard.showQr && dashboard.selectedRestaurant && (
        <QRCodeModal
          restaurant={dashboard.selectedRestaurant}
          initialType={dashboard.qrType}
          onClose={() => { dashboard.setShowQr(false); }}
        />
      )}
    </div>
  );
};
