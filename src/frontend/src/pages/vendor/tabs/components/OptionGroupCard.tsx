import { PlusIcon, XIcon } from '@phosphor-icons/react';
import type { OptionGroupDraft } from '../VendorMenuTab';
import styles from './MenuItemOptionGroups.module.css';

interface OptionGroupCardProps {
  group: OptionGroupDraft;
  onPatchGroup: (patch: Partial<OptionGroupDraft>) => void;
  onRemoveGroup: () => void;
  onPatchOption: (optionIndex: number, patch: { name?: string; price_delta?: string }) => void;
  onRemoveOption: (optionIndex: number) => void;
  onAddOption: () => void;
}

export function OptionGroupCard({
  group,
  onPatchGroup,
  onRemoveGroup,
  onPatchOption,
  onRemoveOption,
  onAddOption,
}: OptionGroupCardProps) {
  return (
    <div className={styles.group}>
      <div className={styles.row}>
        <input
          className={`form-input ${styles.grow}`}
          placeholder="Название группы"
          value={group.name}
          onChange={(e) => { onPatchGroup({ name: e.target.value }); }}
        />
        <button
          type="button"
          className={`btn btn-secondary btn-sm ${styles.dangerBtn}`}
          onClick={onRemoveGroup}
        >
          <XIcon size={14} />
        </button>
      </div>

      <div className={styles.grid2}>
        <select
          className="form-input"
          value={group.selection_type}
          onChange={(e) =>
            { onPatchGroup(
              e.target.value === 'single'
                ? { selection_type: 'single', max_selected: 1 }
                : { selection_type: 'multiple' }
            ); }
          }
        >
          <option value="multiple">Несколько</option>
          <option value="single">Один вариант</option>
        </select>
        <input
          className="form-input"
          type="number"
          min="1"
          placeholder="Макс. выборов"
          value={group.max_selected}
          disabled={group.selection_type === 'single'}
          onChange={(e) => { onPatchGroup({ max_selected: e.target.value }); }}
        />
      </div>

      <label className={styles.checkboxRow}>
        <input
          type="checkbox"
          checked={group.is_required}
          onChange={(e) =>
            { onPatchGroup({
              is_required: e.target.checked,
              min_selected: e.target.checked ? 1 : 0,
            }); }
          }
        />
        Обязательный выбор
      </label>

      {group.options.map((option, optionIndex) => (
        <div key={option.draftId} className={styles.row}>
          <input
            className={`form-input ${styles.grow}`}
            placeholder="Опция"
            value={option.name}
            onChange={(e) => { onPatchOption(optionIndex, { name: e.target.value }); }}
          />
          <input
            className={`form-input ${styles.priceInput}`}
            type="number"
            min="0"
            placeholder="+₽"
            value={option.price_delta}
            onChange={(e) => { onPatchOption(optionIndex, { price_delta: e.target.value }); }}
          />
          <button
            type="button"
            className={`btn btn-secondary btn-sm ${styles.dangerBtn}`}
            onClick={() => { onRemoveOption(optionIndex); }}
          >
            <XIcon size={14} />
          </button>
        </div>
      ))}

      <button type="button" className="btn btn-secondary btn-sm" onClick={onAddOption}>
        <PlusIcon size={14} /> Опция
      </button>
    </div>
  );
}
