import { Storefront } from '@phosphor-icons/react';
import type { Order } from '@shared/types/models';
import { ORDER_STATUS_RU } from '@shared/utils/locales';
import QRCodeModal from '../../components/QRCodeModal/QRCodeModal';
import VendorAdvisorPanel from './VendorAdvisorPanel';
import { vendorService } from '@shared/services/vendorService';
import VendorMenuTab from './tabs/VendorMenuTab';
import VendorOrdersTab from './tabs/VendorOrdersTab';
import VendorPromosTab from './tabs/VendorPromosTab';
import VendorScheduleTab from './tabs/VendorScheduleTab';
import VendorStaffTab from './tabs/VendorStaffTab';
import VendorAnalyticsTab from './tabs/VendorAnalyticsTab';
import VendorSettingsTab from './tabs/VendorSettingsTab';
import VendorRestaurantList from './VendorRestaurantList';
import VendorSidebar from './VendorSidebar';
import VendorApprovalBanner from './VendorApprovalBanner';
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

const getOrderDisplayId = (order: Order): string | number =>
  order.display_id ?? order.id.slice(0, 8);

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
    const dateKey = order?.created_at
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
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
})();

const VendorDashboardPage = () => {
  const d = useVendorDashboard();

  const getVendorRestaurantLabel = () =>
    (d.selectedRestaurant?.name || 'все').replace(/\s+/g, '_');

  const getVendorDateRange = () => {
    const from = d.financeFilters.date_from || todayStr;
    const to = d.financeFilters.date_to || todayStr;
    return `${from}_${to}`;
  };

  const handleVendorExport = (
    exportFn: () => ReturnType<typeof vendorService.exportMenuCSV>,
    filename: string
  ): void => {
    void d.handleVendorExport(exportFn, filename);
  };

  const groupedRestaurantOrders = groupOrdersByDate(d.restaurantOrders);

  return (
    <div className="vendor-page page-enter">
      <h1
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          fontSize: '1.5rem',
          fontWeight: 800,
          letterSpacing: '-0.03em',
          marginBottom: 16,
        }}
      >
        <Storefront /> Дашборд вендора
      </h1>

      <VendorApprovalBanner vendorProfile={d.vendorProfile} />

      <VendorRestaurantList
        restaurants={d.restaurants}
        loading={d.loading}
        selectedRestaurant={d.selectedRestaurant}
        setSelectedRestaurant={d.setSelectedRestaurant}
        vendorProfile={d.vendorProfile}
        showAddRestaurant={d.showAddRestaurant}
        setShowAddRestaurant={d.setShowAddRestaurant}
        newRestaurant={d.newRestaurant}
        setNewRestaurant={d.setNewRestaurant}
        formError={d.formError}
        formLoading={d.formLoading}
        handleCreateRestaurant={(e) => {
          void d.handleCreateRestaurant(e);
        }}
      />

      {d.selectedRestaurant && (
        <div style={{ display: 'flex', gap: 24, alignItems: 'flex-start', marginTop: 24 }}>
          <VendorSidebar
            selectedRestaurant={d.selectedRestaurant}
            activeTab={d.activeTab}
            setActiveTab={d.setActiveTab}
            setEditRestaurant={d.setEditRestaurant}
            setQrType={d.setQrType}
            setShowQr={d.setShowQr}
          />

          <div className="vendor-section" style={{ flex: 1, minWidth: 0, margin: 0 }}>
            {d.activeTab === 'menu' && (
              <VendorMenuTab
                selectedRestaurant={d.selectedRestaurant}
                selectedMenu={d.selectedMenu}
                loading={d.loading}
                exportLoading={d.exportLoading}
                todayStr={todayStr}
                showAddItem={d.showAddItem}
                setShowAddItem={d.setShowAddItem}
                editingItem={d.editingItem}
                setEditingItem={d.setEditingItem}
                menuItemForm={d.menuItemForm}
                setMenuItemForm={d.setMenuItemForm}
                formLoading={d.formLoading}
                formError={d.formError}
                menuError={d.menuError}
                menuSuccess={d.menuSuccess}
                handleSaveMenuItem={(e) => {
                  void d.handleSaveMenuItem(e);
                }}
                handleDeleteMenuItem={d.handleDeleteMenuItem}
                handleVendorExport={handleVendorExport}
                vendorService={vendorService}
              />
            )}

            {d.activeTab === 'orders' && (
              <VendorOrdersTab
                restaurantOrders={d.restaurantOrders}
                ordersPage={d.ordersPage}
                setOrdersPage={d.setOrdersPage}
                ordersTotal={d.ordersTotal}
                ordersStatusFilter={d.ordersStatusFilter}
                setOrdersStatusFilter={d.setOrdersStatusFilter}
                ordersDateFromFilter={d.ordersDateFromFilter}
                setOrdersDateFromFilter={d.setOrdersDateFromFilter}
                ordersDateToFilter={d.ordersDateToFilter}
                setOrdersDateToFilter={d.setOrdersDateToFilter}
                ordersLoading={d.ordersLoading}
                exportLoading={d.exportLoading}
                updatingOrderId={d.updatingOrderId}
                selectedOrder={d.selectedOrder}
                setSelectedOrder={d.setSelectedOrder}
                todayStr={todayStr}
                groupedRestaurantOrders={groupedRestaurantOrders}
                ordersError={d.ordersError}
                handleVendorExport={handleVendorExport}
                fetchVendorOrders={() => {
                  void d.fetchVendorOrders();
                }}
                handleOrderChange={d.handleOrderChange}
                handleCancelOrder={d.handleCancelOrder}
                vendorService={vendorService}
                selectedRestaurant={d.selectedRestaurant}
                STATUS_LABEL_RU={STATUS_LABEL_RU}
                getOrderDisplayId={getOrderDisplayId}
                formatOrderTime={formatOrderTime}
              />
            )}

            {d.activeTab === 'promos' && (
              <VendorPromosTab
                selectedRestaurant={d.selectedRestaurant}
                promosList={d.promosList}
                promosLoading={d.promosLoading}
                promosError={d.promosError}
                promosSuccess={d.promosSuccess}
                showPromoForm={d.showPromoForm}
                setShowPromoForm={d.setShowPromoForm}
                promoForm={d.promoForm}
                setPromoForm={d.setPromoForm}
                promoFormLoading={d.promoFormLoading}
                deactivatingPromo={d.deactivatingPromo}
                handleCreatePromo={(e) => {
                  void d.handleCreatePromo(e);
                }}
                handleDeactivatePromo={(code) => {
                  void d.handleDeactivatePromo(code);
                }}
              />
            )}

            {d.activeTab === 'schedule' && (
              <VendorScheduleTab
                workingHours={d.workingHours}
                setWorkingHours={d.setWorkingHours}
                workingHoursLoading={d.workingHoursLoading}
                workingHoursSaved={d.workingHoursSaved}
                workingHoursError={d.workingHoursError}
                handleSaveWorkingHours={() => {
                  void d.handleSaveWorkingHours();
                }}
              />
            )}

            {d.activeTab === 'staff' && (
              <VendorStaffTab
                staffSubTab={d.staffSubTab}
                setStaffSubTab={d.setStaffSubTab}
                staffMembers={d.staffMembers}
                staffMembersTotal={d.staffMembersTotal}
                staffMembersPage={d.staffMembersPage}
                setStaffMembersPage={d.setStaffMembersPage}
                staffMemberRemoving={d.staffMemberRemoving}
                handleRemoveStaffMember={(profileId) => {
                  void d.handleRemoveStaffMember(profileId);
                }}
                staffRequests={d.staffRequests}
                staffTotal={d.staffTotal}
                staffPage={d.staffPage}
                setStaffPage={d.setStaffPage}
                staffDecisionLoading={d.staffDecisionLoading}
                handleStaffDecision={(requestId, status) => {
                  void d.handleStaffDecision(requestId, status);
                }}
              />
            )}

            {d.activeTab === 'analytics' && (
              <VendorAnalyticsTab
                finance={d.finance}
                financeLoading={d.financeLoading}
                advancedAnalytics={d.advancedAnalytics}
                analyticsLoading={d.analyticsLoading}
                financeFilters={d.financeFilters}
                setFinanceFilters={d.setFinanceFilters}
                activePreset={d.activePreset}
                setActivePreset={d.setActivePreset}
                exportLoading={d.exportLoading}
                handleVendorExport={handleVendorExport}
                vendorService={vendorService}
                selectedRestaurant={d.selectedRestaurant}
                getVendorRestaurantLabel={getVendorRestaurantLabel}
                getVendorDateRange={getVendorDateRange}
              />
            )}

            {d.activeTab === 'ai' && (
              <VendorAdvisorPanel restaurantId={d.selectedRestaurant.id} />
            )}

            {d.activeTab === 'settings' && (
              <VendorSettingsTab
                selectedRestaurant={d.selectedRestaurant}
                editRestaurant={d.editRestaurant}
                setEditRestaurant={d.setEditRestaurant}
                formError={d.formError}
                formLoading={d.formLoading}
                handleUpdateRestaurant={(e) => {
                  void d.handleUpdateRestaurant(e);
                }}
              />
            )}
          </div>
        </div>
      )}

      {d.showQr && d.selectedRestaurant && (
        <QRCodeModal
          restaurant={d.selectedRestaurant}
          initialType={d.qrType}
          onClose={() => d.setShowQr(false)}
        />
      )}
    </div>
  );
};

export default VendorDashboardPage;
