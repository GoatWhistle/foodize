import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect } from 'vitest';
import { useState } from 'react';
import { MenuItemOptionGroups } from '../../../../../pages/vendor/tabs/components/MenuItemOptionGroups';
import { EMPTY_MENU_ITEM_FORM, type MenuItemForm, type OptionGroupDraft } from '../../../../../pages/vendor/tabs/VendorMenuTab';
import { at } from '../../../../testUtils';

const Harness = ({ groups }: { groups?: OptionGroupDraft[] }) => {
  const [form, setForm] = useState<MenuItemForm>({
    ...EMPTY_MENU_ITEM_FORM,
    option_groups: groups ?? [],
  });
  return <MenuItemOptionGroups menuItemForm={form} setMenuItemForm={setForm} />;
};

const oneGroup = (): OptionGroupDraft[] => [
  {
    draftId: 'g1',
    name: 'Соусы',
    selection_type: 'multiple',
    is_required: false,
    min_selected: 0,
    max_selected: '',
    options: [
      { draftId: 'o1', name: 'Кетчуп', price_delta: '0' },
      { draftId: 'o2', name: 'Майонез', price_delta: '10' },
    ],
  },
];

describe('MenuItemOptionGroups', () => {
  it('renders header and adds a new group', async () => {
    const user = userEvent.setup();
    render(<Harness />);
    expect(screen.getByText('Опции блюда')).toBeInTheDocument();
    expect(screen.queryByPlaceholderText('Название группы')).not.toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: /Группа/ }));
    expect(screen.getByPlaceholderText('Название группы')).toBeInTheDocument();
  });

  it('patches group name through card', async () => {
    const user = userEvent.setup();
    render(<Harness groups={oneGroup()} />);
    const input = screen.getByPlaceholderText('Название группы');
    await user.clear(input);
    await user.type(input, 'Топпинги');
    expect((input as HTMLInputElement).value).toBe('Топпинги');
  });

  it('removes a group', async () => {
    const user = userEvent.setup();
    render(<Harness groups={oneGroup()} />);
    const removeGroupBtn = at(screen.getAllByRole("button"), 1);
    await user.click(removeGroupBtn);
    expect(screen.queryByPlaceholderText('Название группы')).not.toBeInTheDocument();
  });

  it('adds and removes an option and patches option fields', async () => {
    const user = userEvent.setup();
    render(<Harness groups={oneGroup()} />);
    await user.click(screen.getByRole('button', { name: /Опция/ }));
    expect(screen.getAllByPlaceholderText('Опция')).toHaveLength(3);

    const optionInputs = screen.getAllByPlaceholderText('Опция');
    await user.type(at(optionInputs, 0), '!');
    expect((optionInputs[0] as HTMLInputElement).value).toBe('Кетчуп!');

    const priceInputs = screen.getAllByPlaceholderText('+₽');
    await user.type(at(priceInputs, 1), '5');
    expect((priceInputs[1] as HTMLInputElement).value).toBe('105');

    const buttons = screen.getAllByRole('button');
    const optionRemoveBtn = buttons.find((b) => b.getAttribute('type') === 'button' && b.previousElementSibling?.getAttribute('placeholder') === '+₽');
    await user.click(optionRemoveBtn as HTMLElement);
    expect(screen.getAllByPlaceholderText('Опция').length).toBeLessThan(3);
  });

  it('changes selection type to single', async () => {
    const user = userEvent.setup();
    render(<Harness groups={oneGroup()} />);
    await user.selectOptions(screen.getByRole('combobox'), 'single');
    expect(screen.getByPlaceholderText('Макс. выборов')).toBeDisabled();
  });

  it('toggles required checkbox', async () => {
    const user = userEvent.setup();
    render(<Harness groups={oneGroup()} />);
    const checkbox = screen.getByRole('checkbox');
    await user.click(checkbox);
    expect(checkbox).toBeChecked();
  });
});
