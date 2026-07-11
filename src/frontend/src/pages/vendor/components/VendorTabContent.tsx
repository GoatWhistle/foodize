import type { Order } from '@shared/types/models';
import { vendorService } from '@shared/services/vendorService';
import VendorMenuTab from '../tabs/VendorMenuTab';
import VendorOrdersTab from '../tabs/VendorOrdersTab';
import VendorPromosTab from '../tabs/VendorPromosTab';
import VendorScheduleTab from '../tabs/VendorScheduleTab';
import VendorStaffTab from '../tabs/VendorStaffTab';
import VendorAnalyticsTab from '../tabs/VendorAnalyticsTab';
import VendorSettingsTab from '../tabs/VendorSettingsTab';
import VendorAdvisorPanel from '../VendorAdvisorPanel';
import type { useVendorDashboard } from '../useVendorDashboard';

interface OrderGroup {
  dateKey: string;
  title: string;
  orders: Order[];
}

interface VendorTabContentProps {
  d: ReturnType<typeof useVendorDashboard>;
  todayStr: string;
  statusLabelRu: Record<string, string>;
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
  d,
  todayStr,
  statusLabelRu,
  groupedRestaurantOrders,
  handleVendorExport,
  getVendorRestaurantLabel,
  getVendorDateRange,
  getOrderDisplayId,
  formatOrderTime,
}: VendorTabContentProps) {
  if (!d.selectedRestaurant) return null;

  return (
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
          STATUS_LABEL_RU={statusLabelRu}
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
  );
}
