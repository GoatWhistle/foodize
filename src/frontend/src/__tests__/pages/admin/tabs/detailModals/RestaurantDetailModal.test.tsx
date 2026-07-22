import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { RestaurantDetailModal } from '../../../../../pages/admin/tabs/detailModals/RestaurantDetailModal';
import type { AdminRestaurant } from '@shared/types/models';
import { t } from '@shared/i18n/useTranslation';

const makeRestaurant = (over: Partial<AdminRestaurant> = {}): AdminRestaurant =>
  ({
    id: 'r1',
    name: 'Пицца',
    address: 'ул. Ленина 1',
    vendor_id: 'v1',
    vendor_name: 'ООО Еда',
    vendor_phone: '+79990001122',
    orders_count: 12,
    review_count: 5,
    average_rating: 4.5,
    created_at: '2026-01-01T00:00:00Z',
    moderation_status: 'PENDING',
    is_open: true,
    ...over,
  }) as unknown as AdminRestaurant;

const baseProps = (over: Partial<AdminRestaurant> = {}) => ({
  selectedRestaurant: makeRestaurant(over),
  setSelectedRestaurant: vi.fn(),
  restaurantDetailsLoading: false,
  approveLoading: false,
  handleApproveRestaurant: vi.fn(),
  handleRejectRestaurant: vi.fn(),
  handleDeleteRestaurant: vi.fn(),
  setQrType: vi.fn(),
  setQrRestaurant: vi.fn(),
});

describe('RestaurantDetailModal', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('renders restaurant and vendor fields', () => {
    render(<RestaurantDetailModal {...baseProps()} />);
    expect(screen.getAllByText('Пицца').length).toBeGreaterThan(0);
    expect(screen.getByText('ООО Еда')).toBeInTheDocument();
    expect(screen.getByText(t('admin.restaurants.modal.open'))).toBeInTheDocument();
  });

  it('approves and rejects pending restaurant', async () => {
    const props = baseProps();
    render(<RestaurantDetailModal {...props} />);
    await userEvent.click(screen.getByRole('button', { name: new RegExp(t('common.actions.approve')) }));
    expect(props.handleApproveRestaurant).toHaveBeenCalledWith('r1');
    await userEvent.click(screen.getByRole('button', { name: new RegExp(t('common.actions.reject')) }));
    expect(props.handleRejectRestaurant).toHaveBeenCalledWith('r1');
  });

  it('shows approve loading, hides approve when approved', () => {
    const { rerender } = render(<RestaurantDetailModal {...baseProps()} approveLoading />);
    expect(screen.getByText(t('common.actions.approving'))).toBeInTheDocument();
    rerender(<RestaurantDetailModal {...baseProps({ moderation_status: 'APPROVED' })} />);
    expect(screen.queryByRole('button', { name: new RegExp(t('common.actions.approve')) })).not.toBeInTheDocument();
  });

  it('hides reject and shows reason when rejected', () => {
    render(
      <RestaurantDetailModal
        {...baseProps({ moderation_status: 'REJECTED', rejection_reason: 'плохие фото' })}
      />,
    );
    expect(screen.queryByRole('button', { name: new RegExp(t('common.actions.reject')) })).not.toBeInTheDocument();
    expect(screen.getByText('плохие фото')).toBeInTheDocument();
  });

  it('renders closed badge and zero rating fallback', () => {
    render(<RestaurantDetailModal {...baseProps({ is_open: false, average_rating: 0 })} />);
    expect(screen.getByText(t('admin.restaurants.modal.closed'))).toBeInTheDocument();
  });

  it('opens display board and QR flows', async () => {
    const openSpy = vi.spyOn(window, 'open').mockReturnValue(null);
    const props = baseProps();
    render(<RestaurantDetailModal {...props} />);
    await userEvent.click(screen.getByRole('button', { name: t('admin.restaurants.modal.openDisplayBoard') }));
    expect(openSpy).toHaveBeenCalledWith('/display-board/r1', '_blank', 'noopener,noreferrer');
    await userEvent.click(screen.getByRole('button', { name: t('admin.restaurants.modal.qrSite') }));
    expect(props.setQrType).toHaveBeenCalledWith('site');
    await userEvent.click(screen.getByRole('button', { name: t('admin.restaurants.modal.qrTelegram') }));
    expect(props.setQrType).toHaveBeenCalledWith('telegram');
    expect(props.setQrRestaurant).toHaveBeenCalledWith(props.selectedRestaurant);
  });

  it('deletes and closes', async () => {
    const props = baseProps();
    render(<RestaurantDetailModal {...props} />);
    await userEvent.click(screen.getByRole('button', { name: t('admin.restaurants.modal.deleteRestaurant') }));
    expect(props.handleDeleteRestaurant).toHaveBeenCalledWith('r1');
    await userEvent.click(screen.getByLabelText(t('common.actions.close')));
    expect(props.setSelectedRestaurant).toHaveBeenCalledWith(null);
  });

  it('uses vendor fallbacks when missing', () => {
    render(<RestaurantDetailModal {...baseProps({ vendor_name: '', vendor_phone: '' })} />);
    expect(screen.getAllByText(t('common.states.notSpecified')).length).toBeGreaterThan(0);
    expect(
      screen.getAllByText(t('common.states.notSpecifiedMale')).length,
    ).toBeGreaterThan(0);
  });
});
