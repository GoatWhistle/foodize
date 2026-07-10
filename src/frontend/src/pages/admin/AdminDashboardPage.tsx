import { memo, useCallback } from 'react';
import type { ReactNode } from 'react';
import {
  ChartLineUp,
  UsersThree,
  Package,
  Storefront,
  Star,
  Clock,
  CaretDown,
  Rows,
  ShieldWarning,
} from '@phosphor-icons/react';
import { adminService } from '../../services/adminService';
import QRCodeModal from '../../components/QRCodeModal/QRCodeModal';
import BatchActionBar from '../../components/BatchActionBar/BatchActionBar';
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

const ENTITY_TAB_IDS = new Set(['users', 'orders', 'restaurants', 'vendors', 'reviews']);

interface TabDef {
  id: string;
  label: string;
  icon: ReactNode;
}

interface TabButtonProps {
  tab: TabDef;
  activeTab: string;
  indented?: boolean;
  onClick: (id: string) => void;
}

const TabButton = memo(({ tab, activeTab, indented, onClick }: TabButtonProps) => (
  <button
    className={`btn ${activeTab === tab.id ? 'btn-primary' : 'btn-secondary'}`}
    onClick={() => onClick(tab.id)}
    style={{
      justifyContent: 'flex-start',
      border: 'none',
      padding: indented ? '8px 16px' : '10px 16px',
      gap: 10,
      fontSize: indented ? '0.88rem' : '0.95rem',
      fontWeight: activeTab === tab.id ? 700 : 500,
    }}
  >
    {tab.icon}
    {tab.label}
  </button>
));

