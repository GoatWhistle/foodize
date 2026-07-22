import type { Order } from '@shared/types/models';
import { vendorService } from '@shared/services/vendorService';
import { VendorMenuTab } from '../tabs/VendorMenuTab';
import { VendorOrdersTab } from '../tabs/VendorOrdersTab';
import { VendorPromosTab } from '../tabs/VendorPromosTab';
import { VendorScheduleTab } from '../tabs/VendorScheduleTab';
import { VendorStaffTab } from '../tabs/VendorStaffTab';
import { VendorAnalyticsTab } from '../tabs/VendorAnalyticsTab';
import { VendorSettingsTab } from '../tabs/VendorSettingsTab';
import { VendorAdvisorPanel } from '../VendorAdvisorPanel';
import type { useVendorDashboard } from '../useVendorDashboard';

interface OrderGroup {
  dateKey: string;
  title: string;
  orders: Order[];
}

interface VendorTabContentProps {
  dashboard: ReturnType<typeof useVendorDashboard>;
  todayStr: string;
  groupedRestaurantOrders: OrderGroup[];
  handleVendorExport: (
    exportFn: () => ReturnType<typeof vendorService.exportMenuCSV>,
    filename: string
  ) => void;
  getVendorRestaurantLabel: () => string;
  getVendorDateRange: () => string;
  getOrderDisplayId: (order: Order) => string | number;
  formatOrderTime: (value?: string | null) => string;
}

