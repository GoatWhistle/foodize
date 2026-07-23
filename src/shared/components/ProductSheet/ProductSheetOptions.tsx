import { formatPrice } from "@shared/utils/price";
import { t as translate } from "@shared/i18n/useTranslation";
import type { MenuItem } from "@shared/types/models";
import c from "./ProductSheetControls.module.css";

export interface Option {
  id: string;
  name: string;
  price_delta: number;
  is_available?: boolean;
}

export interface OptionGroup {
  id: string;
  name: string;
  selection_type: string;
  is_required: boolean;
  min_selected: number;
  max_selected?: number | null;
  is_active?: boolean;
  options: Option[];
}

export interface SheetItem extends MenuItem {
  category_name?: string | null;
}

export const getActiveOptionGroups = (item: SheetItem | null): OptionGroup[] =>
  ((item?.option_groups as OptionGroup[] | undefined) || [])
    .filter((group) => group.is_active !== false)
    .map((group) => ({
      ...group,
      options: group.options.filter((o) => o.is_available !== false),
    }))
    .filter((group) => group.options.length > 0);

export const getSelectedOptions = (groups: OptionGroup[], ids: string[]): Option[] => {
  const idsSet = new Set(ids);
  return groups.flatMap((g) => g.options).filter((o) => idsSet.has(o.id));
};

export const getMinSelected = (group: OptionGroup): number =>
  group.is_required ? Math.max(1, group.min_selected || 0) : group.min_selected || 0;

export const getGroupHint = (group: OptionGroup): string => {
  const max = group.selection_type === "single" ? 1 : group.max_selected;
  const min = getMinSelected(group);
  if (group.selection_type === "single") {
    return group.is_required
      ? translate("catalog.product.hintSingleRequired")
      : translate("catalog.product.hintSingleOptional");
  }
  if (group.is_required && max) {
    return min === max
      ? translate("catalog.product.hintExact", { count: min })
      : translate("catalog.product.hintRange", { min, max });
  }
  if (group.is_required) return translate("catalog.product.hintMin", { min });
  if (max) return translate("catalog.product.hintMax", { max });
  return translate("catalog.product.hintMultiple");
};

interface ProductSheetOptionGroupsProps {
  groups: OptionGroup[];
  selectedOptionIds: string[];
  onToggle: (group: OptionGroup, option: Option) => void;
}

export const ProductSheetOptionGroups = ({
  groups,
  selectedOptionIds,
  onToggle,
}: ProductSheetOptionGroupsProps) => {
  if (groups.length === 0) return null;
  return (
    <div className={c['options']}>
      {groups.map((group) => {
        const groupOptionIds = group.options.map((o) => o.id);
        const selectedCount = selectedOptionIds.filter((id) => groupOptionIds.includes(id)).length;
        return (
          <div key={group.id} className={c['optionGroup']}>
            <div className={c['optionGroupHead']}>
              <strong>{group.name}</strong>
              <span>{getGroupHint(group)}</span>
            </div>
            <div className={c['optionList']}>
              {group.options.map((option) => {
                const checked = selectedOptionIds.includes(option.id);
                const disabled =
                  !checked &&
                  group.selection_type !== "single" &&
                  Boolean(group.max_selected) &&
                  selectedCount >= (group.max_selected ?? 0);
                return (
                  <label
                    key={option.id}
                    className={`${c['option']}${checked ? ` ${c['selected']}` : ""}`}
                  >
                    <span>
                      <input
                        type={group.selection_type === "single" ? "radio" : "checkbox"}
                        name={`option-group-${group.id}`}
                        checked={checked}
                        disabled={disabled}
                        onChange={() => { onToggle(group, option); }}
                      />
                      {option.name}
                    </span>
                    {option.price_delta > 0 && <em>+{formatPrice(option.price_delta)}</em>}
                  </label>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
};
