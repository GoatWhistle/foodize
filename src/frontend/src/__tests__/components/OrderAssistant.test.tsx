import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { t } from '@shared/i18n/useTranslation';

const mockFetchCart = vi.fn();
const mockStreamChat = vi.fn();

vi.mock('../../store/useCartStore', () => ({
  useCartStore: vi.fn((sel?: (s: { fetchCart: typeof mockFetchCart }) => unknown) => {
    const state = { fetchCart: mockFetchCart };
    return sel ? sel(state) : state;
  }),
}));

vi.mock('@shared/services/aiOrderService.js', () => ({
  aiOrderService: {
    streamChat: mockStreamChat,
  },
}));

const { OrderAssistant } = await import('../../components/OrderAssistant/OrderAssistant');

const render$ = () => render(<OrderAssistant />);

describe('OrderAssistant', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockStreamChat.mockResolvedValue(undefined);
    Element.prototype.scrollTo = vi.fn();
  });

  it('renders floating button initially', () => {
    render$();
    expect(screen.getByLabelText(t('vendor.assistant.ariaLabel'))).toBeInTheDocument();
  });

  it('opens panel when button clicked', async () => {
    const user = userEvent.setup();
    render$();
    await user.click(screen.getByLabelText(t('vendor.assistant.ariaLabel')));
    expect(screen.getByText(t('vendor.assistant.title'))).toBeInTheDocument();
  });

  it('shows suggestions when panel is open and no messages', async () => {
    const user = userEvent.setup();
    render$();
    await user.click(screen.getByLabelText(t('vendor.assistant.ariaLabel')));
    expect(screen.getByText(t('vendor.assistant.suggestions.cheapSpicyShaurma'))).toBeInTheDocument();
    expect(screen.getByText(t('vendor.assistant.suggestions.twoBurgersAndCola'))).toBeInTheDocument();
    expect(screen.getByText(t('vendor.assistant.suggestions.dessert'))).toBeInTheDocument();
  });

  it('closes panel when X button clicked', async () => {
    const user = userEvent.setup();
    render$();
    await user.click(screen.getByLabelText(t('vendor.assistant.ariaLabel')));
    await user.click(screen.getByLabelText(t('common.actions.close')));
    expect(screen.getByLabelText(t('vendor.assistant.ariaLabel'))).toBeInTheDocument();
    expect(screen.queryByText(t('vendor.assistant.title'))).not.toBeInTheDocument();
  });

  it('send button is disabled when input is empty', async () => {
    const user = userEvent.setup();
    render$();
    await user.click(screen.getByLabelText(t('vendor.assistant.ariaLabel')));
    expect(screen.getByLabelText(t('vendor.assistant.sendAriaLabel'))).toBeDisabled();
  });

  it('send button enables when input has text', async () => {
    const user = userEvent.setup();
    render$();
    await user.click(screen.getByLabelText(t('vendor.assistant.ariaLabel')));
    await user.type(screen.getByPlaceholderText(t('vendor.assistant.inputPlaceholder')), 'Хочу пиццу');
    expect(screen.getByLabelText(t('vendor.assistant.sendAriaLabel'))).not.toBeDisabled();
  });

  it('sends message on form submit and calls streamChat', async () => {
    const user = userEvent.setup();
    render$();
    await user.click(screen.getByLabelText(t('vendor.assistant.ariaLabel')));
    await user.type(screen.getByPlaceholderText(t('vendor.assistant.inputPlaceholder')), 'Хочу пиццу');
    await user.click(screen.getByLabelText(t('vendor.assistant.sendAriaLabel')));
    expect(mockStreamChat).toHaveBeenCalledOnce();
    const [messages] = mockStreamChat.mock.calls[0] as [Array<{ role: string; content: string }>];
    expect(messages[0]).toEqual({ role: 'user', content: 'Хочу пиццу' });
  });

  it('sends suggestion on suggestion button click', async () => {
    const user = userEvent.setup();
    render$();
    await user.click(screen.getByLabelText(t('vendor.assistant.ariaLabel')));
    await user.click(screen.getByText(t('vendor.assistant.suggestions.twoBurgersAndCola')));
    expect(mockStreamChat).toHaveBeenCalledOnce();
  });

  it('calls fetchCart after message sent', async () => {
    const user = userEvent.setup();
    render$();
    await user.click(screen.getByLabelText(t('vendor.assistant.ariaLabel')));
    await user.type(screen.getByPlaceholderText(t('vendor.assistant.inputPlaceholder')), 'Пицца');
    await user.click(screen.getByLabelText(t('vendor.assistant.sendAriaLabel')));
    await waitFor(() => { expect(mockFetchCart).toHaveBeenCalled(); });
  });

  it('shows error message when streamChat fails', async () => {
    const user = userEvent.setup();
    mockStreamChat.mockRejectedValue(new Error('Network error'));
    render$();
    await user.click(screen.getByLabelText(t('vendor.assistant.ariaLabel')));
    await user.type(screen.getByPlaceholderText(t('vendor.assistant.inputPlaceholder')), 'Тест');
    await user.click(screen.getByLabelText(t('vendor.assistant.sendAriaLabel')));
    await waitFor(() => {
      expect(screen.getByText(t('vendor.assistant.errors.requestFailed'))).toBeInTheDocument();
    });
  });

  it('clears input after send', async () => {
    const user = userEvent.setup();
    render$();
    await user.click(screen.getByLabelText(t('vendor.assistant.ariaLabel')));
    const input = screen.getByPlaceholderText(t('vendor.assistant.inputPlaceholder'));
    await user.type(input, 'Тест');
    await user.click(screen.getByLabelText(t('vendor.assistant.sendAriaLabel')));
    expect((input as HTMLInputElement).value).toBe('');
  });
});
