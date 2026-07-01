import { render, screen, waitFor, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import DisplayBoardPage from '../../pages/display-board/DisplayBoardPage';

const mockWsClose = vi.fn();
const mockWsInstance = { close: mockWsClose };
let wsMessageHandler = null;

vi.mock('../../services/api', () => ({
  createDisplayBoardWebSocket: vi.fn((restaurantId, onMessage) => {
    wsMessageHandler = onMessage;
    return mockWsInstance;
  }),
}));

vi.mock('../../services/restaurantService', () => ({
  restaurantService: {
    getById: vi.fn(),
  },
}));

const { createDisplayBoardWebSocket } = await import('../../services/api');
const { restaurantService } = await import('../../services/restaurantService');

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
  restaurantService.getById.mockResolvedValue({ data: { data: { name: 'Тест Кафе' } } });
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
    });
    await waitFor(() => {
      expect(screen.getByText('B-201')).toBeInTheDocument();
    });
  });

  it('updates orders when WS sends new data', async () => {
    render$();
    await act(async () => {
      wsMessageHandler?.({ cooking: ['A-1'], ready: [] });
    });
    await waitFor(() => expect(screen.getByText('A-1')).toBeInTheDocument());

    await act(async () => {
      wsMessageHandler?.({ cooking: ['A-2'], ready: [] });
    });
    await waitFor(() => {
      expect(screen.getByText('A-2')).toBeInTheDocument();
      expect(screen.queryByText('A-1')).not.toBeInTheDocument();
    });
  });

  it('handles restaurant name fetch error gracefully', async () => {
    restaurantService.getById.mockRejectedValue(new Error('Network'));
    render$();
    await waitFor(() => {
      expect(restaurantService.getById).toHaveBeenCalled();
    });
  });

  it('closes WebSocket on unmount', () => {
    const { unmount } = render$();
    unmount();
    expect(mockWsClose).toHaveBeenCalled();
  });
});
