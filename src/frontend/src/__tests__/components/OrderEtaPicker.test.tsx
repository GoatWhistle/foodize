import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi } from 'vitest';
import { OrderEtaPicker } from '../../components/OrderDetailsModal/orderDetails/OrderEtaPicker';
import { t } from '@shared/i18n/useTranslation';

const makeProps = (overrides: Record<string, unknown> = {}) => ({
  etaMinutes: null,
  manualEtaTime: '',
  onSelectMinutes: vi.fn(),
  onManualTimeChange: vi.fn(),
  ...overrides,
});

describe('OrderEtaPicker', () => {
  it('renders the preset minute options', () => {
    render(<OrderEtaPicker {...makeProps()} />);
    expect(screen.getByText(t('order.eta.minutesChip', { minutes: 10 }))).toBeInTheDocument();
    expect(screen.getByText(t('order.eta.minutesChip', { minutes: 15 }))).toBeInTheDocument();
    expect(screen.getByText(t('order.eta.minutesChip', { minutes: 20 }))).toBeInTheDocument();
  });

  it('calls onSelectMinutes when a preset is clicked', async () => {
    const user = userEvent.setup();
    const onSelectMinutes = vi.fn();
    render(<OrderEtaPicker {...makeProps({ onSelectMinutes })} />);
    await user.click(screen.getByText(t('order.eta.minutesChip', { minutes: 15 })));
    expect(onSelectMinutes).toHaveBeenCalledWith(15);
  });

  it('marks the selected preset active when no manual time is set', () => {
    render(<OrderEtaPicker {...makeProps({ etaMinutes: 20 })} />);
    expect(screen.getByText(t('order.eta.minutesChip', { minutes: 20 })).className).toContain('active');
    expect(screen.getByText(t('order.eta.minutesChip', { minutes: 10 })).className).not.toContain('active');
  });

  it('does not mark a preset active when a manual time is set', () => {
    render(<OrderEtaPicker {...makeProps({ etaMinutes: 20, manualEtaTime: '18:00' })} />);
    expect(screen.getByText(t('order.eta.minutesChip', { minutes: 20 })).className).not.toContain('active');
  });

  it('calls onManualTimeChange when the time input changes', async () => {
    const user = userEvent.setup();
    const onManualTimeChange = vi.fn();
    render(<OrderEtaPicker {...makeProps({ onManualTimeChange })} />);
    const input = screen.getByLabelText(t('order.eta.exactTime'));
    await user.type(input, '18:30');
    expect(onManualTimeChange).toHaveBeenCalled();
  });
});
