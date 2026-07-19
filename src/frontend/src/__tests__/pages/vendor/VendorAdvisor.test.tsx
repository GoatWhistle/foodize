import { render, screen, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { createRef } from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AdvisorInsights } from '../../../pages/vendor/components/AdvisorInsights';
import { AdvisorChat } from '../../../pages/vendor/components/AdvisorChat';
import { VendorAdvisorPanel } from '../../../pages/vendor/VendorAdvisorPanel';
import type { AdvisorChatMessage } from '../../../services/aiAdvisorService';

vi.mock('../../../services/aiAdvisorService', () => ({
  aiAdvisorService: {
    getInsights: vi.fn(),
    streamChat: vi.fn(),
  },
}));

const { aiAdvisorService } = await import('../../../services/aiAdvisorService');

describe('AdvisorInsights', () => {
  it('renders load button when no insights', async () => {
    const onLoad = vi.fn();
    render(<AdvisorInsights insights={null} insightsLoading={false} onLoad={onLoad} />);
    const btn = screen.getByRole('button', { name: /Получить анализ/ });
    await userEvent.click(btn);
    expect(onLoad).toHaveBeenCalled();
  });

  it('renders refresh button and insight text when insights present', () => {
    render(<AdvisorInsights insights="Продажи растут" insightsLoading={false} onLoad={vi.fn()} />);
    expect(screen.getByRole('button', { name: /Обновить/ })).toBeInTheDocument();
    expect(screen.getByText('Продажи растут')).toBeInTheDocument();
  });

  it('shows loading label and disables button', () => {
    render(<AdvisorInsights insights={null} insightsLoading={true} onLoad={vi.fn()} />);
    expect(screen.getByRole('button', { name: /Анализирую/ })).toBeDisabled();
  });
});

describe('AdvisorChat', () => {
  const baseProps = {
    messages: [] as AdvisorChatMessage[],
    input: '',
    streaming: false,
    error: null as string | null,
    scrollRef: createRef<HTMLDivElement>(),
    onInputChange: vi.fn(),
    onSend: vi.fn(),
  };

  beforeEach(() => vi.clearAllMocks());

  it('renders suggestions when no messages and sends one on click', async () => {
    const onSend = vi.fn();
    render(<AdvisorChat {...baseProps} onSend={onSend} />);
    await userEvent.click(screen.getByRole('button', { name: 'Что добавить в меню?' }));
    expect(onSend).toHaveBeenCalledWith('Что добавить в меню?');
  });

  it('renders message bubbles and typing placeholder for streaming assistant', () => {
    render(
      <AdvisorChat
        {...baseProps}
        streaming
        messages={[
          { role: 'user', content: 'Привет' },
          { role: 'assistant', content: '' },
        ]}
      />,
    );
    expect(screen.getByText('Привет')).toBeInTheDocument();
    expect(screen.getByText('…')).toBeInTheDocument();
  });

  it('shows error message', () => {
    render(<AdvisorChat {...baseProps} error="Ошибка сети" />);
    expect(screen.getByText('Ошибка сети')).toBeInTheDocument();
  });

  it('calls onInputChange when typing and onSend on submit', async () => {
    const onInputChange = vi.fn();
    const onSend = vi.fn();
    render(
      <AdvisorChat {...baseProps} input="меню" onInputChange={onInputChange} onSend={onSend} />,
    );
    const input = screen.getByPlaceholderText(/что добавить в меню/);
    await userEvent.type(input, 'x');
    expect(onInputChange).toHaveBeenCalled();
    await userEvent.click(screen.getByRole('button', { name: '' }));
    expect(onSend).toHaveBeenCalled();
  });

  it('disables submit when input empty', () => {
    render(<AdvisorChat {...baseProps} input="   " />);
    const buttons = screen.getAllByRole('button');
    expect(buttons[buttons.length - 1]).toBeDisabled();
  });
});

describe('VendorAdvisorPanel', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    Element.prototype.scrollTo = vi.fn();
  });

  it('loads insights on button click', async () => {
    vi.mocked(aiAdvisorService.getInsights).mockResolvedValue({
      data: { data: { insights: 'Хороший рост' } },
    } as unknown as Awaited<ReturnType<typeof aiAdvisorService.getInsights>>);
    render(<VendorAdvisorPanel restaurantId="r1" />);
    await userEvent.click(screen.getByRole('button', { name: /Получить анализ/ }));
    await waitFor(() => { expect(screen.getByText('Хороший рост')).toBeInTheDocument(); });
    expect(aiAdvisorService.getInsights).toHaveBeenCalledWith(false);
  });

  it('shows error when insights request fails', async () => {
    vi.mocked(aiAdvisorService.getInsights).mockRejectedValue(new Error('boom'));
    render(<VendorAdvisorPanel restaurantId="r1" />);
    await userEvent.click(screen.getByRole('button', { name: /Получить анализ/ }));
    await waitFor(() =>
      { expect(screen.getByText(/Не удалось получить анализ/)).toBeInTheDocument(); },
    );
  });

  it('sends a chat message and streams assistant chunks', async () => {
    vi.mocked(aiAdvisorService.streamChat).mockImplementation(
      (_msgs, opts) => {
        opts?.onChunk?.('Ответ');
        return Promise.resolve();
      },
    );
    render(<VendorAdvisorPanel restaurantId="r1" />);
    await userEvent.click(screen.getByRole('button', { name: 'Как поднять средний чек?' }));
    await waitFor(() => { expect(screen.getByText('Ответ')).toBeInTheDocument(); });
    expect(aiAdvisorService.streamChat).toHaveBeenCalled();
  });

  it('shows error and rolls back on stream failure', async () => {
    vi.mocked(aiAdvisorService.streamChat).mockRejectedValue(new Error('net'));
    render(<VendorAdvisorPanel restaurantId="r1" />);
    await userEvent.click(screen.getByRole('button', { name: 'Что добавить в меню?' }));
    await waitFor(() =>
      { expect(screen.getByText(/Не удалось получить ответ/)).toBeInTheDocument(); },
    );
  });

  it('types into input and submits via form', async () => {
    vi.mocked(aiAdvisorService.streamChat).mockImplementation((_m, opts) => {
      opts?.onChunk?.('hi');
      return Promise.resolve();
    });
    render(<VendorAdvisorPanel restaurantId="r1" />);
    const input = screen.getByPlaceholderText(/что добавить в меню/);
    await userEvent.type(input, 'Вопрос{Enter}');
    await waitFor(() => { expect(aiAdvisorService.streamChat).toHaveBeenCalled(); });
  });

  it('aborts on unmount without error', async () => {
    vi.mocked(aiAdvisorService.streamChat).mockImplementation(
      () => new Promise(() => undefined),
    );
    const { unmount } = render(<VendorAdvisorPanel restaurantId="r1" />);
    await userEvent.click(screen.getByRole('button', { name: 'Что добавить в меню?' }));
    await act(async () => {
      unmount();
      await Promise.resolve();
    });
    expect(aiAdvisorService.streamChat).toHaveBeenCalled();
  });
});
