import { adminService } from '../../services/adminService';
import QRCodeModal from '../../components/QRCodeModal/QRCodeModal';
import { AdminSidebar } from './components/AdminSidebar';
import { AdminBatchBars } from './components/AdminBatchBars';
import AdminStatsTab from './tabs/AdminStatsTab';
import AdminFinanceTab from './tabs/AdminFinanceTab';
import AdminAuditTab from './tabs/AdminAuditTab';
import AdminUsersTab from './tabs/AdminUsersTab';
import AdminOrdersTab from './tabs/AdminOrdersTab';
import AdminResolutionTab from './tabs/AdminResolutionTab';
import AdminRestaurantsTab from './tabs/AdminRestaurantsTab';
import AdminVendorsTab from './tabs/AdminVendorsTab';
import AdminReviewsTab from './tabs/AdminReviewsTab';
import AdminDetailModals, { ReasonDialog } from './tabs/AdminDetailModals';
import { useAdminDashboard, PAGE_SIZE } from './useAdminDashboard';

const AdminDashboardPage = () => {
  const d = useAdminDashboard();

  return (
    <div
      className="page-enter"
      style={{ padding: '80px 20px 100px', maxWidth: 1200, margin: '0 auto', display: 'flex', gap: 24, alignItems: 'flex-start' }}
    >
      <AdminSidebar
        activeTab={d.activeTab}
        setActiveTab={d.setActiveTab}
        entitiesOpen={d.entitiesOpen}
        setEntitiesOpen={d.setEntitiesOpen}
      />

      <div style={{ flex: 1, minWidth: 0 }}>
        {d.actionError && (
          <div className="form-error" style={{ marginBottom: 16 }}>{d.actionError}</div>
        )}
        {d.actionSuccess && (
          <div style={{
            marginBottom: 16, padding: '10px 12px', borderRadius: 'var(--r-sm)',
            border: '1px solid var(--color-success-border)', background: 'var(--color-success-bg)',
            color: 'var(--color-success-dim)', fontSize: '0.86rem', fontWeight: 700,
          }}>
            {d.actionSuccess}
          </div>
        )}

        {d.activeTab === 'stats' && (
          <AdminStatsTab
            stats={d.stats}
            ordersByStatusChartData={d.ordersByStatusChartData}
            setActiveTab={d.setActiveTab}
          />
        )}

        {d.activeTab === 'finance' && (
          <AdminFinanceTab
            finance={d.finance}
            financeLoading={d.financeLoading}
            advancedAnalytics={d.advancedAnalytics}
            analyticsLoading={d.analyticsLoading}
            financeFilters={d.financeFilters}
            setFinanceFilters={d.setFinanceFilters}
            activePreset={d.activePreset}
            setActivePreset={d.setActivePreset}
            allRestaurants={d.allRestaurants}
            exportLoading={d.exportLoading}
            handleExport={(fn, name) => { void d.handleExport(fn, name); }}
            todayStr={d.todayStr}
            adminService={adminService}
            getRestaurantLabel={d.getRestaurantLabel}
            getDateRangeLabel={d.getDateRangeLabel}
          />
        )}

        {d.activeTab === 'audit' && (
          <AdminAuditTab
            auditLogs={d.auditLogs}
            auditLoading={d.auditLoading}
            auditTotal={d.auditTotal}
            auditPage={d.auditPage}
            setAuditPage={d.setAuditPage}
            auditFilters={d.auditFilters}
            setAuditFilters={d.setAuditFilters}
            expandedAuditId={d.expandedAuditId}
            setExpandedAuditId={d.setExpandedAuditId}
            PAGE_SIZE={PAGE_SIZE}
          />
        )}

        {d.activeTab === 'users' && (
          <AdminUsersTab
            users={d.users}
            usersLoading={d.usersLoading}
            usersTotal={d.usersTotal}
            usersPage={d.usersPage}
            setUsersPage={d.setUsersPage}
            userSearchRaw={d.userSearchRaw}
            setUserSearchRaw={d.setUserSearchRaw}
            userFilters={d.userFilters}
            setUserFilters={d.setUserFilters}
            selectedUserIds={d.selectedUserIds}
            setSelectedUserIds={d.setSelectedUserIds}
            exportLoading={d.exportLoading}
            handleExport={(fn, name) => { void d.handleExport(fn, name); }}
            loadUserDetails={(id) => { void d.loadUserDetails(id); }}
            handleDeleteUser={d.handleDeleteUser}
            currentUser={d.currentUser}
            todayStr={d.todayStr}
            adminService={adminService}
            PAGE_SIZE={PAGE_SIZE}
          />
        )}

        {d.activeTab === 'orders' && (
          <AdminOrdersTab
            orders={d.orders}
            ordersLoading={d.ordersLoading}
            ordersTotal={d.ordersTotal}
            ordersPage={d.ordersPage}
            setOrdersPage={d.setOrdersPage}
            orderSearchRaw={d.orderSearchRaw}
            setOrderSearchRaw={d.setOrderSearchRaw}
            orderFilters={d.orderFilters}
            setOrderFilters={d.setOrderFilters}
            exportLoading={d.exportLoading}
            handleExport={(fn, name) => { void d.handleExport(fn, name); }}
            setSelectedOrder={d.setSelectedOrder}
            todayStr={d.todayStr}
            adminService={adminService}
            PAGE_SIZE={PAGE_SIZE}
          />
        )}

        {d.activeTab === 'resolution' && (
          <AdminResolutionTab
            orders={d.orders}
            ordersLoading={d.ordersLoading}
            ordersTotal={d.ordersTotal}
            ordersPage={d.ordersPage}
            setOrdersPage={d.setOrdersPage}
            orderSearchRaw={d.orderSearchRaw}
            setOrderSearchRaw={d.setOrderSearchRaw}
            orderFilters={d.orderFilters}
            setOrderFilters={d.setOrderFilters}
            setSelectedOrder={d.setSelectedOrder}
            setReasonDialog={d.setReasonDialog}
            setActionError={() => {}}
            adminService={adminService}
            PAGE_SIZE={PAGE_SIZE}
          />
        )}

        {d.activeTab === 'restaurants' && (
          <AdminRestaurantsTab
            restaurants={d.restaurants}
            restaurantsLoading={d.restaurantsLoading}
            restaurantsTotal={d.restaurantsTotal}
            restaurantsPage={d.restaurantsPage}
            setRestaurantsPage={d.setRestaurantsPage}
            restaurantSearchRaw={d.restaurantSearchRaw}
            setRestaurantSearchRaw={d.setRestaurantSearchRaw}
            restaurantVendorSearchRaw={d.restaurantVendorSearchRaw}
            setRestaurantVendorSearchRaw={d.setRestaurantVendorSearchRaw}
            restaurantFilters={d.restaurantFilters}
            setRestaurantFilters={d.setRestaurantFilters}
            selectedRestaurantIds={d.selectedRestaurantIds}
            setSelectedRestaurantIds={d.setSelectedRestaurantIds}
            exportLoading={d.exportLoading}
            handleExport={(fn, name) => { void d.handleExport(fn, name); }}
            loadRestaurantDetails={(id) => { void d.loadRestaurantDetails(id); }}
            todayStr={d.todayStr}
            adminService={adminService}
            PAGE_SIZE={PAGE_SIZE}
          />
        )}

        {d.activeTab === 'vendors' && (
          <AdminVendorsTab
            vendors={d.vendors}
            vendorsLoading={d.vendorsLoading}
            vendorsTotal={d.vendorsTotal}
            vendorsPage={d.vendorsPage}
            setVendorsPage={d.setVendorsPage}
            vendorSearchRaw={d.vendorSearchRaw}
            setVendorSearchRaw={d.setVendorSearchRaw}
            vendorFilters={d.vendorFilters}
            setVendorFilters={d.setVendorFilters}
            selectedVendorIds={d.selectedVendorIds}
            setSelectedVendorIds={d.setSelectedVendorIds}
            exportLoading={d.exportLoading}
            handleExport={(fn, name) => { void d.handleExport(fn, name); }}
            loadVendorDetails={(id) => { void d.loadVendorDetails(id); }}
            todayStr={d.todayStr}
            adminService={adminService}
            PAGE_SIZE={PAGE_SIZE}
          />
        )}

        {d.activeTab === 'reviews' && (
          <AdminReviewsTab
            reviews={d.reviews}
            reviewsLoading={d.reviewsLoading}
            reviewsTotal={d.reviewsTotal}
            reviewsPage={d.reviewsPage}
            setReviewsPage={d.setReviewsPage}
            reviewFilters={d.reviewFilters}
            setReviewFilters={d.setReviewFilters}
            selectedReviewIds={d.selectedReviewIds}
            setSelectedReviewIds={d.setSelectedReviewIds}
            exportLoading={d.exportLoading}
            handleExport={(fn, name) => { void d.handleExport(fn, name); }}
            handleDeleteReview={d.handleDeleteReview}
            todayStr={d.todayStr}
            adminService={adminService}
            PAGE_SIZE={PAGE_SIZE}
          />
        )}

        <AdminDetailModals
          selectedUser={d.selectedUser}
          setSelectedUser={d.setSelectedUser}
          userDetailsLoading={d.userDetailsLoading}
          currentUser={d.currentUser}
          permissionActionLoading={d.permissionActionLoading}
          handleSetPermissionPreset={d.handleSetPermissionPreset}
          handleMakeAdmin={d.handleMakeAdmin}
          handleActivateUser={(userId) => { void d.handleActivateUser(userId); }}
          handleDeleteUser={d.handleDeleteUser}
          selectedRestaurant={d.selectedRestaurant}
          setSelectedRestaurant={d.setSelectedRestaurant}
          restaurantDetailsLoading={d.restaurantDetailsLoading}
          approveLoading={d.approveLoading}
          handleApproveRestaurant={(restaurantId) => { void d.handleApproveRestaurant(restaurantId); }}
          handleRejectRestaurant={d.handleRejectRestaurant}
          handleDeleteRestaurant={d.handleDeleteRestaurant}
          setQrType={d.setQrType}
          setQrRestaurant={d.setQrRestaurant}
          selectedVendor={d.selectedVendor}
          setSelectedVendor={d.setSelectedVendor}
          vendorDetailsLoading={d.vendorDetailsLoading}
          handleApproveVendor={d.handleApproveVendor}
          handleRejectVendor={d.handleRejectVendor}
          handleDeleteVendor={d.handleDeleteVendor}
          selectedOrder={d.selectedOrder}
          setSelectedOrder={d.setSelectedOrder}
        />

        <ReasonDialog
          dialog={d.reasonDialog}
          loading={d.reasonLoading}
          onCancel={() => d.setReasonDialog(null)}
          onConfirm={(reason) => { void d.runReasonAction(reason); }}
        />

        <AdminBatchBars d={d} />

        {d.qrRestaurant && (
          <QRCodeModal
            restaurant={d.qrRestaurant}
            initialType={d.qrType}
            onClose={() => d.setQrRestaurant(null)}
          />
        )}
      </div>
    </div>
  );
};

export default AdminDashboardPage;
