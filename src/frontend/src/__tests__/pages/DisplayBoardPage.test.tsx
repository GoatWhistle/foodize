import { render, screen, waitFor, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { DisplayBoardPage } from '../../pages/display-board/DisplayBoardPage';
import { t } from '@shared/i18n/useTranslation';
type WsMessage = { cooking: string[]; ready: string[] };
type WsMessageHandler = (msg: WsMessage) => void;

const mockWsClose = vi.fn();
const mockWsInstance = { close: mockWsClose };
let wsMessageHandler: WsMessageHandler | null = null;

vi.mock('../../services/api', () => ({
  createDisplayBoardWebSocket: vi.fn((_restaurantId: string, onMessage: WsMessageHandler) => {
    wsMessageHandler = onMessage;
    return mockWsInstance;
  }),
}));

vi.mock('@shared/services/restaurantService.js', () => ({
  restaurantService: {
    getById: vi.fn(),
  },
}));

const { createDisplayBoardWebSocket } = await import('../../services/api');
const { restaurantService } = await import('@shared/services/restaurantService');

const render$ = (restaurantId = 'resto-1') =>
  render(
    <MemoryRouter initialEntries={[`/display/${restaurantId}`]}>
      <Routes>
        <Route path="/display/:restaurantId" element={<DisplayBoardPage />} />
      </Routes>
    </MemoryRouter>
  );

beforeEach(() => {
  vi.clearAllMocks();
  wsMessageHandler = null;
  mockWsClose.mockClear();
  vi.mocked(restaurantService.getById).mockResolvedValue({ data: { data: { name: 'Тест Кафе' } } } as unknown as Awaited<ReturnType<typeof restaurantService.getById>>);
});

describe('DisplayBoardPage', () => {
  it('connects to WebSocket with correct restaurantId', () => {
    render$('my-resto');
    expect(createDisplayBoardWebSocket).toHaveBeenCalledWith('my-resto', expect.any(Function), null);
  });

  it('loads and displays restaurant name', async () => {
    render$();
    await waitFor(() => {
      expect(screen.getByText('Тест Кафе')).toBeInTheDocument();
    });
  });

  it('shows cooking orders from WS message', async () => {
    render$();
    await act(async () => {
      wsMessageHandler?.({ cooking: ['A-101', 'A-102'], ready: [] });
      await Promise.resolve();
    });
    await waitFor(() => {
      expect(screen.getByText('A-101')).toBeInTheDocument();
      expect(screen.getByText('A-102')).toBeInTheDocument();
    });
  });

  it('shows ready orders from WS message', async () => {
    render$();
    await act(async () => {
      wsMessageHandler?.({ cooking: [], ready: ['B-201'] });
      await Promise.resolve();
    });
    await waitFor(() => {
      expect(screen.getByText('B-201')).toBeInTheDocument();
    });
  });

  it('updates orders when WS sends new data', async () => {
    render$();
    await act(async () => {
      wsMessageHandler?.({ cooking: ['A-1'], ready: [] });
      await Promise.resolve();
    });
    await waitFor(() => { expect(screen.getByText('A-1')).toBeInTheDocument(); });

    await act(async () => {
      wsMessageHandler?.({ cooking: ['A-2'], ready: [] });
      await Promise.resolve();
    });
    await waitFor(() => {
      expect(screen.getByText('A-2')).toBeInTheDocument();
      expect(screen.queryByText('A-1')).not.toBeInTheDocument();
    });
  });

  it('handles restaurant name fetch error gracefully', async () => {
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    vi.mocked(restaurantService.getById).mockRejectedValue(new Error('Network'));
    render$();

    await waitFor(() => {
      expect(errorSpy).toHaveBeenCalledWith(
        '[DisplayBoardPage.getRestaurant]',
        expect.any(Error)
      );
    });

    expect(screen.getByText(t('staff.displayBoard.cooking'))).toBeInTheDocument();
    expect(screen.getByText(t('staff.displayBoard.ready'))).toBeInTheDocument();

    errorSpy.mockRestore();
  });

  it('closes WebSocket on unmount', () => {
    const { unmount } = render$();
    unmount();
    expect(mockWsClose).toHaveBeenCalled();
  });

  it('does not connect when restaurantId is missing', () => {
    render(
      <MemoryRouter initialEntries={['/display']}>
        <Routes>
          <Route path="/display" element={<DisplayBoardPage />} />
        </Routes>
      </MemoryRouter>
    );
    expect(createDisplayBoardWebSocket).not.toHaveBeenCalled();
    expect(restaurantService.getById).not.toHaveBeenCalled();
  });

  it('defaults missing cooking and ready arrays to empty', async () => {
    render$();
    await act(async () => {
      wsMessageHandler?.({} as unknown as WsMessage);
      await Promise.resolve();
    });
    const counts = screen.getAllByText('0');
    expect(counts.length).toBeGreaterThanOrEqual(2);
  });

  it('clears the new-order highlight after the timeout', async () => {
    vi.useFakeTimers();
    try {
      render$();
      await act(async () => {
        wsMessageHandler?.({ cooking: ['A-9'], ready: ['B-9'] });
        await Promise.resolve();
      });
      const cooking = screen.getByText('A-9').parentElement as HTMLElement;
      expect(cooking.style.animation).not.toBe('');

      await act(async () => {
        vi.advanceTimersByTime(2000);
        await Promise.resolve();
      });
      const cookingAfter = screen.getByText('A-9').parentElement as HTMLElement;
      expect(cookingAfter.style.animation).toBe('');
    } finally {
      vi.useRealTimers();
    }
  });

  it('falls back to empty restaurant name', async () => {
    vi.mocked(restaurantService.getById).mockResolvedValue({
      data: { data: { name: '' } },
    } as unknown as Awaited<ReturnType<typeof restaurantService.getById>>);
    render$();
    await waitFor(() => {
      expect(createDisplayBoardWebSocket).toHaveBeenCalled();
    });
    expect(screen.getByText(t('staff.displayBoard.cooking'))).toBeInTheDocument();
  });
});
