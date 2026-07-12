import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { ComponentProps } from 'react';
import type { Restaurant } from '@shared/types/models';
import ShareModal from '../../components/ShareModal/ShareModal';

const RESTAURANT = {
  id: 'resto-1',
  display_id: 'cafe-central',
  name: 'Центральное Кафе',
} as Restaurant;

const render$ = (props: Partial<ComponentProps<typeof ShareModal>> = {}) =>
  render(<ShareModal restaurant={RESTAURANT} onClose={vi.fn()} {...props} />);

let writeTextMock = vi.fn<(data: string) => Promise<void>>();

beforeEach(() => {
  vi.clearAllMocks();
  writeTextMock = vi.fn<(data: string) => Promise<void>>().mockResolvedValue(undefined);
  Object.assign(navigator, {
    clipboard: { writeText: writeTextMock },
  });
  vi.spyOn(window, 'open').mockImplementation(() => null);
});

describe('ShareModal', () => {
  it('renders title "Поделиться"', () => {
    render$();
    expect(screen.getByText('Поделиться')).toBeInTheDocument();
  });

  it('renders Telegram share button', () => {
    render$();
    expect(screen.getByText('Отправить в Telegram')).toBeInTheDocument();
  });

  it('renders copy link button', () => {
    render$();
    expect(screen.getByText('Скопировать ссылку')).toBeInTheDocument();
  });

  it('calls onClose when close button clicked', () => {
    const onClose = vi.fn();
    render$({ onClose });
    fireEvent.click(screen.getByLabelText('Закрыть'));
    expect(onClose).toHaveBeenCalled();
  });

  it('calls onClose when overlay clicked', () => {
    const onClose = vi.fn();
    render$({ onClose });
    const overlay = document.querySelector('.modal-overlay') as HTMLElement;
    fireEvent.mouseDown(overlay, { target: overlay });
    expect(onClose).toHaveBeenCalled();
  });

  it('opens Telegram share URL when Telegram button clicked', () => {
    render$();
    fireEvent.click(screen.getByText('Отправить в Telegram'));
    expect(window.open).toHaveBeenCalledWith(
      expect.stringContaining('t.me/share/url'),
      '_blank'
    );
  });

  it('Telegram URL contains restaurant display_id', () => {
    render$();
    fireEvent.click(screen.getByText('Отправить в Telegram'));
    const firstCall = vi.mocked(window.open).mock.calls[0];
    if (!firstCall) throw new Error('window.open was not called');
    const call = firstCall[0] as string;
    expect(call).toContain('cafe-central');
  });

  it('copies link to clipboard and shows success state', async () => {
    render$();
    await act(async () => {
      fireEvent.click(screen.getByText('Скопировать ссылку'));
      await Promise.resolve();
    });
    await waitFor(() => {
      expect(screen.getByText('Ссылка скопирована!')).toBeInTheDocument();
    });
    expect(writeTextMock).toHaveBeenCalledWith(
      expect.stringContaining('cafe-central')
    );
  });

  it('shows error state when clipboard fails', async () => {
    navigator.clipboard.writeText = vi.fn().mockRejectedValue(new Error('denied'));
    render$();
    await act(async () => {
      fireEvent.click(screen.getByText('Скопировать ссылку'));
      await Promise.resolve();
    });
    await waitFor(() => {
      expect(screen.getByText('Не удалось скопировать')).toBeInTheDocument();
    });
  });

  it('uses restaurant name in Telegram message text', () => {
    render$();
    fireEvent.click(screen.getByText('Отправить в Telegram'));
    const firstCall = vi.mocked(window.open).mock.calls[0];
    if (!firstCall) throw new Error('window.open was not called');
    const call = firstCall[0] as string;
    expect(decodeURIComponent(call)).toContain('Центральное Кафе');
  });
});
