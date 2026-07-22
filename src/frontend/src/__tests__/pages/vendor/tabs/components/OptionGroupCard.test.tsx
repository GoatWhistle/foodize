import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi } from 'vitest';
import { OptionGroupCard } from '../../../../../pages/vendor/tabs/components/OptionGroupCard';
import type { OptionGroupDraft } from '../../../../../pages/vendor/tabs/VendorMenuTab';
import { at } from '../../../../testUtils';
import { t } from '@shared/i18n/useTranslation';

const makeGroup = (overrides: Partial<OptionGroupDraft> = {}): OptionGroupDraft => ({
  draftId: 'g1',
  name: 'Соусы',
  selection_type: 'multiple',
  is_required: false,
  min_selected: 0,
  max_selected: '',
  options: [{ draftId: 'o1', name: 'Кетчуп', price_delta: '0' }],
  ...overrides,
});

const setup = (overrides: Partial<OptionGroupDraft> = {}) => {
  const handlers = {
    onPatchGroup: vi.fn(),
    onRemoveGroup: vi.fn(),
    onPatchOption: vi.fn(),
    onRemoveOption: vi.fn(),
    onAddOption: vi.fn(),
  };
  render(<OptionGroupCard group={makeGroup(overrides)} {...handlers} />);
  return handlers;
};

describe('OptionGroupCard', () => {
  it('patches group name', async () => {
    const user = userEvent.setup();
    const h = setup();
    await user.type(screen.getByPlaceholderText(t('vendor.menu.options.groupNamePlaceholder')), 'X');
    expect(h.onPatchGroup).toHaveBeenCalledWith({ name: 'СоусыX' });
  });

  it('removes group', async () => {
    const user = userEvent.setup();
    const h = setup();
    const buttons = screen.getAllByRole('button');
    await user.click(at(buttons, 0));
    expect(h.onRemoveGroup).toHaveBeenCalled();
  });

  it('changes selection_type to single sets max_selected 1', async () => {
    const user = userEvent.setup();
    const h = setup();
    await user.selectOptions(screen.getByRole('combobox'), 'single');
    expect(h.onPatchGroup).toHaveBeenCalledWith({ selection_type: 'single', max_selected: 1 });
  });

  it('changes selection_type back to multiple', async () => {
    const user = userEvent.setup();
    const h = setup({ selection_type: 'single', max_selected: 1 });
    await user.selectOptions(screen.getByRole('combobox'), 'multiple');
    expect(h.onPatchGroup).toHaveBeenCalledWith({ selection_type: 'multiple' });
  });

  it('disables max_selected input when single', () => {
    setup({ selection_type: 'single', max_selected: 1 });
    expect(screen.getByPlaceholderText(t('vendor.menu.options.maxChoicesPlaceholder'))).toBeDisabled();
  });

  it('patches max_selected when multiple', async () => {
    const user = userEvent.setup();
    const h = setup();
    await user.type(screen.getByPlaceholderText(t('vendor.menu.options.maxChoicesPlaceholder')), '3');
    expect(h.onPatchGroup).toHaveBeenCalledWith({ max_selected: '3' });
  });

  it('toggles required checkbox on and off', async () => {
    const user = userEvent.setup();
    const h = setup();
    await user.click(screen.getByRole('checkbox'));
    expect(h.onPatchGroup).toHaveBeenCalledWith({ is_required: true, min_selected: 1 });
    h.onPatchGroup.mockClear();
    const { rerender } = render(
      <OptionGroupCard
        group={makeGroup({ is_required: true, min_selected: 1 })}
        onPatchGroup={h.onPatchGroup}
        onRemoveGroup={h.onRemoveGroup}
        onPatchOption={h.onPatchOption}
        onRemoveOption={h.onRemoveOption}
        onAddOption={h.onAddOption}
      />
    );
    void rerender;
  });

  it('patches and removes option, and adds option', async () => {
    const user = userEvent.setup();
    const h = setup();
    await user.type(screen.getByPlaceholderText(t('vendor.menu.options.optionPlaceholder')), 'Y');
    expect(h.onPatchOption).toHaveBeenCalledWith(0, { name: 'КетчупY' });
    await user.type(screen.getByPlaceholderText('+₽'), '5');
    expect(h.onPatchOption).toHaveBeenCalledWith(0, { price_delta: expect.any(String) as unknown });
    await user.click(screen.getByRole('button', { name: new RegExp(t('vendor.menu.options.addOption')) }));
    expect(h.onAddOption).toHaveBeenCalled();
    const buttons = screen.getAllByRole('button');
    await user.click(at(buttons, buttons.length - 2));
    expect(h.onRemoveOption).toHaveBeenCalledWith(0);
  });
});
