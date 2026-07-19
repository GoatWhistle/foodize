import { PlusIcon } from '@phosphor-icons/react';
import type {
  MenuItemForm as MenuItemFormValues,
  OptionDraft,
  OptionGroupDraft,
} from '../VendorMenuTab';
import { OptionGroupCard } from './OptionGroupCard';
import styles from './MenuItemOptionGroups.module.css';

const createOptionDraft = (): OptionDraft => ({
  draftId: crypto.randomUUID(),
  name: '',
  price_delta: '',
});

const createOptionGroupDraft = (): OptionGroupDraft => ({
  draftId: crypto.randomUUID(),
  name: '',
  selection_type: 'multiple',
  is_required: false,
  min_selected: 0,
  max_selected: '',
  options: [createOptionDraft()],
});

interface MenuItemOptionGroupsProps {
  menuItemForm: MenuItemFormValues;
  setMenuItemForm: React.Dispatch<React.SetStateAction<MenuItemFormValues>>;
}

export function MenuItemOptionGroups({
  menuItemForm,
  setMenuItemForm,
}: MenuItemOptionGroupsProps) {
  const patchGroup = (groupIndex: number, patch: Partial<OptionGroupDraft>) =>
    { setMenuItemForm((form) => ({
      ...form,
      option_groups: form.option_groups.map((g, i) =>
        i === groupIndex ? { ...g, ...patch } : g
      ),
    })); };

  const removeGroup = (groupIndex: number) =>
    { setMenuItemForm((form) => ({
      ...form,
      option_groups: form.option_groups.filter((_, i) => i !== groupIndex),
    })); };

  const patchOption = (
    groupIndex: number,
    optionIndex: number,
    patch: { name?: string; price_delta?: string }
  ) =>
    { setMenuItemForm((form) => ({
      ...form,
      option_groups: form.option_groups.map((g, i) =>
        i === groupIndex
          ? {
              ...g,
              options: g.options.map((o, j) =>
                j === optionIndex ? { ...o, ...patch } : o
              ),
            }
          : g
      ),
    })); };

  const removeOption = (groupIndex: number, optionIndex: number) =>
    { setMenuItemForm((form) => ({
      ...form,
      option_groups: form.option_groups.map((g, i) =>
        i === groupIndex
          ? { ...g, options: g.options.filter((_, j) => j !== optionIndex) }
          : g
      ),
    })); };

  const addOption = (groupIndex: number) =>
    { setMenuItemForm((form) => ({
      ...form,
      option_groups: form.option_groups.map((g, i) =>
        i === groupIndex
          ? { ...g, options: [...g.options, createOptionDraft()] }
          : g
      ),
    })); };

  return (
    <div className={styles['root']}>
      <div className={styles['header']}>
        <div>
          <div className={styles['headerTitle']}>Опции блюда</div>
          <div className={styles['headerSubtitle']}>
            Например: убрать лук, добавить мясо
          </div>
        </div>
        <button
          type="button"
          className="btn btn-secondary btn-sm"
          onClick={() =>
            { setMenuItemForm((form) => ({
              ...form,
              option_groups: [...form.option_groups, createOptionGroupDraft()],
            })); }
          }
        >
          <PlusIcon size={14} /> Группа
        </button>
      </div>

      {menuItemForm.option_groups.map((group, groupIndex) => (
        <OptionGroupCard
          key={group.draftId}
          group={group}
          onPatchGroup={(patch) => { patchGroup(groupIndex, patch); }}
          onRemoveGroup={() => { removeGroup(groupIndex); }}
          onPatchOption={(optionIndex, patch) => { patchOption(groupIndex, optionIndex, patch); }}
          onRemoveOption={(optionIndex) => { removeOption(groupIndex, optionIndex); }}
          onAddOption={() => { addOption(groupIndex); }}
        />
      ))}
    </div>
  );
}
