import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { MenuItem } from '@shared/types/models';
import { StaffMenuTab } from '../../../../pages/staff/components/StaffMenuTab';

const ITEMS = [
  { id: 'm1', name: 'Бургер', price: 300, is_available: true },
  { id: 'm2', name: 'Суп', price: 200, is_available: false },
] as unknown as MenuItem[];

describe('StaffMenuTab', () => {
  it('shows loading spinner', () => {
    const { container } = render(
      <StaffMenuTab menuItems={[]} menuLoading menuError="" onToggleAvailability={vi.fn()} />
    );
    expect(container.querySelector('.spinner')).not.toBeNull();
  });

  it('shows error', () => {
    render(
      <StaffMenuTab menuItems={[]} menuLoading={false} menuError="Ошибка" onToggleAvailability={vi.fn()} />
    );
    expect(screen.getByText('Ошибка')).toBeInTheDocument();
  });

  it('shows empty state', () => {
    render(
      <StaffMenuTab menuItems={[]} menuLoading={false} menuError="" onToggleAvailability={vi.fn()} />
    );
    expect(screen.getByText('Меню пусто')).toBeInTheDocument();
  });

  it('renders items with availability labels and toggles', async () => {
    const onToggle = vi.fn();
    render(
      <StaffMenuTab menuItems={ITEMS} menuLoading={false} menuError="" onToggleAvailability={onToggle} />
    );
    expect(screen.getByText('Бургер')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'ВКЛ' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'ВЫКЛ' })).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'ВКЛ' }));
    expect(onToggle).toHaveBeenCalledWith(ITEMS[0]);
  });
});
