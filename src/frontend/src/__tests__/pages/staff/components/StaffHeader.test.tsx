import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { StaffProfile } from '@shared/types/models';
import { StaffHeader } from '../../../../pages/staff/components/StaffHeader';

const PROFILE = { role: 'COOK' } as unknown as StaffProfile;

const baseProps = {
  profile: PROFILE,
  newOrderAlert: false,
  onDismissAlert: vi.fn(),
  autoEta: false,
  onToggleAutoEta: vi.fn(),
};

describe('StaffHeader', () => {
  it('renders title and role', () => {
    render(<StaffHeader {...baseProps} />);
    expect(screen.getByText('Кабинет сотрудника')).toBeInTheDocument();
    expect(screen.getByText('Роль:')).toBeInTheDocument();
  });

  it('hides alert button when newOrderAlert is false', () => {
    render(<StaffHeader {...baseProps} />);
    expect(screen.queryByText('Новый заказ!')).toBeNull();
  });

  it('shows alert button and dismisses', async () => {
    const onDismissAlert = vi.fn();
    render(<StaffHeader {...baseProps} newOrderAlert onDismissAlert={onDismissAlert} />);
    await userEvent.click(screen.getByRole('button', { name: /Новый заказ/ }));
    expect(onDismissAlert).toHaveBeenCalled();
  });

  it('toggles auto eta checkbox', async () => {
    const onToggleAutoEta = vi.fn();
    render(<StaffHeader {...baseProps} onToggleAutoEta={onToggleAutoEta} />);
    await userEvent.click(screen.getByRole('checkbox'));
    expect(onToggleAutoEta).toHaveBeenCalledWith(true);
  });

  it('reflects checked state when autoEta is true', () => {
    render(<StaffHeader {...baseProps} autoEta />);
    expect(screen.getByRole('checkbox')).toBeChecked();
  });
});
