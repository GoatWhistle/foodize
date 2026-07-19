import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import type { Restaurant } from '@shared/types/models';
import { QRCodeModal } from '../../components/QRCodeModal/QRCodeModal';
import QRCode from 'qrcode';
import { logError } from '@shared/utils/logError';

vi.mock('qrcode', () => ({
  default: {
    toCanvas: vi.fn().mockResolvedValue(undefined),
    toDataURL: vi.fn().mockResolvedValue('data:image/png;base64,test'),
  },
}));

vi.mock('@shared/utils/logError', () => ({ logError: vi.fn() }));

const restaurant = {
  id: 'restaurant-uuid',
  display_id: 'food-court-7',
  name: 'Food Court',
} as Restaurant;

beforeEach(() => {
  vi.stubEnv('VITE_WEB_URL', 'https://foodize.test/');
  vi.stubEnv('VITE_BOT_USERNAME', '@FoodizeBot');
  vi.clearAllMocks();
});

afterEach(() => {
  vi.unstubAllEnvs();
});

describe('QRCodeModal extra', () => {
  it('downloads a PNG with a sanitized filename', async () => {
    const user = userEvent.setup();
    const clickSpy = vi.fn();
    type CreateElement = (tag: string, options?: ElementCreationOptions) => HTMLElement;
    const createElementRef: CreateElement = Reflect.get(Document.prototype, 'createElement');
    const originalCreate = createElementRef.bind(document);
    const anchor = originalCreate('a') as HTMLAnchorElement;
    anchor.click = clickSpy;
    const createSpy = vi.spyOn(document, 'createElement').mockImplementation((tag: string) => {
      if (tag === 'a') return anchor;
      return originalCreate(tag);
    });

    render(<QRCodeModal restaurant={restaurant} onClose={vi.fn()} />);
    await user.click(screen.getByRole('button', { name: 'Скачать PNG' }));

    await waitFor(() => {
      expect(QRCode.toDataURL).toHaveBeenCalledWith(
        'https://foodize.test/restaurants/food-court-7',
        expect.objectContaining({ width: 512 })
      );
    });
    expect(anchor.download).toBe('qr_site_Food_Court.png');
    expect(anchor.href).toContain('data:image/png');
    expect(clickSpy).toHaveBeenCalled();
    createSpy.mockRestore();
  });

  it('logs an error when download fails', async () => {
    const user = userEvent.setup();
    vi.mocked(QRCode.toDataURL).mockRejectedValueOnce(new Error('boom'));
    render(<QRCodeModal restaurant={restaurant} onClose={vi.fn()} />);
    await user.click(screen.getByRole('button', { name: 'Скачать PNG' }));
    await waitFor(() => {
      expect(logError).toHaveBeenCalledWith('QRCodeModal.download', expect.any(Error));
    });
  });

  it('logs an error when canvas rendering fails', async () => {
    vi.mocked(QRCode.toCanvas).mockRejectedValueOnce(new Error('canvas fail'));
    render(<QRCodeModal restaurant={restaurant} onClose={vi.fn()} />);
    await waitFor(() => {
      expect(logError).toHaveBeenCalledWith('QRCodeModal.toCanvas', expect.any(Error));
    });
  });

  it('shows the telegram fallback message and disables download when bot username missing', async () => {
    vi.stubEnv('VITE_BOT_USERNAME', '');
    const user = userEvent.setup();
    const clearRect = vi.fn();
    vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue({
      clearRect,
    } as unknown as CanvasRenderingContext2D);

    render(<QRCodeModal restaurant={restaurant} onClose={vi.fn()} />);
    await user.click(screen.getByRole('button', { name: 'Telegram' }));

    expect(
      screen.getByText(/Для Telegram QR задайте VITE_BOT_USERNAME/)
    ).toBeInTheDocument();
    const download = screen.getByRole('button', { name: 'Скачать PNG' });
    expect(download).toBeDisabled();
    await user.click(download);
    expect(QRCode.toDataURL).not.toHaveBeenCalled();
    await waitFor(() => {
      expect(clearRect).toHaveBeenCalled();
    });
  });

  it('closes when clicking the overlay backdrop', async () => {
    const onClose = vi.fn();
    const user = userEvent.setup();
    render(<QRCodeModal restaurant={restaurant} onClose={onClose} />);
    const dialog = screen.getByRole('dialog');
    const overlay = dialog.parentElement as HTMLElement;
    await user.pointer({ target: overlay, keys: '[MouseLeft>]' });
    expect(onClose).toHaveBeenCalled();
  });

  it('does not close when clicking inside the dialog content', async () => {
    const onClose = vi.fn();
    const user = userEvent.setup();
    render(<QRCodeModal restaurant={restaurant} onClose={onClose} />);
    await user.pointer({ target: screen.getByRole('dialog'), keys: '[MouseLeft>]' });
    expect(onClose).not.toHaveBeenCalled();
  });

  it('closes via the header close button', async () => {
    const onClose = vi.fn();
    const user = userEvent.setup();
    render(<QRCodeModal restaurant={restaurant} onClose={onClose} />);
    await user.click(screen.getByRole('button', { name: 'Закрыть' }));
    expect(onClose).toHaveBeenCalled();
  });

  it('honors initialType telegram', () => {
    render(<QRCodeModal restaurant={restaurant} onClose={vi.fn()} initialType="telegram" />);
    expect(
      screen.getByText('https://t.me/FoodizeBot?start=restaurant_food-court-7')
    ).toBeInTheDocument();
  });

  it('falls back to window.location.origin when VITE_WEB_URL unset', () => {
    vi.stubEnv('VITE_WEB_URL', '');
    render(<QRCodeModal restaurant={restaurant} onClose={vi.fn()} />);
    expect(
      screen.getByText(`${window.location.origin}/restaurants/food-court-7`)
    ).toBeInTheDocument();
  });
});