const AdminDashboardPage = () => {
  const d = useAdminDashboard();
  const { setActiveTab } = d;
  const handleTabClick = useCallback((id: string) => setActiveTab(id), [setActiveTab]);

  const tabs = [
    { id: 'stats', label: 'Статистика', icon: <ChartLineUp size={18} /> },
    { id: 'users', label: 'Пользователи', icon: <UsersThree size={18} /> },
    { id: 'orders', label: 'Заказы', icon: <Package size={18} /> },
    { id: 'resolution', label: 'Модерация', icon: <ShieldWarning size={18} /> },
    { id: 'restaurants', label: 'Рестораны', icon: <Storefront size={18} /> },
    { id: 'vendors', label: 'Вендоры', icon: <UsersThree size={18} /> },
    { id: 'reviews', label: 'Отзывы', icon: <Star size={18} /> },
    { id: 'finance', label: 'Аналитика', icon: <ChartLineUp size={18} /> },
    { id: 'audit', label: 'Логи', icon: <Clock size={18} /> },
  ];

  return (
    <div
      className="page-enter"
      style={{ padding: '80px 20px 100px', maxWidth: 1200, margin: '0 auto', display: 'flex', gap: 24, alignItems: 'flex-start' }}
    >
      <div
        className="admin-sidebar"
        style={{
          width: 240, flexShrink: 0, position: 'sticky', top: 80,
          display: 'flex', flexDirection: 'column', gap: 6,
          background: 'var(--bg-card)', padding: 16,
          borderRadius: 'var(--r-md)', border: '1px solid var(--border)',
        }}
      >
        <h1 style={{ fontSize: '1.2rem', fontWeight: 900, marginBottom: 16 }}>Админ-панель</h1>
        {tabs
          .filter((t) => t.id === 'stats')
          .map((tab) => <TabButton key={tab.id} tab={tab} activeTab={d.activeTab} onClick={handleTabClick} />)}
        <div>
          <button
            onClick={() => d.setEntitiesOpen((o) => !o)}
            style={{
              display: 'flex', alignItems: 'center', gap: 8, width: '100%',
              padding: '10px 14px',
              background: d.entitiesOpen ? 'var(--bg-surface)' : 'none',
              border: '1px solid',
              borderColor: d.entitiesOpen ? 'var(--border)' : 'transparent',
              cursor: 'pointer', color: 'var(--text-2)', fontSize: '0.9rem',
              fontWeight: 700, borderRadius: 'var(--r-sm)', marginTop: 4,
              transition: 'background 0.15s, border-color 0.15s',
            }}
          >
            <Rows size={16} weight="bold" />
            Сущности
            <CaretDown
              size={14} weight="bold"
              style={{
                marginLeft: 'auto',
                transform: d.entitiesOpen ? 'rotate(180deg)' : 'none',
                transition: 'transform 0.2s', color: 'var(--text-3)',
              }}
            />
          </button>
          {d.entitiesOpen && (
            <div style={{ paddingLeft: 8, display: 'flex', flexDirection: 'column', gap: 4 }}>
              {tabs
                .filter((t) => ENTITY_TAB_IDS.has(t.id))
                .map((tab) => <TabButton key={tab.id} tab={tab} activeTab={d.activeTab} indented onClick={handleTabClick} />)}
            </div>
          )}
        </div>
        {tabs
          .filter((t) => !ENTITY_TAB_IDS.has(t.id) && t.id !== 'stats')
          .map((tab) => <TabButton key={tab.id} tab={tab} activeTab={d.activeTab} onClick={handleTabClick} />)}
      </div>

      <div style={{ flex: 1, minWidth: 0 }}>
        {d.actionError && (
          <div className="form-error" style={{ marginBottom: 16 }}>{d.actionError}</div>
        )}
        {d.actionSuccess && (
          <div style={{
            marginBottom: 16, padding: '10px 12px', borderRadius: 'var(--r-sm)',
            border: '1px solid rgba(34, 197, 94, 0.35)', background: 'rgba(34, 197, 94, 0.1)',
            color: '#16a34a', fontSize: '0.86rem', fontWeight: 700,
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

        <BatchActionBar
          count={d.selectedUserIds.size}
          label="пользователей"
          loading={d.batchLoading}
          onClear={() => d.setSelectedUserIds(new Set())}
          actions={[
            { label: 'Активировать', color: 'var(--color-success)', onClick: () => d.handleBatchUsers('activate') },
            { label: 'Деактивировать', color: 'var(--error)', onClick: () => d.handleBatchUsers('deactivate') },
          ]}
        />

        <BatchActionBar
          count={d.selectedReviewIds.size}
          label="отзывов"
          loading={d.batchLoading}
          onClear={() => d.setSelectedReviewIds(new Set())}
          actions={[
            { label: 'Удалить выбранные', color: 'var(--error)', onClick: d.handleBatchDeleteReviews },
          ]}
        />

        <BatchActionBar
          count={d.selectedVendorIds.size}
          label="вендоров"
          loading={d.batchLoading}
          onClear={() => d.setSelectedVendorIds(new Set())}
          actions={[
            { label: 'Одобрить выбранных', color: 'var(--color-success)', onClick: () => { void d.handleBatchVendors('approve'); } },
            { label: 'Отклонить выбранных', color: 'var(--error)', onClick: () => d.requestReason({ title: 'Причина отклонения', confirmLabel: 'Отклонить', onConfirm: (reason) => d.handleBatchVendors('reject', reason) }) },
          ]}
        />

        <BatchActionBar
          count={d.selectedRestaurantIds.size}
          label="ресторанов"
          loading={d.batchLoading}
          onClear={() => d.setSelectedRestaurantIds(new Set())}
          actions={[
            { label: 'Одобрить выбранных', color: 'var(--color-success)', onClick: () => { void d.handleBatchRestaurants('approve'); } },
            { label: 'Отклонить выбранных', color: 'var(--error)', onClick: () => d.requestReason({ title: 'Причина отклонения', confirmLabel: 'Отклонить', onConfirm: (reason) => d.handleBatchRestaurants('reject', reason) }) },
          ]}
        />

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
