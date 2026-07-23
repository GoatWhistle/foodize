import { adminService } from '../../services/adminService';
import { QRCodeModal } from '../../components/QRCodeModal/QRCodeModal';
import { AdminSidebar } from './components/AdminSidebar';
import { AdminBatchBars } from './components/AdminBatchBars';
import { AdminEntityTabs } from './components/AdminEntityTabs';
import { AdminStatsTab } from './tabs/AdminStatsTab';
import { AdminFinanceTab } from './tabs/AdminFinanceTab';
import { AdminAuditTab } from './tabs/AdminAuditTab';
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

        <AdminEntityTabs dashboard={dashboard} />

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