export function VendorTabContent({
  dashboard,
  todayStr,
  groupedRestaurantOrders,
  handleVendorExport,
  getVendorRestaurantLabel,
  getVendorDateRange,
  getOrderDisplayId,
  formatOrderTime,
}: VendorTabContentProps) {
  if (!dashboard.selectedRestaurant) return null;

  return (
    <div className="vendor-section" style={{ flex: 1, minWidth: 0, margin: 0 }}>
      {dashboard.activeTab === 'menu' && (
        <VendorMenuTab
          selectedRestaurant={dashboard.selectedRestaurant}
          selectedMenu={dashboard.selectedMenu}
          loading={dashboard.loading}
          exportLoading={dashboard.exportLoading}
          todayStr={todayStr}
          showAddItem={dashboard.showAddItem}
          setShowAddItem={dashboard.setShowAddItem}
          editingItem={dashboard.editingItem}
          setEditingItem={dashboard.setEditingItem}
          menuItemForm={dashboard.menuItemForm}
          setMenuItemForm={dashboard.setMenuItemForm}
          formLoading={dashboard.formLoading}
          formError={dashboard.formError}
          menuError={dashboard.menuError}
          menuSuccess={dashboard.menuSuccess}
          handleSaveMenuItem={(e) => {
            void dashboard.handleSaveMenuItem(e);
          }}
          handleDeleteMenuItem={dashboard.handleDeleteMenuItem}
          handleVendorExport={handleVendorExport}
          vendorService={vendorService}
        />
      )}

      {dashboard.activeTab === 'orders' && (
        <VendorOrdersTab
          restaurantOrders={dashboard.restaurantOrders}
          ordersPage={dashboard.ordersPage}
          setOrdersPage={dashboard.setOrdersPage}
          ordersTotal={dashboard.ordersTotal}
          ordersStatusFilter={dashboard.ordersStatusFilter}
          setOrdersStatusFilter={dashboard.setOrdersStatusFilter}
          ordersDateFromFilter={dashboard.ordersDateFromFilter}
          setOrdersDateFromFilter={dashboard.setOrdersDateFromFilter}
          ordersDateToFilter={dashboard.ordersDateToFilter}
          setOrdersDateToFilter={dashboard.setOrdersDateToFilter}
          ordersLoading={dashboard.ordersLoading}
          exportLoading={dashboard.exportLoading}
          updatingOrderId={dashboard.updatingOrderId}
          selectedOrder={dashboard.selectedOrder}
          setSelectedOrder={dashboard.setSelectedOrder}
          todayStr={todayStr}
          groupedRestaurantOrders={groupedRestaurantOrders}
          ordersError={dashboard.ordersError}
          handleVendorExport={handleVendorExport}
          fetchVendorOrders={() => {
            void dashboard.fetchVendorOrders();
          }}
          handleOrderChange={dashboard.handleOrderChange}
          handleCancelOrder={dashboard.handleCancelOrder}
          vendorService={vendorService}
          selectedRestaurant={dashboard.selectedRestaurant}
          getOrderDisplayId={getOrderDisplayId}
          formatOrderTime={formatOrderTime}
        />
      )}

      {dashboard.activeTab === 'promos' && (
        <VendorPromosTab
          selectedRestaurant={dashboard.selectedRestaurant}
          promosList={dashboard.promosList}
          promosLoading={dashboard.promosLoading}
          promosError={dashboard.promosError}
          promosSuccess={dashboard.promosSuccess}
          showPromoForm={dashboard.showPromoForm}
          setShowPromoForm={dashboard.setShowPromoForm}
          promoForm={dashboard.promoForm}
          setPromoForm={dashboard.setPromoForm}
          promoFormLoading={dashboard.promoFormLoading}
          deactivatingPromo={dashboard.deactivatingPromo}
          handleCreatePromo={(e) => {
            void dashboard.handleCreatePromo(e);
          }}
          handleDeactivatePromo={(code) => {
            void dashboard.handleDeactivatePromo(code);
          }}
        />
      )}

      {dashboard.activeTab === 'schedule' && (
        <VendorScheduleTab
          workingHours={dashboard.workingHours}
          setWorkingHours={dashboard.setWorkingHours}
          workingHoursLoading={dashboard.workingHoursLoading}
          workingHoursSaved={dashboard.workingHoursSaved}
          workingHoursError={dashboard.workingHoursError}
          handleSaveWorkingHours={() => {
            void dashboard.handleSaveWorkingHours();
          }}
        />
      )}

      {dashboard.activeTab === 'staff' && (
        <VendorStaffTab
          staffSubTab={dashboard.staffSubTab}
          setStaffSubTab={dashboard.setStaffSubTab}
          staffMembers={dashboard.staffMembers}
          staffMembersTotal={dashboard.staffMembersTotal}
          staffMembersPage={dashboard.staffMembersPage}
          setStaffMembersPage={dashboard.setStaffMembersPage}
          staffMemberRemoving={dashboard.staffMemberRemoving}
          handleRemoveStaffMember={(profileId) => {
            void dashboard.handleRemoveStaffMember(profileId);
          }}
          staffRequests={dashboard.staffRequests}
          staffTotal={dashboard.staffTotal}
          staffPage={dashboard.staffPage}
          setStaffPage={dashboard.setStaffPage}
          staffDecisionLoading={dashboard.staffDecisionLoading}
          handleStaffDecision={(requestId, status) => {
            void dashboard.handleStaffDecision(requestId, status);
          }}
        />
      )}

      {dashboard.activeTab === 'analytics' && (
        <VendorAnalyticsTab
          finance={dashboard.finance}
          financeLoading={dashboard.financeLoading}
          advancedAnalytics={dashboard.advancedAnalytics}
          analyticsLoading={dashboard.analyticsLoading}
          financeFilters={dashboard.financeFilters}
          setFinanceFilters={dashboard.setFinanceFilters}
          activePreset={dashboard.activePreset}
          setActivePreset={dashboard.setActivePreset}
          exportLoading={dashboard.exportLoading}
          handleVendorExport={handleVendorExport}
          vendorService={vendorService}
          selectedRestaurant={dashboard.selectedRestaurant}
          getVendorRestaurantLabel={getVendorRestaurantLabel}
          getVendorDateRange={getVendorDateRange}
        />
      )}

      {dashboard.activeTab === 'ai' && (
        <VendorAdvisorPanel restaurantId={dashboard.selectedRestaurant.id} />
      )}

      {dashboard.activeTab === 'settings' && (
        <VendorSettingsTab
          selectedRestaurant={dashboard.selectedRestaurant}
          editRestaurant={dashboard.editRestaurant}
          setEditRestaurant={dashboard.setEditRestaurant}
          formError={dashboard.formError}
          formLoading={dashboard.formLoading}
          handleUpdateRestaurant={(e) => {
            void dashboard.handleUpdateRestaurant(e);
          }}
        />
      )}
    </div>
  );
}
