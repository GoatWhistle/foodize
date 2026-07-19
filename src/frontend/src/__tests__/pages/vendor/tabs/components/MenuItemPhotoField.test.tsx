import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useState } from 'react';
import { MenuItemPhotoField } from '../../../../../pages/vendor/tabs/components/MenuItemPhotoField';
import { EMPTY_MENU_ITEM_FORM, type MenuItemForm } from '../../../../../pages/vendor/tabs/VendorMenuTab';

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
    expect(screen.getByText('Загрузить фото')).toBeInTheDocument();
    expect(screen.queryByAltText('Фото блюда')).not.toBeInTheDocument();
  });

  it('renders existing photo with replace and delete controls', () => {
    render(<Harness initial={{ photoUrl: 'http://img/x.png' }} />);
    expect(screen.getByAltText('Фото блюда')).toBeInTheDocument();
    expect(screen.getByText('Заменить фото')).toBeInTheDocument();
    expect(screen.getByText('Удалить фото')).toBeInTheDocument();
  });

  it('selecting a file sets preview url', async () => {
    const user = userEvent.setup();
    const { container } = render(<Harness />);
    const input = container.querySelector('input[type="file"]') as HTMLInputElement;
    const file = new File(['x'], 'p.png', { type: 'image/png' });
    await user.upload(input, file);
    expect(await screen.findByAltText('Фото блюда')).toHaveAttribute('src', 'blob:preview');
  });

  it('ignores empty file selection', async () => {
    const { container } = render(<Harness />);
    const input = container.querySelector('input[type="file"]') as HTMLInputElement;
    const { fireEvent } = await import('@testing-library/react');
    fireEvent.change(input, { target: { files: [] } });
    expect(screen.queryByAltText('Фото блюда')).not.toBeInTheDocument();
  });

  it('removes photo on delete click', async () => {
    const user = userEvent.setup();
    render(<Harness initial={{ photoUrl: 'http://img/x.png' }} />);
    await user.click(screen.getByText('Удалить фото'));
    expect(screen.queryByAltText('Фото блюда')).not.toBeInTheDocument();
  });
});
