import { adminService } from '../../../services/adminService';
import { AdminUsersTab } from '../tabs/AdminUsersTab';
import { AdminOrdersTab } from '../tabs/AdminOrdersTab';
import { AdminResolutionTab } from '../tabs/AdminResolutionTab';
import { AdminRestaurantsTab } from '../tabs/AdminRestaurantsTab';
import { AdminVendorsTab } from '../tabs/AdminVendorsTab';
import { AdminReviewsTab } from '../tabs/AdminReviewsTab';
import { PAGE_SIZE } from '../useAdminDashboard';
import type { useAdminDashboard } from '../useAdminDashboard';

type Dashboard = ReturnType<typeof useAdminDashboard>;

export function AdminEntityTabs({ dashboard }: { dashboard: Dashboard }) {
  return (
    <>
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
    </>
  );
}
