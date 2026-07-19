import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi } from 'vitest';
import { VendorSidebar } from '../../../pages/vendor/VendorSidebar';
import type { Restaurant } from '@shared/types/models';

const baseRestaurant = {
  id: 'r1',
  name: 'My Resto',
  display_id: 'myresto',
} as unknown as Restaurant;

const setup = (overrides: Partial<Parameters<typeof VendorSidebar>[0]> = {}) => {
  const props = {
    selectedRestaurant: baseRestaurant,
    activeTab: 'menu',
    setActiveTab: vi.fn(),
    setEditRestaurant: vi.fn(),
    setQrType: vi.fn(),
    setShowQr: vi.fn(),
    ...overrides,
  };
  render(<VendorSidebar {...props} />);
  return props;
};

describe('VendorSidebar', () => {
  it('renders restaurant name and display id', () => {
    setup();
    expect(screen.getByText('My Resto')).toBeInTheDocument();
    expect(screen.getByText('@myresto')).toBeInTheDocument();
  });

  it('renders all tabs and marks active one selected', () => {
    setup({ activeTab: 'orders' });
    const ordersTab = screen.getByRole('tab', { name: /Заказы/ });
    expect(ordersTab).toHaveAttribute('aria-selected', 'true');
    expect(screen.getByRole('tab', { name: /Меню/ })).toHaveAttribute('aria-selected', 'false');
  });

  it('switches tab on click', async () => {
    const { setActiveTab } = setup();
    await userEvent.click(screen.getByRole('tab', { name: /Аналитика/ }));
    expect(setActiveTab).toHaveBeenCalledWith('analytics');
  });

  it('opens edit restaurant when settings tab clicked', async () => {
    const { setActiveTab, setEditRestaurant } = setup();
    await userEvent.click(screen.getByRole('tab', { name: /Настройки/ }));
    expect(setActiveTab).toHaveBeenCalledWith('settings');
    expect(setEditRestaurant).toHaveBeenCalledWith(expect.objectContaining({ id: 'r1' }));
  });

  it('opens site QR modal', async () => {
    const { setQrType, setShowQr } = setup();
    await userEvent.click(screen.getByRole('button', { name: /QR для сайта/ }));
    expect(setQrType).toHaveBeenCalledWith('site');
    expect(setShowQr).toHaveBeenCalledWith(true);
  });

  it('opens telegram QR modal', async () => {
    const { setQrType, setShowQr } = setup();
    await userEvent.click(screen.getByRole('button', { name: /QR для Telegram/ }));
    expect(setQrType).toHaveBeenCalledWith('telegram');
    expect(setShowQr).toHaveBeenCalledWith(true);
  });

  it('renders display board link with restaurant id', () => {
    setup();
    const link = screen.getByRole('link', { name: /Открыть табло/ });
    expect(link).toHaveAttribute('href', expect.stringContaining('r1'));
  });

  it('omits display id block when absent', () => {
    setup({ selectedRestaurant: { ...baseRestaurant, display_id: undefined } as unknown as Restaurant });
    expect(screen.queryByText('@myresto')).not.toBeInTheDocument();
  });
});
