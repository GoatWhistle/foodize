import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';

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
    expect(screen.getByLabelText('Помощник заказа')).toBeInTheDocument();
  });

  it('opens panel when button clicked', async () => {
    const user = userEvent.setup();
    render$();
    await user.click(screen.getByLabelText('Помощник заказа'));
    expect(screen.getByText('Помощник заказа')).toBeInTheDocument();
  });

  it('shows suggestions when panel is open and no messages', async () => {
    const user = userEvent.setup();
    render$();
    await user.click(screen.getByLabelText('Помощник заказа'));
    expect(screen.getByText('Где острая шаурма дешевле 350?')).toBeInTheDocument();
    expect(screen.getByText('Хочу два бургера и колу')).toBeInTheDocument();
    expect(screen.getByText('Что есть на десерт?')).toBeInTheDocument();
  });

  it('closes panel when X button clicked', async () => {
    const user = userEvent.setup();
    render$();
    await user.click(screen.getByLabelText('Помощник заказа'));
    await user.click(screen.getByLabelText('Закрыть'));
    expect(screen.getByLabelText('Помощник заказа')).toBeInTheDocument();
    expect(screen.queryByText('Помощник заказа')).not.toBeInTheDocument();
  });

  it('send button is disabled when input is empty', async () => {
    const user = userEvent.setup();
    render$();
    await user.click(screen.getByLabelText('Помощник заказа'));
    expect(screen.getByLabelText('Отправить сообщение')).toBeDisabled();
  });

  it('send button enables when input has text', async () => {
    const user = userEvent.setup();
    render$();
    await user.click(screen.getByLabelText('Помощник заказа'));
    await user.type(screen.getByPlaceholderText('Что хотите заказать?'), 'Хочу пиццу');
    expect(screen.getByLabelText('Отправить сообщение')).not.toBeDisabled();
  });

  it('sends message on form submit and calls streamChat', async () => {
    const user = userEvent.setup();
    render$();
    await user.click(screen.getByLabelText('Помощник заказа'));
    await user.type(screen.getByPlaceholderText('Что хотите заказать?'), 'Хочу пиццу');
    await user.click(screen.getByLabelText('Отправить сообщение'));
    expect(mockStreamChat).toHaveBeenCalledOnce();
    const [messages] = mockStreamChat.mock.calls[0] as [Array<{ role: string; content: string }>];
    expect(messages[0]).toEqual({ role: 'user', content: 'Хочу пиццу' });
  });

  it('sends suggestion on suggestion button click', async () => {
    const user = userEvent.setup();
    render$();
    await user.click(screen.getByLabelText('Помощник заказа'));
    await user.click(screen.getByText('Хочу два бургера и колу'));
    expect(mockStreamChat).toHaveBeenCalledOnce();
  });

  it('calls fetchCart after message sent', async () => {
    const user = userEvent.setup();
    render$();
    await user.click(screen.getByLabelText('Помощник заказа'));
    await user.type(screen.getByPlaceholderText('Что хотите заказать?'), 'Пицца');
    await user.click(screen.getByLabelText('Отправить сообщение'));
    await waitFor(() => { expect(mockFetchCart).toHaveBeenCalled(); });
  });

  it('shows error message when streamChat fails', async () => {
    const user = userEvent.setup();
    mockStreamChat.mockRejectedValue(new Error('Network error'));
    render$();
    await user.click(screen.getByLabelText('Помощник заказа'));
    await user.type(screen.getByPlaceholderText('Что хотите заказать?'), 'Тест');
    await user.click(screen.getByLabelText('Отправить сообщение'));
    await waitFor(() => {
      expect(screen.getByText('Не удалось получить ответ. Попробуйте ещё раз.')).toBeInTheDocument();
    });
  });

  it('clears input after send', async () => {
    const user = userEvent.setup();
    render$();
    await user.click(screen.getByLabelText('Помощник заказа'));
    const input = screen.getByPlaceholderText('Что хотите заказать?');
    await user.type(input, 'Тест');
    await user.click(screen.getByLabelText('Отправить сообщение'));
    expect((input as HTMLInputElement).value).toBe('');
  });
});
