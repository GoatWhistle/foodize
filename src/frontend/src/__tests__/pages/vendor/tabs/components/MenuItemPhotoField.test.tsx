import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useState } from 'react';
import { MenuItemPhotoField } from '../../../../../pages/vendor/tabs/components/MenuItemPhotoField';
import { EMPTY_MENU_ITEM_FORM, type MenuItemForm } from '../../../../../pages/vendor/tabs/VendorMenuTab';
import { t } from '@shared/i18n/useTranslation';

const Harness = ({ initial }: { initial?: Partial<MenuItemForm> }) => {
  const [form, setForm] = useState<MenuItemForm>({ ...EMPTY_MENU_ITEM_FORM, ...initial });
  return <MenuItemPhotoField menuItemForm={form} setMenuItemForm={setForm} />;
};

describe('MenuItemPhotoField', () => {
  beforeEach(() => {
    vi.stubGlobal('URL', {
      ...URL,
      createObjectURL: vi.fn(() => 'blob:preview'),
    });
  });

  it('renders placeholder and upload label when no photo', () => {
    render(<Harness />);
    expect(screen.getByText(t('vendor.menu.photo.upload'))).toBeInTheDocument();
    expect(screen.queryByAltText(t('vendor.menu.photo.alt'))).not.toBeInTheDocument();
  });

  it('renders existing photo with replace and delete controls', () => {
    render(<Harness initial={{ photoUrl: 'http://img/x.png' }} />);
    expect(screen.getByAltText(t('vendor.menu.photo.alt'))).toBeInTheDocument();
    expect(screen.getByText(t('vendor.menu.photo.replace'))).toBeInTheDocument();
    expect(screen.getByText(t('vendor.menu.photo.remove'))).toBeInTheDocument();
  });

  it('selecting a file sets preview url', async () => {
    const user = userEvent.setup();
    const { container } = render(<Harness />);
    const input = container.querySelector('input[type="file"]') as HTMLInputElement;
    const file = new File(['x'], 'p.png', { type: 'image/png' });
    await user.upload(input, file);
    expect(await screen.findByAltText(t('vendor.menu.photo.alt'))).toHaveAttribute('src', 'blob:preview');
  });

  it('ignores empty file selection', async () => {
    const { container } = render(<Harness />);
    const input = container.querySelector('input[type="file"]') as HTMLInputElement;
    const { fireEvent } = await import('@testing-library/react');
    fireEvent.change(input, { target: { files: [] } });
    expect(screen.queryByAltText(t('vendor.menu.photo.alt'))).not.toBeInTheDocument();
  });

  it('removes photo on delete click', async () => {
    const user = userEvent.setup();
    render(<Harness initial={{ photoUrl: 'http://img/x.png' }} />);
    await user.click(screen.getByText(t('vendor.menu.photo.remove')));
    expect(screen.queryByAltText(t('vendor.menu.photo.alt'))).not.toBeInTheDocument();
  });
});
