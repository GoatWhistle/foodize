import { Storefront } from '@phosphor-icons/react';
import { ORDER_STATUS_RU } from '../../utils/locales';
import QRCodeModal from '../../components/ui/QRCodeModal';
import VendorAdvisorPanel from './VendorAdvisorPanel';
import { vendorService } from '../../services/vendorService';
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

const toDateInputValue = (date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const getOrderDisplayId = (order) => order.display_id ?? order.id.slice(0, 8);

const formatOrderTime = (value) => {
  if (!value) return '';
  return new Intl.DateTimeFormat('ru-RU', { hour: '2-digit', minute: '2-digit' }).format(
    new Date(value)
  );
};

const groupOrdersByDate = (orders) => {
  const today = new Date();
  const yesterday = new Date();
  yesterday.setDate(today.getDate() - 1);

  const formatGroup = (dateKey) => {
    if (dateKey === 'unknown') return 'Без даты';
    if (dateKey === toDateInputValue(today)) return 'Сегодня';
    if (dateKey === toDateInputValue(yesterday)) return 'Вчера';
    return new Intl.DateTimeFormat('ru-RU', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    }).format(new Date(`${dateKey}T00:00:00`));
  };

  return (Array.isArray(orders) ? orders : []).reduce((groups, order) => {
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
        handleCreateRestaurant={d.handleCreateRestaurant}
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
                handleSaveMenuItem={d.handleSaveMenuItem}
                handleDeleteMenuItem={d.handleDeleteMenuItem}
                handleVendorExport={d.handleVendorExport}
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
                handleVendorExport={d.handleVendorExport}
                fetchVendorOrders={d.fetchVendorOrders}
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
                handleCreatePromo={d.handleCreatePromo}
                handleDeactivatePromo={d.handleDeactivatePromo}
              />
            )}

            {d.activeTab === 'schedule' && (
              <VendorScheduleTab
                workingHours={d.workingHours}
                setWorkingHours={d.setWorkingHours}
                workingHoursLoading={d.workingHoursLoading}
                workingHoursSaved={d.workingHoursSaved}
                workingHoursError={d.workingHoursError}
                handleSaveWorkingHours={d.handleSaveWorkingHours}
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
                handleRemoveStaffMember={d.handleRemoveStaffMember}
                staffRequests={d.staffRequests}
                staffTotal={d.staffTotal}
                staffPage={d.staffPage}
                setStaffPage={d.setStaffPage}
                staffDecisionLoading={d.staffDecisionLoading}
                handleStaffDecision={d.handleStaffDecision}
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
                handleVendorExport={d.handleVendorExport}
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
                handleUpdateRestaurant={d.handleUpdateRestaurant}
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
