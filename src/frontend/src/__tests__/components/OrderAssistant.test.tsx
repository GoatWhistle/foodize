import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';

const mockFetchCart = vi.fn();
const mockStreamChat = vi.fn();

vi.mock('../../store/useOrderStore', () => ({
  useOrderStore: vi.fn((sel?: (s: { fetchCart: typeof mockFetchCart }) => unknown) => {
    const state = { fetchCart: mockFetchCart };
    return sel ? sel(state) : state;
  }),
}));

vi.mock('@shared/services/aiOrderService.js', () => ({
  aiOrderService: {
    streamChat: mockStreamChat,
  },
}));

const { default: OrderAssistant } = await import('../../components/OrderAssistant/OrderAssistant');

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

  it('opens panel when button clicked', () => {
    render$();
    fireEvent.click(screen.getByLabelText('Помощник заказа'));
    expect(screen.getByText('Помощник заказа')).toBeInTheDocument();
  });

  it('shows suggestions when panel is open and no messages', () => {
    render$();
    fireEvent.click(screen.getByLabelText('Помощник заказа'));
    expect(screen.getByText('Где острая шаурма дешевле 350?')).toBeInTheDocument();
    expect(screen.getByText('Хочу два бургера и колу')).toBeInTheDocument();
    expect(screen.getByText('Что есть на десерт?')).toBeInTheDocument();
  });

  it('closes panel when X button clicked', () => {
    render$();
    fireEvent.click(screen.getByLabelText('Помощник заказа'));
    fireEvent.click(screen.getByLabelText('Закрыть'));
    expect(screen.getByLabelText('Помощник заказа')).toBeInTheDocument();
    expect(screen.queryByText('Помощник заказа')).not.toBeInTheDocument();
  });

  it('send button is disabled when input is empty', () => {
    render$();
    fireEvent.click(screen.getByLabelText('Помощник заказа'));
    expect(screen.getByLabelText('Отправить сообщение')).toBeDisabled();
  });

  it('send button enables when input has text', () => {
    render$();
    fireEvent.click(screen.getByLabelText('Помощник заказа'));
    fireEvent.change(screen.getByPlaceholderText('Что хотите заказать?'), {
      target: { value: 'Хочу пиццу' },
    });
    expect(screen.getByLabelText('Отправить сообщение')).not.toBeDisabled();
  });

  it('sends message on form submit and calls streamChat', async () => {
    render$();
    fireEvent.click(screen.getByLabelText('Помощник заказа'));
    fireEvent.change(screen.getByPlaceholderText('Что хотите заказать?'), {
      target: { value: 'Хочу пиццу' },
    });
    await act(async () => {
      fireEvent.submit(screen.getByPlaceholderText('Что хотите заказать?').closest('form') as HTMLFormElement);
      await Promise.resolve();
    });
    expect(mockStreamChat).toHaveBeenCalledOnce();
    const [messages] = mockStreamChat.mock.calls[0] as [Array<{ role: string; content: string }>];
    expect(messages[0]).toEqual({ role: 'user', content: 'Хочу пиццу' });
  });

  it('sends suggestion on suggestion button click', async () => {
    render$();
    fireEvent.click(screen.getByLabelText('Помощник заказа'));
    await act(async () => {
      fireEvent.click(screen.getByText('Хочу два бургера и колу'));
      await Promise.resolve();
    });
    expect(mockStreamChat).toHaveBeenCalledOnce();
  });

  it('calls fetchCart after message sent', async () => {
    render$();
    fireEvent.click(screen.getByLabelText('Помощник заказа'));
    fireEvent.change(screen.getByPlaceholderText('Что хотите заказать?'), {
      target: { value: 'Пицца' },
    });
    await act(async () => {
      fireEvent.submit(screen.getByPlaceholderText('Что хотите заказать?').closest('form') as HTMLFormElement);
      await Promise.resolve();
    });
    await waitFor(() => expect(mockFetchCart).toHaveBeenCalled());
  });

  it('shows error message when streamChat fails', async () => {
    mockStreamChat.mockRejectedValue(new Error('Network error'));
    render$();
    fireEvent.click(screen.getByLabelText('Помощник заказа'));
    fireEvent.change(screen.getByPlaceholderText('Что хотите заказать?'), {
      target: { value: 'Тест' },
    });
    await act(async () => {
      fireEvent.submit(screen.getByPlaceholderText('Что хотите заказать?').closest('form') as HTMLFormElement);
      await Promise.resolve();
    });
    await waitFor(() => {
      expect(screen.getByText('Не удалось получить ответ. Попробуйте ещё раз.')).toBeInTheDocument();
    });
  });

  it('clears input after send', async () => {
    render$();
    fireEvent.click(screen.getByLabelText('Помощник заказа'));
    const input = screen.getByPlaceholderText('Что хотите заказать?');
    fireEvent.change(input, { target: { value: 'Тест' } });
    await act(async () => {
      fireEvent.submit(input.closest('form') as HTMLFormElement);
      await Promise.resolve();
    });
    expect((input as HTMLInputElement).value).toBe('');
  });
});
