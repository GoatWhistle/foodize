import type { Dispatch, SetStateAction } from 'react';
import type { AdminRestaurant, AdminUser, AdminVendor, Order } from '@shared/types/models';
import type { AuthUser } from '@shared/store/createAuthStore';
import OrderDetailsModal from '../../../components/OrderDetailsModal/OrderDetailsModal';
import { PERMISSION_PRESETS } from '@shared/utils/permissions';
import type { QrType } from '../useAdminDashboard';
import { UserDetailModal } from './detailModals/UserDetailModal';
import { RestaurantDetailModal } from './detailModals/RestaurantDetailModal';
import { VendorDetailModal } from './detailModals/VendorDetailModal';

export { ReasonDialog } from './detailModals/ReasonDialog';

type PresetKey = keyof typeof PERMISSION_PRESETS;

interface AdminDetailModalsProps {
  selectedUser: AdminUser | null;
  setSelectedUser: Dispatch<SetStateAction<AdminUser | null>>;
  userDetailsLoading: boolean;
  currentUser: AuthUser | null;
  permissionActionLoading: boolean;
  handleSetPermissionPreset: (userId: string, preset: PresetKey) => void;
  handleMakeAdmin: (userId: string) => void;
  handleActivateUser: (userId: string) => void;
  handleDeleteUser: (userId: string) => void;

  selectedRestaurant: AdminRestaurant | null;
  setSelectedRestaurant: Dispatch<SetStateAction<AdminRestaurant | null>>;
  restaurantDetailsLoading: boolean;
  approveLoading: boolean;
  handleApproveRestaurant: (restaurantId: string) => void;
  handleRejectRestaurant: (restaurantId: string) => void;
  handleDeleteRestaurant: (restaurantId: string) => void;
  setQrType: Dispatch<SetStateAction<QrType>>;
  setQrRestaurant: Dispatch<SetStateAction<AdminRestaurant | null>>;

  selectedVendor: AdminVendor | null;
  setSelectedVendor: Dispatch<SetStateAction<AdminVendor | null>>;
  vendorDetailsLoading: boolean;
  handleApproveVendor: (vendorId: string) => void;
  handleRejectVendor: (vendorId: string) => void;
  handleDeleteVendor: (vendorId: string) => void;

  selectedOrder: Order | null;
  setSelectedOrder: Dispatch<SetStateAction<Order | null>>;
}

const noopStatusChange = async () => {};

export default function AdminDetailModals({
  selectedUser,
  setSelectedUser,
  userDetailsLoading,
  currentUser,
  permissionActionLoading,
  handleSetPermissionPreset,
  handleMakeAdmin,
  handleActivateUser,
  handleDeleteUser,

  selectedRestaurant,
  setSelectedRestaurant,
  restaurantDetailsLoading,
  approveLoading,
  handleApproveRestaurant,
  handleRejectRestaurant,
  handleDeleteRestaurant,
  setQrType,
  setQrRestaurant,

  selectedVendor,
  setSelectedVendor,
  vendorDetailsLoading,
  handleApproveVendor,
  handleRejectVendor,
  handleDeleteVendor,

  selectedOrder,
  setSelectedOrder,
}: AdminDetailModalsProps) {
  return (
    <>
      {selectedUser && (
        <UserDetailModal
          selectedUser={selectedUser}
          setSelectedUser={setSelectedUser}
          userDetailsLoading={userDetailsLoading}
          currentUser={currentUser}
          permissionActionLoading={permissionActionLoading}
          handleSetPermissionPreset={handleSetPermissionPreset}
          handleMakeAdmin={handleMakeAdmin}
          handleActivateUser={handleActivateUser}
          handleDeleteUser={handleDeleteUser}
        />
      )}

      {selectedRestaurant && (
        <RestaurantDetailModal
          selectedRestaurant={selectedRestaurant}
          setSelectedRestaurant={setSelectedRestaurant}
          restaurantDetailsLoading={restaurantDetailsLoading}
          approveLoading={approveLoading}
          handleApproveRestaurant={handleApproveRestaurant}
          handleRejectRestaurant={handleRejectRestaurant}
          handleDeleteRestaurant={handleDeleteRestaurant}
          setQrType={setQrType}
          setQrRestaurant={setQrRestaurant}
        />
      )}

      {selectedVendor && (
        <VendorDetailModal
          selectedVendor={selectedVendor}
          setSelectedVendor={setSelectedVendor}
          vendorDetailsLoading={vendorDetailsLoading}
          approveLoading={approveLoading}
          handleApproveVendor={handleApproveVendor}
          handleRejectVendor={handleRejectVendor}
          handleDeleteVendor={handleDeleteVendor}
        />
      )}

      {selectedOrder && (
        <OrderDetailsModal
          order={selectedOrder}
          onClose={() => { setSelectedOrder(null); }}
          onStatusChange={noopStatusChange}
          updating={null}
        />
      )}
    </>
  );
}
