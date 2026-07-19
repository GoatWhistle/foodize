import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi, describe, it, expect } from 'vitest';
import { VendorDetailModal } from '../../../../../pages/admin/tabs/detailModals/VendorDetailModal';
import type { AdminVendor } from '@shared/types/models';

const makeVendor = (over: Partial<AdminVendor> = {}): AdminVendor =>
  ({
    id: 'v1',
    user_id: 'usr1',
    name: 'ООО Еда',
    phone_number: '+79990001122',
    restaurants_count: 3,
    approval_status: 'PENDING',
    created_at: '2026-01-01T00:00:00Z',
    ...over,
  });

const baseProps = (over: Partial<AdminVendor> = {}) => ({
  selectedVendor: makeVendor(over),
  setSelectedVendor: vi.fn(),
  vendorDetailsLoading: false,
  approveLoading: false,
  handleApproveVendor: vi.fn(),
  handleRejectVendor: vi.fn(),
  handleDeleteVendor: vi.fn(),
});

describe('VendorDetailModal', () => {
  it('renders vendor fields', () => {
    render(<VendorDetailModal {...baseProps()} />);
    expect(screen.getAllByText('ООО Еда').length).toBeGreaterThan(0);
    expect(screen.getByText('+79990001122')).toBeInTheDocument();
    expect(screen.getByText('usr1')).toBeInTheDocument();
  });

  it('renders fallback title and approve/reject for pending', async () => {
    const props = baseProps();
    render(<VendorDetailModal {...props} />);
    await userEvent.click(screen.getByRole('button', { name: /Одобрить/ }));
    expect(props.handleApproveVendor).toHaveBeenCalledWith('v1');
    await userEvent.click(screen.getByRole('button', { name: /Отклонить/ }));
    expect(props.handleRejectVendor).toHaveBeenCalledWith('v1');
  });

  it('hides approve when already approved', () => {
    render(<VendorDetailModal {...baseProps({ approval_status: 'APPROVED' })} />);
    expect(screen.queryByRole('button', { name: /Одобрить/ })).not.toBeInTheDocument();
  });

  it('hides reject when already rejected and shows reason', () => {
    render(
      <VendorDetailModal
        {...baseProps({ approval_status: 'REJECTED', rejection_reason: 'спам' })}
      />,
    );
    expect(screen.queryByRole('button', { name: /Отклонить/ })).not.toBeInTheDocument();
    expect(screen.getByText('спам')).toBeInTheDocument();
  });

  it('shows loading approve label and disables buttons', () => {
    render(<VendorDetailModal {...baseProps()} approveLoading />);
    expect(screen.getByText('Одобрение...')).toBeInTheDocument();
  });

  it('deletes and closes', async () => {
    const props = baseProps();
    render(<VendorDetailModal {...props} />);
    await userEvent.click(screen.getByRole('button', { name: /Удалить вендора/ }));
    expect(props.handleDeleteVendor).toHaveBeenCalledWith('v1');
    await userEvent.click(screen.getByLabelText('Закрыть'));
    expect(props.setSelectedVendor).toHaveBeenCalledWith(null);
  });

  it('uses fallback name when empty', () => {
    render(<VendorDetailModal {...baseProps({ name: '' })} />);
    expect(screen.getByText('Вендор')).toBeInTheDocument();
  });
});
