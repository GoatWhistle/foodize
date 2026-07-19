import { adminService } from '../../services/adminService';
import { QRCodeModal } from '../../components/QRCodeModal/QRCodeModal';
import { AdminSidebar } from './components/AdminSidebar';
import { AdminBatchBars } from './components/AdminBatchBars';
import { AdminStatsTab } from './tabs/AdminStatsTab';
import { AdminFinanceTab } from './tabs/AdminFinanceTab';
import { AdminAuditTab } from './tabs/AdminAuditTab';
import { AdminUsersTab } from './tabs/AdminUsersTab';
import { AdminOrdersTab } from './tabs/AdminOrdersTab';
import { AdminResolutionTab } from './tabs/AdminResolutionTab';
import { AdminRestaurantsTab } from './tabs/AdminRestaurantsTab';
import { AdminVendorsTab } from './tabs/AdminVendorsTab';
import { AdminReviewsTab } from './tabs/AdminReviewsTab';
import { AdminDetailModals, ReasonDialog } from './tabs/AdminDetailModals';
import { useAdminDashboard, PAGE_SIZE } from './useAdminDashboard';
import styles from './AdminDashboardPage.module.css';

export const AdminDashboardPage = () => {
  const dashboard = useAdminDashboard();

  return (
    <div className={`page-enter ${styles['page']}`}>
      <AdminSidebar
        activeTab={dashboard.activeTab}
        setActiveTab={dashboard.setActiveTab}
        entitiesOpen={dashboard.entitiesOpen}
        setEntitiesOpen={dashboard.setEntitiesOpen}
      />

      <div
        className={styles['main']}
        role="tabpanel"
        id={`admin-panel-${dashboard.activeTab}`}
      >
        <div aria-live="assertive">
          {dashboard.actionError && (
            <div className={`form-error ${styles['errorBanner']}`} role="alert">{dashboard.actionError}</div>
          )}
        </div>
        <div aria-live="polite">
          {dashboard.actionSuccess && (
            <div className={styles['successBanner']} role="status">
              {dashboard.actionSuccess}
            </div>
          )}
        </div>

        {dashboard.activeTab === 'stats' && (
          <AdminStatsTab
            stats={dashboard.stats}
            ordersByStatusChartData={dashboard.ordersByStatusChartData}
            setActiveTab={dashboard.setActiveTab}
          />
        )}

        {dashboard.activeTab === 'finance' && (
          <AdminFinanceTab
            finance={dashboard.finance}
            financeLoading={dashboard.financeLoading}
            advancedAnalytics={dashboard.advancedAnalytics}
            analyticsLoading={dashboard.analyticsLoading}
            financeFilters={dashboard.financeFilters}
            setFinanceFilters={dashboard.setFinanceFilters}
            activePreset={dashboard.activePreset}
            setActivePreset={dashboard.setActivePreset}
            allRestaurants={dashboard.allRestaurants}
            exportLoading={dashboard.exportLoading}
            handleExport={(fn, name) => { void dashboard.handleExport(fn, name); }}
            todayStr={dashboard.todayStr}
            adminService={adminService}
            getRestaurantLabel={dashboard.getRestaurantLabel}
            getDateRangeLabel={dashboard.getDateRangeLabel}
          />
        )}

        {dashboard.activeTab === 'audit' && (
          <AdminAuditTab
            auditLogs={dashboard.auditLogs}
            auditLoading={dashboard.auditLoading}
            auditTotal={dashboard.auditTotal}
            auditPage={dashboard.auditPage}
            setAuditPage={dashboard.setAuditPage}
            auditFilters={dashboard.auditFilters}
            setAuditFilters={dashboard.setAuditFilters}
            expandedAuditId={dashboard.expandedAuditId}
            setExpandedAuditId={dashboard.setExpandedAuditId}
            PAGE_SIZE={PAGE_SIZE}
          />
        )}

        {dashboard.activeTab === 'users' && (
          <AdminUsersTab
            users={dashboard.users}
            usersLoading={dashboard.usersLoading}
            usersTotal={dashboard.usersTotal}
            usersPage={dashboard.usersPage}
            setUsersPage={dashboard.setUsersPage}
            userSearchRaw={dashboard.userSearchRaw}
            setUserSearchRaw={dashboard.setUserSearchRaw}
            userFilters={dashboard.userFilters}
            setUserFilters={dashboard.setUserFilters}
            selectedUserIds={dashboard.selectedUserIds}
            setSelectedUserIds={dashboard.setSelectedUserIds}
            exportLoading={dashboard.exportLoading}
            handleExport={(fn, name) => { void dashboard.handleExport(fn, name); }}
            loadUserDetails={(id) => { void dashboard.loadUserDetails(id); }}
            handleDeleteUser={dashboard.handleDeleteUser}
            currentUser={dashboard.currentUser}
            todayStr={dashboard.todayStr}
            adminService={adminService}
            PAGE_SIZE={PAGE_SIZE}
          />
        )}

        {dashboard.activeTab === 'orders' && (
          <AdminOrdersTab
            orders={dashboard.orders}
            ordersLoading={dashboard.ordersLoading}
            ordersTotal={dashboard.ordersTotal}
            ordersPage={dashboard.ordersPage}
            setOrdersPage={dashboard.setOrdersPage}
            orderSearchRaw={dashboard.orderSearchRaw}
            setOrderSearchRaw={dashboard.setOrderSearchRaw}
            orderFilters={dashboard.orderFilters}
            setOrderFilters={dashboard.setOrderFilters}
            exportLoading={dashboard.exportLoading}
            handleExport={(fn, name) => { void dashboard.handleExport(fn, name); }}
            setSelectedOrder={dashboard.setSelectedOrder}
            todayStr={dashboard.todayStr}
            adminService={adminService}
            PAGE_SIZE={PAGE_SIZE}
          />
        )}

        {dashboard.activeTab === 'resolution' && (
          <AdminResolutionTab
            orders={dashboard.orders}
            ordersLoading={dashboard.ordersLoading}
            ordersTotal={dashboard.ordersTotal}
            ordersPage={dashboard.ordersPage}
            setOrdersPage={dashboard.setOrdersPage}
            orderSearchRaw={dashboard.orderSearchRaw}
            setOrderSearchRaw={dashboard.setOrderSearchRaw}
            orderFilters={dashboard.orderFilters}
            setOrderFilters={dashboard.setOrderFilters}
            setSelectedOrder={dashboard.setSelectedOrder}
            setReasonDialog={dashboard.setReasonDialog}
            setActionError={() => {}}
            adminService={adminService}
            PAGE_SIZE={PAGE_SIZE}
          />
        )}

        {dashboard.activeTab === 'restaurants' && (
          <AdminRestaurantsTab
            restaurants={dashboard.restaurants}
            restaurantsLoading={dashboard.restaurantsLoading}
            restaurantsTotal={dashboard.restaurantsTotal}
            restaurantsPage={dashboard.restaurantsPage}
            setRestaurantsPage={dashboard.setRestaurantsPage}
            restaurantSearchRaw={dashboard.restaurantSearchRaw}
            setRestaurantSearchRaw={dashboard.setRestaurantSearchRaw}
            restaurantVendorSearchRaw={dashboard.restaurantVendorSearchRaw}
            setRestaurantVendorSearchRaw={dashboard.setRestaurantVendorSearchRaw}
            restaurantFilters={dashboard.restaurantFilters}
            setRestaurantFilters={dashboard.setRestaurantFilters}
            selectedRestaurantIds={dashboard.selectedRestaurantIds}
            setSelectedRestaurantIds={dashboard.setSelectedRestaurantIds}
            exportLoading={dashboard.exportLoading}
            handleExport={(fn, name) => { void dashboard.handleExport(fn, name); }}
            loadRestaurantDetails={(id) => { void dashboard.loadRestaurantDetails(id); }}
            todayStr={dashboard.todayStr}
            adminService={adminService}
            PAGE_SIZE={PAGE_SIZE}
          />
        )}

        {dashboard.activeTab === 'vendors' && (
          <AdminVendorsTab
            vendors={dashboard.vendors}
            vendorsLoading={dashboard.vendorsLoading}
            vendorsTotal={dashboard.vendorsTotal}
            vendorsPage={dashboard.vendorsPage}
            setVendorsPage={dashboard.setVendorsPage}
            vendorSearchRaw={dashboard.vendorSearchRaw}
            setVendorSearchRaw={dashboard.setVendorSearchRaw}
            vendorFilters={dashboard.vendorFilters}
            setVendorFilters={dashboard.setVendorFilters}
            selectedVendorIds={dashboard.selectedVendorIds}
            setSelectedVendorIds={dashboard.setSelectedVendorIds}
            exportLoading={dashboard.exportLoading}
            handleExport={(fn, name) => { void dashboard.handleExport(fn, name); }}
            loadVendorDetails={(id) => { void dashboard.loadVendorDetails(id); }}
            todayStr={dashboard.todayStr}
            adminService={adminService}
            PAGE_SIZE={PAGE_SIZE}
          />
        )}

        {dashboard.activeTab === 'reviews' && (
          <AdminReviewsTab
            reviews={dashboard.reviews}
            reviewsLoading={dashboard.reviewsLoading}
            reviewsTotal={dashboard.reviewsTotal}
            reviewsPage={dashboard.reviewsPage}
            setReviewsPage={dashboard.setReviewsPage}
            reviewFilters={dashboard.reviewFilters}
            setReviewFilters={dashboard.setReviewFilters}
            selectedReviewIds={dashboard.selectedReviewIds}
            setSelectedReviewIds={dashboard.setSelectedReviewIds}
            exportLoading={dashboard.exportLoading}
            handleExport={(fn, name) => { void dashboard.handleExport(fn, name); }}
            handleDeleteReview={dashboard.handleDeleteReview}
            todayStr={dashboard.todayStr}
            adminService={adminService}
            PAGE_SIZE={PAGE_SIZE}
          />
        )}

        <AdminDetailModals
          selectedUser={dashboard.selectedUser}
          setSelectedUser={dashboard.setSelectedUser}
          userDetailsLoading={dashboard.userDetailsLoading}
          currentUser={dashboard.currentUser}
          permissionActionLoading={dashboard.permissionActionLoading}
          handleSetPermissionPreset={dashboard.handleSetPermissionPreset}
          handleMakeAdmin={dashboard.handleMakeAdmin}
          handleActivateUser={(userId) => { void dashboard.handleActivateUser(userId); }}
          handleDeleteUser={dashboard.handleDeleteUser}
          selectedRestaurant={dashboard.selectedRestaurant}
          setSelectedRestaurant={dashboard.setSelectedRestaurant}
          restaurantDetailsLoading={dashboard.restaurantDetailsLoading}
          approveLoading={dashboard.approveLoading}
          handleApproveRestaurant={(restaurantId) => { void dashboard.handleApproveRestaurant(restaurantId); }}
          handleRejectRestaurant={dashboard.handleRejectRestaurant}
          handleDeleteRestaurant={dashboard.handleDeleteRestaurant}
          setQrType={dashboard.setQrType}
          setQrRestaurant={dashboard.setQrRestaurant}
          selectedVendor={dashboard.selectedVendor}
          setSelectedVendor={dashboard.setSelectedVendor}
          vendorDetailsLoading={dashboard.vendorDetailsLoading}
          handleApproveVendor={dashboard.handleApproveVendor}
          handleRejectVendor={dashboard.handleRejectVendor}
          handleDeleteVendor={dashboard.handleDeleteVendor}
          selectedOrder={dashboard.selectedOrder}
          setSelectedOrder={dashboard.setSelectedOrder}
        />

        <ReasonDialog
          dialog={dashboard.reasonDialog}
          loading={dashboard.reasonLoading}
          onCancel={() => { dashboard.setReasonDialog(null); }}
          onConfirm={(reason) => { void dashboard.runReasonAction(reason); }}
        />

        <AdminBatchBars dashboard={dashboard} />

        {dashboard.qrRestaurant && (
          <QRCodeModal
            restaurant={dashboard.qrRestaurant}
            initialType={dashboard.qrType}
            onClose={() => { dashboard.setQrRestaurant(null); }}
          />
        )}
      </div>
    </div>
  );
};
