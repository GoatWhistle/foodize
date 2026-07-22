import { useEffect, useRef, useState } from "react";
import type { Dispatch, ReactNode, SetStateAction } from "react";
import {
  MagnifyingGlassIcon,
  FadersIcon,
  SortAscendingIcon,
  SortDescendingIcon,
  StarIcon,
  ChartBarIcon,
  CheckIcon,
} from "@phosphor-icons/react";
import type { Icon, IconWeight } from "@phosphor-icons/react";
import { useTranslation } from "@shared/i18n/useTranslation";
import s from "./SearchFilterBar.module.css";

interface SortOption {
  key: string;
  labelKey: string;
  Icon: Icon | null;
  iconWeight?: IconWeight;
}

const SORT_OPTIONS: SortOption[] = [
  { key: "default", labelKey: "catalog.search.sortDefault", Icon: null },
  { key: "rating", labelKey: "catalog.search.sortRating", Icon: StarIcon, iconWeight: "fill" },
  { key: "popularity_7d", labelKey: "catalog.search.sortPopularity", Icon: ChartBarIcon, iconWeight: "bold" },
];

interface SearchFilterBarProps {
  search: string;
  setSearch: (value: string) => void;
  onlyOpen: boolean;
  setOnlyOpen: Dispatch<SetStateAction<boolean>>;
  sort: string;
  setSort: Dispatch<SetStateAction<string>>;
  direction: string;
  setDirection: Dispatch<SetStateAction<string>>;
  searching?: boolean;
  placeholder?: string;
  extraChips?: ((chipClass: string) => ReactNode) | ReactNode | null;
}

export const SearchFilterBar = ({
  search,
  setSearch,
  onlyOpen,
  setOnlyOpen,
  sort,
  setSort,
  direction,
  setDirection,
  searching = false,
  placeholder,
  extraChips = null,
}: SearchFilterBarProps) => {
  const { t } = useTranslation();
  const [showFilters, setShowFilters] = useState(false);
  const filterRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!showFilters) return;
    const handler = (event: MouseEvent) => {
      if (filterRef.current && !filterRef.current.contains(event.target as Node)) {
        setShowFilters(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => { document.removeEventListener("mousedown", handler); };
  }, [showFilters]);

  const handleSortClick = (key: string) => {
    if (sort === key) {
      if (key !== "default") {
        setDirection((value) => (value === "desc" ? "asc" : "desc"));
      }
      return;
    }
    setSort(key);
  };

  const filtersActive = onlyOpen || sort !== "default";

  return (
    <div className={s['wrap']}>
      <div className={s['search']}>
        <MagnifyingGlassIcon className={s['searchIcon']} size={18} weight="bold" />
        <input
          type="search"
          placeholder={placeholder ?? t("catalog.search.placeholderVenue")}
          value={search}
          onChange={(e) => { setSearch(e.target.value); }}
          aria-label={t("catalog.search.ariaLabel")}
        />
        {searching && <span className={s['spinner']} aria-hidden="true" />}
      </div>

      <div className={s['filterAnchor']} ref={filterRef}>
        <button
          type="button"
          className={`${s['filterButton']}${showFilters ? ` ${s['filterButtonOpen']}` : ""}${filtersActive ? ` ${s['filterButtonActive']}` : ""}`}
          onClick={() => { setShowFilters((value) => !value); }}
          aria-expanded={showFilters}
          aria-label={t("catalog.search.openFilters")}
        >
          <FadersIcon size={18} weight="bold" />
        </button>

        {showFilters && (
          <div className={s['dropdown']}>
            <label className={s['checkbox']}>
              <input
                type="checkbox"
                checked={onlyOpen}
                onChange={() => { setOnlyOpen((value) => !value); }}
              />
              {t("catalog.search.onlyOpen")}
            </label>
            <div className={s['sortPanel']}>
              <div className={s['sortLabel']}>{t("catalog.search.sortLabel")}</div>
              {SORT_OPTIONS.map(({ key, labelKey, Icon, iconWeight }) => (
                <button
                  key={key}
                  type="button"
                  className={`${s['sortRow']}${sort === key ? ` ${s['sortRowActive']}` : ""}`}
                  onClick={() => { handleSortClick(key); }}
                >
                  <span className={s['sortRowLeft']}>
                    {Icon ? (
                      <Icon size={15} {...(iconWeight ? { weight: iconWeight } : {})} />
                    ) : (
                      <span className={s['sortRowIconSpacer']} />
                    )}
                    {t(labelKey)}
                  </span>
                  {sort === key &&
                    (key === "default" ? (
                      <CheckIcon size={15} weight="bold" />
                    ) : direction === "desc" ? (
                      <SortDescendingIcon size={15} weight="bold" />
                    ) : (
                      <SortAscendingIcon size={15} weight="bold" />
                    ))}
                </button>
              ))}
            </div>
            {extraChips && (
              <div className={s['extraPanel']}>
                {typeof extraChips === "function"
                  ? extraChips(s['sortRow'] ?? "")
                  : extraChips}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
