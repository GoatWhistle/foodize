import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi } from 'vitest';
import { useState } from 'react';
import { VendorStaffTab } from '../../../../pages/vendor/tabs/VendorStaffTab';
import type { StaffMember, StaffRequest } from '@shared/types/models';
import type { StaffSubTab } from '../../../../pages/vendor/hooks/useVendorStaff';

const members: StaffMember[] = [
  { id: 'm1', user_id: 'user1234abcd', user_name: 'Иван', user_phone: '+7999', restaurant_name: 'Resto' },
  { id: 'm2', user_id: 'user5678efgh', user_name: '', user_phone: '', restaurant_name: '' },
] as unknown as StaffMember[];

const requests: StaffRequest[] = [
  { id: 'r1', user_id: 'aaaabbbbcccc', status: 'PENDING' },
  { id: 'r2', user_id: 'ddddeeeeffff', status: 'ACCEPTED' },
] as unknown as StaffRequest[];

const Harness = ({
  initialTab = 'members',
  membersData = members,
  requestsData = requests,
  membersTotal = 2,
  requestsTotal = 2,
  removing = null,
  decisionLoading = null,
  onRemove = vi.fn(),
  onDecision = vi.fn(),
}: Record<string, unknown>) => {
  const [subTab, setSubTab] = useState<StaffSubTab>(initialTab as StaffSubTab);
  const [membersPage, setMembersPage] = useState(1);
  const [page, setPage] = useState(1);
  return (
    <VendorStaffTab
      staffSubTab={subTab}
      setStaffSubTab={setSubTab}
      staffMembers={membersData as StaffMember[]}
      staffMembersTotal={membersTotal as number}
      staffMembersPage={membersPage}
      setStaffMembersPage={setMembersPage}
      staffMemberRemoving={removing as string | null}
      handleRemoveStaffMember={onRemove as (id: string) => void}
      staffRequests={requestsData as StaffRequest[]}
      staffTotal={requestsTotal as number}
      staffPage={page}
      setStaffPage={setPage}
      staffDecisionLoading={decisionLoading as string | null}
      handleStaffDecision={onDecision as never}
    />
  );
};

describe('VendorStaffTab', () => {
  it('renders members with name and fallback id/phone', () => {
    render(<Harness />);
    expect(screen.getByText('Иван')).toBeInTheDocument();
    expect(screen.getByText(/ID: user5678/)).toBeInTheDocument();
    expect(screen.getByText('Нет телефона')).toBeInTheDocument();
  });

  it('shows empty members state', () => {
    render(<Harness membersData={[]} />);
    expect(screen.getByText('Нет сотрудников')).toBeInTheDocument();
  });

  it('removes a staff member', async () => {
    const user = userEvent.setup();
    const onRemove = vi.fn();
    render(<Harness onRemove={onRemove} />);
    const buttons = screen.getAllByRole('button');
    const removeBtn = buttons.find((b) => b.textContent === '' || b.querySelector('svg'));
    await user.click(removeBtn as HTMLElement);
    expect(onRemove).toHaveBeenCalled();
  });

  it('shows removing indicator', () => {
    render(<Harness removing="m1" />);
    expect(screen.getByText('...')).toBeInTheDocument();
  });

  it('switches to requests tab and shows pending actions', async () => {
    const user = userEvent.setup();
    const onDecision = vi.fn();
    render(<Harness onDecision={onDecision} />);
    await user.click(screen.getByRole('button', { name: 'Заявки' }));
    expect(screen.getByText(/Пользователь #aaaabbbb/)).toBeInTheDocument();
    const actions = document.querySelector('.staff-request-actions') as HTMLElement;
    const accept = actions.querySelector('.btn-primary') as HTMLElement;
    await user.click(accept);
    expect(onDecision).toHaveBeenCalledWith('r1', 'ACCEPTED');
    await user.click(screen.getByRole('button', { name: 'Сотрудники' }));
    expect(screen.getByText('Иван')).toBeInTheDocument();
  });

  it('rejects a request', async () => {
    const user = userEvent.setup();
    const onDecision = vi.fn();
    render(<Harness initialTab="requests" onDecision={onDecision} />);
    const actions = document.querySelector('.staff-request-actions') as HTMLElement;
    const rejectBtn = actions.querySelector('.btn-secondary') as HTMLElement;
    await user.click(rejectBtn);
    expect(onDecision).toHaveBeenCalledWith('r1', 'REJECTED');
  });

  it('shows empty requests state', () => {
    render(<Harness initialTab="requests" requestsData={[]} />);
    expect(screen.getByText('Нет заявок')).toBeInTheDocument();
  });

  it('handles non-array requests', () => {
    render(<Harness initialTab="requests" requestsData={null} />);
    expect(screen.getByText('Нет заявок')).toBeInTheDocument();
  });

  it('renders members pagination and changes page', async () => {
    const user = userEvent.setup();
    render(<Harness membersTotal={40} />);
    const nextButtons = screen.getAllByLabelText(/Перейти на страницу/);
    expect(nextButtons.length).toBeGreaterThan(0);
    await user.click(screen.getByLabelText('Перейти на страницу 2'));
    await waitFor(() => {
      expect(screen.getByLabelText('Перейти на страницу 1')).not.toBeDisabled();
    });
  });

  it('renders requests pagination and changes page', async () => {
    const user = userEvent.setup();
    render(<Harness initialTab="requests" requestsTotal={40} />);
    expect(screen.getAllByLabelText(/Перейти на страницу/).length).toBeGreaterThan(0);
    await user.click(screen.getByLabelText('Перейти на страницу 2'));
    await waitFor(() => {
      expect(screen.getByLabelText('Перейти на страницу 1')).not.toBeDisabled();
    });
  });
});
