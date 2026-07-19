import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useState } from 'react';
import { VendorSettingsTab } from '../../../../pages/vendor/tabs/VendorSettingsTab';
import type { Restaurant } from '@shared/types/models';
import { at } from '../../../testUtils';

vi.mock('@shared/services/restaurantService', () => ({
  restaurantService: { uploadPhoto: vi.fn(), deletePhoto: vi.fn() },
}));

const makeRestaurant = (overrides: Partial<Restaurant> = {}): Restaurant =>
  ({
    id: 'r1',
    name: 'My Resto',
    address: 'Addr 1',
    description: 'Desc',
    is_open: true,
    is_hiring: false,
    is_ordering_paused: false,
    ordering_paused_until: null,
    avg_prep_time_minutes: 20,
    max_active_orders: null,
    photo_url: '',
    ...overrides,
  }) as unknown as Restaurant;

const Harness = ({
  restaurant,
  formError = '',
  formLoading = false,
  onSubmit = vi.fn(),
  startEdit = false,
}: {
  restaurant: Restaurant;
  formError?: string;
  formLoading?: boolean;
  onSubmit?: (e: React.FormEvent<HTMLFormElement>) => void;
  startEdit?: boolean;
}) => {
  const [editRestaurant, setEditRestaurant] = useState<Restaurant | null>(startEdit ? restaurant : null);
  return (
    <VendorSettingsTab
      selectedRestaurant={restaurant}
      editRestaurant={editRestaurant}
      setEditRestaurant={setEditRestaurant}
      formError={formError}
      formLoading={formLoading}
      handleUpdateRestaurant={onSubmit}
    />
  );
};

describe('VendorSettingsTab', () => {
  beforeEach(() => vi.clearAllMocks());

  it('renders form values from selected restaurant', () => {
    render(<Harness restaurant={makeRestaurant()} />);
    expect(screen.getByDisplayValue('My Resto')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Addr 1')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Desc')).toBeInTheDocument();
    expect(screen.getByText('Настройки ресторана')).toBeInTheDocument();
  });

  it('shows form error', () => {
    render(<Harness restaurant={makeRestaurant()} formError="Ошибка!" />);
    expect(screen.getByText('Ошибка!')).toBeInTheDocument();
  });

  it('edits name, description, address and toggles', async () => {
    const user = userEvent.setup();
    render(<Harness restaurant={makeRestaurant()} />);
    const name = screen.getByDisplayValue('My Resto');
    await user.type(name, '!');
    expect((name as HTMLInputElement).value).toBe('My Resto!');

    const desc = screen.getByDisplayValue('Desc');
    await user.type(desc, '+');
    const addr = screen.getByDisplayValue('Addr 1');
    await user.type(addr, '+');

    const checkboxes = screen.getAllByRole('checkbox');
    await user.click(at(checkboxes, 0));
    await user.click(at(checkboxes, 1));
    await user.click(at(checkboxes, 2));
    expect(screen.getByText('Заведение открыто')).toBeInTheDocument();
  });

  it('edits numeric fields and paused-until', async () => {
    const user = userEvent.setup();
    render(<Harness restaurant={makeRestaurant({ ordering_paused_until: '2026-07-20T10:00:00Z' })} />);
    const prep = screen.getByDisplayValue('20');
    await user.clear(prep);
    await user.type(prep, '30');
    expect((prep as HTMLInputElement).value).toBe('30');

    const maxOrders = screen.getByPlaceholderText('Без лимита');
    await user.type(maxOrders, '5');
    expect((maxOrders as HTMLInputElement).value).toBe('5');
    await user.clear(maxOrders);
    expect((maxOrders as HTMLInputElement).value).toBe('');
  });

  it('renders paused-until from invalid date as empty and edits it', async () => {
    const user = userEvent.setup();
    render(<Harness restaurant={makeRestaurant({ ordering_paused_until: 'not-a-date' })} startEdit />);
    const inputs = screen.getAllByDisplayValue('');
    void inputs;
    const dt = document.querySelector('input[type="datetime-local"]') as HTMLInputElement;
    expect(dt.value).toBe('');
    await user.type(dt, '2026-07-20T10:00');
    expect(dt.value).toBe('2026-07-20T10:00');
  });

  it('submits the form', async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn((e: React.FormEvent) => { e.preventDefault(); });
    render(<Harness restaurant={makeRestaurant()} onSubmit={onSubmit} />);
    await user.click(screen.getByRole('button', { name: 'Сохранить' }));
    expect(onSubmit).toHaveBeenCalled();
  });

  it('disables submit while loading', () => {
    render(<Harness restaurant={makeRestaurant()} formLoading />);
    expect(screen.getByRole('button', { name: 'Сохранить' })).toBeDisabled();
  });

  it('falls back to empty description when null', () => {
    render(<Harness restaurant={makeRestaurant({ description: null })} />);
    const desc = screen.getByPlaceholderText(/Краткое описание/);
    expect((desc as HTMLTextAreaElement).value).toBe('');
  });

  it('prefers editRestaurant values over selectedRestaurant when editing started', async () => {
    const user = userEvent.setup();
    render(
      <Harness
        restaurant={makeRestaurant({
          name: 'Base',
          address: 'Base Addr',
          description: 'Base Desc',
          is_open: false,
          is_hiring: true,
          is_ordering_paused: true,
          ordering_paused_until: '2026-07-20T10:00:00Z',
          avg_prep_time_minutes: 25,
          max_active_orders: 7,
        })}
        startEdit
      />
    );
    expect(screen.getByDisplayValue('Base')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Base Desc')).toBeInTheDocument();
    expect(screen.getByDisplayValue('7')).toBeInTheDocument();
    const dt = document.querySelector('input[type="datetime-local"]') as HTMLInputElement;
    expect(dt.value).not.toBe('');

    const name = screen.getByDisplayValue('Base');
    await user.type(name, 'X');
    expect((name as HTMLInputElement).value).toBe('BaseX');

    const desc = screen.getByDisplayValue('Base Desc');
    await user.type(desc, '!');
    const addr = screen.getByDisplayValue('Base Addr');
    await user.type(addr, '!');
    const prep = screen.getByDisplayValue('25');
    await user.type(prep, '0');
    const maxOrders = screen.getByDisplayValue('7');
    await user.type(maxOrders, '0');

    const checkboxes = screen.getAllByRole('checkbox');
    for (const cb of checkboxes) {
      await user.click(cb);
    }
    await user.type(dt, '2026-08-01T09:00');
    expect(screen.getByText('Настройки ресторана')).toBeInTheDocument();
  });
});
