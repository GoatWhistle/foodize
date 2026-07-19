import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi, describe, it, expect } from 'vitest';
import { AdminDetailModals } from '../../../../pages/admin/tabs/AdminDetailModals';
import type { AdminRestaurant, AdminUser, AdminVendor, Order } from '@shared/types/models';

vi.mock('../../../../pages/admin/tabs/detailModals/UserDetailModal', () => ({
  UserDetailModal: () => <div data-testid="user-modal" />,
}));
vi.mock('../../../../pages/admin/tabs/detailModals/RestaurantDetailModal', () => ({
  RestaurantDetailModal: () => <div data-testid="restaurant-modal" />,
}));
vi.mock('../../../../pages/admin/tabs/detailModals/VendorDetailModal', () => ({
  VendorDetailModal: () => <div data-testid="vendor-modal" />,
}));
vi.mock('../../../../components/OrderDetailsModal/OrderDetailsModal', () => ({
  OrderDetailsModal: ({
    onClose,
    onStatusChange,
  }: {
    onClose: () => void;
    onStatusChange: () => Promise<void>;
  }) => (
    <>
      <button onClick={onClose}>order-close</button>
      <button onClick={() => void onStatusChange()}>order-status</button>
    </>
  ),
}));

const baseProps = () => ({
  selectedUser: null as AdminUser | null,
  setSelectedUser: vi.fn(),
  userDetailsLoading: false,
  currentUser: null,
  permissionActionLoading: false,
  handleSetPermissionPreset: vi.fn(),
  handleMakeAdmin: vi.fn(),
  handleActivateUser: vi.fn(),
  handleDeleteUser: vi.fn(),
  selectedRestaurant: null as AdminRestaurant | null,
  setSelectedRestaurant: vi.fn(),
  restaurantDetailsLoading: false,
  approveLoading: false,
  handleApproveRestaurant: vi.fn(),
  handleRejectRestaurant: vi.fn(),
  handleDeleteRestaurant: vi.fn(),
  setQrType: vi.fn(),
  setQrRestaurant: vi.fn(),
  selectedVendor: null as AdminVendor | null,
  setSelectedVendor: vi.fn(),
  vendorDetailsLoading: false,
  handleApproveVendor: vi.fn(),
  handleRejectVendor: vi.fn(),
  handleDeleteVendor: vi.fn(),
  selectedOrder: null as Order | null,
  setSelectedOrder: vi.fn(),
});

describe('AdminDetailModals', () => {
  it('renders nothing when no selection', () => {
    render(<AdminDetailModals {...baseProps()} />);
    expect(screen.queryByTestId('user-modal')).not.toBeInTheDocument();
    expect(screen.queryByTestId('restaurant-modal')).not.toBeInTheDocument();
    expect(screen.queryByTestId('vendor-modal')).not.toBeInTheDocument();
    expect(screen.queryByText('order-close')).not.toBeInTheDocument();
  });

  it('renders user modal when a user is selected', () => {
    render(
      <AdminDetailModals {...baseProps()} selectedUser={{ id: 'u1' } as unknown as AdminUser} />,
    );
    expect(screen.getByTestId('user-modal')).toBeInTheDocument();
  });

  it('renders restaurant modal when a restaurant is selected', () => {
    render(
      <AdminDetailModals
        {...baseProps()}
        selectedRestaurant={{ id: 'r1' } as unknown as AdminRestaurant}
      />,
    );
    expect(screen.getByTestId('restaurant-modal')).toBeInTheDocument();
  });

  it('renders vendor modal when a vendor is selected', () => {
    render(
      <AdminDetailModals
        {...baseProps()}
        selectedVendor={{ id: 'v1' } as unknown as AdminVendor}
      />,
    );
    expect(screen.getByTestId('vendor-modal')).toBeInTheDocument();
  });

  it('renders order modal and closes it', async () => {
    const setSelectedOrder = vi.fn();
    render(
      <AdminDetailModals
        {...baseProps()}
        selectedOrder={{ id: 'o1' } as unknown as Order}
        setSelectedOrder={setSelectedOrder}
      />,
    );
    await userEvent.click(screen.getByText('order-status'));
    await userEvent.click(screen.getByText('order-close'));
    expect(setSelectedOrder).toHaveBeenCalledWith(null);
  });
});
