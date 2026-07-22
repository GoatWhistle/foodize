import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi } from 'vitest';
import { OrderButton } from '@shared/components/OrderButton/OrderButton';
import { t } from '@shared/i18n/useTranslation';
describe('OrderButton', () => {
  it('renders children correctly', () => {
    render(<OrderButton>Order Now</OrderButton>);
    expect(screen.getByText('Order Now')).toBeInTheDocument();
  });

  it('calls onClick when clicked', async () => {
    const user = userEvent.setup();
    const onClick = vi.fn();
    render(<OrderButton onClick={onClick}>Click Me</OrderButton>);

    await user.click(screen.getByText('Click Me'));
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it('shows spinner when loading', () => {
    const { container } = render(<OrderButton isLoading>Submit</OrderButton>);
    expect(screen.queryByText('Submit')).toBeNull();
    expect(screen.getByRole('status')).toBeInTheDocument();
    expect(container.querySelector('.spinner')).toBeInTheDocument();
    expect(screen.getByText(t('order.checkout.placing'))).toBeInTheDocument();
  });

  it('has transition style applied', () => {
    render(<OrderButton>Haptic</OrderButton>);
    const button = screen.getByText('Haptic').closest('button') as HTMLButtonElement;
    expect(button.style.transition).toContain('transform');
  });
});
