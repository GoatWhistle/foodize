import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { ComponentProps } from 'react';
import type { Restaurant } from '@shared/types/models';
import { ShareModal } from '../../components/ShareModal/ShareModal';
import { t } from '@shared/i18n/useTranslation';
const clipboardWriteText = vi.fn<(data: string) => Promise<void>>();
const RESTAURANT = {
  id: 'resto-1',
  display_id: 'cafe-central',
  name: 'Центральное Кафе',
} as Restaurant;

const render$ = (props: Partial<ComponentProps<typeof ShareModal>> = {}) =>
  render(<ShareModal restaurant={RESTAURANT} onClose={vi.fn()} {...props} />);

beforeEach(() => {
  clipboardWriteText.mockReset();
  clipboardWriteText.mockResolvedValue(undefined);
  Object.defineProperty(navigator, 'clipboard', {
    configurable: true,
    value: { writeText: clipboardWriteText },
  });
  vi.spyOn(window, 'open').mockImplementation(() => null);
});

describe('ShareModal', () => {
  it('renders title "Поделиться"', () => {
    render$();
    expect(screen.getByText(t('profile.share.title'))).toBeInTheDocument();
  });

  it('renders Telegram share button', () => {
    render$();
    expect(screen.getByText(t('profile.share.telegram'))).toBeInTheDocument();
  });

  it('renders copy link button', () => {
    render$();
    expect(screen.getByText(t('profile.share.copyLink'))).toBeInTheDocument();
  });

  it('calls onClose when close button clicked', async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    render$({ onClose });
    await user.click(screen.getByLabelText(t('common.actions.close')));
    expect(onClose).toHaveBeenCalled();
  });

  it('calls onClose when overlay clicked', async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    render$({ onClose });
    await user.click(screen.getByTestId('share-modal-overlay'));
    expect(onClose).toHaveBeenCalled();
  });

  it('opens Telegram share URL when Telegram button clicked', async () => {
    const user = userEvent.setup();
    render$();
    await user.click(screen.getByText(t('profile.share.telegram')));
    expect(window.open).toHaveBeenCalledWith(
      expect.stringContaining('t.me/share/url'),
      '_blank'
    );
  });

  it('Telegram URL contains restaurant display_id', async () => {
    const user = userEvent.setup();
    render$();
    await user.click(screen.getByText(t('profile.share.telegram')));
    const firstCall = vi.mocked(window.open).mock.calls[0];
    if (!firstCall) throw new Error('window.open was not called');
    const call = firstCall[0] as string;
    expect(call).toContain('cafe-central');
  });

  it('copies link to clipboard and shows success state', async () => {
    const user = userEvent.setup();
    Object.defineProperty(navigator, 'clipboard', {
      configurable: true,
      value: { writeText: clipboardWriteText },
    });
    render$();
    await user.click(screen.getByText(t('profile.share.copyLink')));
    await waitFor(() => {
      expect(screen.getByText(t('profile.share.copied'))).toBeInTheDocument();
    });
    expect(clipboardWriteText).toHaveBeenCalledWith(
      expect.stringContaining('cafe-central')
    );
  });

  it('shows error state when clipboard fails', async () => {
    const user = userEvent.setup();
    Object.defineProperty(navigator, 'clipboard', {
      configurable: true,
      value: { writeText: clipboardWriteText },
    });
    clipboardWriteText.mockRejectedValueOnce(new Error('denied'));
    render$();
    await user.click(screen.getByText(t('profile.share.copyLink')));
    await waitFor(() => {
      expect(screen.getByText(t('profile.share.copyFailed'))).toBeInTheDocument();
    });
  });

  it('uses restaurant name in Telegram message text', async () => {
    const user = userEvent.setup();
    render$();
    await user.click(screen.getByText(t('profile.share.telegram')));
    const firstCall = vi.mocked(window.open).mock.calls[0];
    if (!firstCall) throw new Error('window.open was not called');
    const call = firstCall[0] as string;
    expect(decodeURIComponent(call)).toContain('Центральное Кафе');
  });
});
