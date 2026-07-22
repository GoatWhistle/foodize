import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi } from 'vitest';
import { useState } from 'react';
import { MenuItemForm } from '../../../../pages/vendor/tabs/MenuItemForm';
import { EMPTY_MENU_ITEM_FORM, type MenuItemForm as MenuItemFormValues } from '../../../../pages/vendor/tabs/VendorMenuTab';
import type { MenuItem } from '@shared/types/models';
import { t } from '@shared/i18n/useTranslation';

const Harness = ({
  editingItem = null,
  formError = '',
  formLoading = false,
  onSave = vi.fn(),
  setShowAddItem = vi.fn(),
  setEditingItem = vi.fn(),
}: {
  editingItem?: MenuItem | null;
  formError?: string;
  formLoading?: boolean;
  onSave?: (e: React.FormEvent<HTMLFormElement>) => void;
  setShowAddItem?: React.Dispatch<React.SetStateAction<boolean>>;
  setEditingItem?: React.Dispatch<React.SetStateAction<MenuItem | null>>;
}) => {
  const [form, setForm] = useState<MenuItemFormValues>(EMPTY_MENU_ITEM_FORM);
  return (
    <MenuItemForm
      editingItem={editingItem}
      menuItemForm={form}
      setMenuItemForm={setForm}
      formLoading={formLoading}
      formError={formError}
      handleSaveMenuItem={onSave}
      setShowAddItem={setShowAddItem}
      setEditingItem={setEditingItem}
    />
  );
};

describe('MenuItemForm', () => {
  it('renders new item title and fields', () => {
    render(<Harness />);
    expect(screen.getByText(t('vendor.menu.form.newTitle'))).toBeInTheDocument();
    expect(screen.getByPlaceholderText(t('common.labels.title'))).toBeInTheDocument();
    expect(screen.getByPlaceholderText(t('common.labels.price'))).toBeInTheDocument();
  });

  it('renders edit title when editing', () => {
    render(<Harness editingItem={{ id: 'i1' } as unknown as MenuItem} />);
    expect(screen.getByText(t('vendor.menu.form.editTitle'))).toBeInTheDocument();
  });

  it('shows form error', () => {
    render(<Harness formError="Ошибка формы" />);
    expect(screen.getByText('Ошибка формы')).toBeInTheDocument();
  });

  it('edits name, description, price and category', async () => {
    const user = userEvent.setup();
    render(<Harness />);
    await user.type(screen.getByPlaceholderText(t('common.labels.title')), 'Пицца');
    expect(screen.getByPlaceholderText<HTMLInputElement>(t('common.labels.title')).value).toBe('Пицца');
    await user.type(screen.getByPlaceholderText(t('common.labels.description')), 'Вкусно');
    await user.type(screen.getByPlaceholderText(t('common.labels.price')), '500');
    await user.selectOptions(screen.getByRole('combobox'), 'BURGER');
    expect(screen.getByRole<HTMLSelectElement>('combobox').value).toBe('BURGER');
  });

  it('submits the form', async () => {
    const user = userEvent.setup();
    const onSave = vi.fn((e: React.FormEvent) => { e.preventDefault(); });
    render(<Harness onSave={onSave} />);
    await user.type(screen.getByPlaceholderText(t('common.labels.title')), 'X');
    await user.type(screen.getByPlaceholderText(t('common.labels.price')), '1');
    await user.click(screen.getByRole('button', { name: t('common.actions.save') }));
    expect(onSave).toHaveBeenCalled();
  });

  it('cancel resets form and hides', async () => {
    const user = userEvent.setup();
    const setShowAddItem = vi.fn();
    const setEditingItem = vi.fn();
    render(<Harness setShowAddItem={setShowAddItem} setEditingItem={setEditingItem} />);
    await user.click(screen.getByRole('button', { name: t('common.actions.cancel') }));
    expect(setShowAddItem).toHaveBeenCalledWith(false);
    expect(setEditingItem).toHaveBeenCalledWith(null);
  });

  it('disables submit when loading', () => {
    render(<Harness formLoading />);
    expect(screen.getByRole('button', { name: t('common.actions.save') })).toBeDisabled();
  });
});
