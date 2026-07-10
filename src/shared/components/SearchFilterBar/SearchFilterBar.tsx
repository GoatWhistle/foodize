import { useEffect, useRef, useState } from "react";
import type { Dispatch, ReactNode, SetStateAction } from "react";
import {
  MagnifyingGlass,
  Faders,
  SortAscending,
  SortDescending,
  Star,
  ChartBar,
  Check,
} from "@phosphor-icons/react";
import type { Icon, IconWeight } from "@phosphor-icons/react";
import s from "./SearchFilterBar.module.css";

interface SortOption {
  key: string;
  label: string;
  Icon: Icon | null;
  iconWeight?: IconWeight;
}

const SORT_OPTIONS: SortOption[] = [
  { key: "default", label: "По умолчанию", Icon: null },
  { key: "rating", label: "Оценка", Icon: Star, iconWeight: "fill" },
  { key: "popularity_7d", label: "Популярность", Icon: ChartBar, iconWeight: "bold" },
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

const SearchFilterBar = ({
  search,
  setSearch,
  onlyOpen,
  setOnlyOpen,
  sort,
  setSort,
  direction,
  setDirection,
  searching = false,
  placeholder = "Поиск заведения или адреса...",
  extraChips = null,
}: SearchFilterBarProps) => {
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
    return () => document.removeEventListener("mousedown", handler);
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
    <div className={s.wrap}>
      <div className={s.search}>
        <MagnifyingGlass className={s.searchIcon} size={18} weight="bold" />
        <input
          type="search"
          placeholder={placeholder}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          aria-label="Поиск заведения"
        />
        {searching && <span className={s.spinner} aria-hidden="true" />}
      </div>

      <div className={s.filterAnchor} ref={filterRef}>
        <button
          type="button"
          className={`${s.filterButton}${showFilters ? ` ${s.filterButtonOpen}` : ""}${filtersActive ? ` ${s.filterButtonActive}` : ""}`}
          onClick={() => setShowFilters((value) => !value)}
          aria-expanded={showFilters}
          aria-label="Открыть фильтры"
        >
          <Faders size={18} weight="bold" />
        </button>

        {showFilters && (
          <div className={s.dropdown}>
            <label className={s.checkbox}>
              <input
                type="checkbox"
                checked={onlyOpen}
                onChange={() => setOnlyOpen((value) => !value)}
              />
              Открыто
            </label>
            <div className={s.sortPanel}>
              <div className={s.sortLabel}>Сортировка</div>
              {SORT_OPTIONS.map(({ key, label, Icon, iconWeight }) => (
                <button
                  key={key}
                  type="button"
                  className={`${s.sortRow}${sort === key ? ` ${s.sortRowActive}` : ""}`}
                  onClick={() => handleSortClick(key)}
                >
                  <span className={s.sortRowLeft}>
                    {Icon ? (
                      <Icon size={15} weight={iconWeight} />
                    ) : (
                      <span className={s.sortRowIconSpacer} />
                    )}
                    {label}
                  </span>
                  {sort === key &&
                    (key === "default" ? (
                      <Check size={15} weight="bold" />
                    ) : direction === "desc" ? (
                      <SortDescending size={15} weight="bold" />
                    ) : (
                      <SortAscending size={15} weight="bold" />
                    ))}
                </button>
              ))}
            </div>
            {extraChips && (
              <div className={s.extraPanel}>
                {typeof extraChips === "function"
                  ? extraChips(s.sortRow)
                  : extraChips}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default SearchFilterBar;
