import { useState, useEffect } from "react";
import type { Dispatch, SetStateAction, RefObject } from "react";
import { useShallow } from "zustand/react/shallow";
import { useRestaurantStore } from "@shared/store/useRestaurantStore";
import type { RestaurantStoreState } from "@shared/store/useRestaurantStore";
import { useInfiniteList } from "@shared/hooks/useInfiniteList";
import { logError } from "@shared/utils/logError";
import type { Restaurant } from "@shared/types/models";

const SEARCH_DEBOUNCE_MS = 380;

const getRestaurantId = (restaurant: Restaurant): string => restaurant.id;

export interface UseHomePageLogicOptions {
  pageSize?: number;
  infiniteScroll?: boolean;
}

export interface UseHomePageLogicResult {
  search: string;
  setSearch: Dispatch<SetStateAction<string>>;
  debouncedSearch: string;
  searching: boolean;
  onlyOpen: boolean;
  setOnlyOpen: Dispatch<SetStateAction<boolean>>;
  sort: string;
  setSort: Dispatch<SetStateAction<string>>;
  direction: string;
  setDirection: Dispatch<SetStateAction<string>>;
  page: number;
  setPage: Dispatch<SetStateAction<number>>;
  allRestaurants: Restaurant[];
  hasMore: boolean;
  loading: boolean;
  publicRestaurantsTotal: number;
  sentinelRef: RefObject<HTMLDivElement | null>;
  resetFilters: () => void;
}

export const useHomePageLogic = ({
  pageSize = 20,
  infiniteScroll = false,
}: UseHomePageLogicOptions = {}): UseHomePageLogicResult => {
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [searching, setSearching] = useState(false);
  const [onlyOpen, setOnlyOpen] = useState(false);
  const [sort, setSort] = useState("default");
  const [direction, setDirection] = useState("desc");
  const [page, setPage] = useState(1);

  const { publicRestaurants, loading, publicRestaurantsTotal, fetchPublicRestaurants } =
    useRestaurantStore(
      useShallow((s: RestaurantStoreState) => ({
        publicRestaurants: s.publicRestaurants,
        loading: s.publicLoading,
        publicRestaurantsTotal: s.publicRestaurantsTotal,
        fetchPublicRestaurants: s.fetchPublicRestaurants,
      })),
    );

  useEffect(() => {
    setSearching(true);
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
      setSearching(false);
    }, SEARCH_DEBOUNCE_MS);
    return () => {
      clearTimeout(timer);
      setSearching(false);
    };
  }, [search]);

  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, onlyOpen, sort, direction]);

  useEffect(() => {
    void (async () => {
      try {
        await fetchPublicRestaurants({
          name: debouncedSearch || undefined,
          is_open: onlyOpen ? true : undefined,
          sort,
          direction,
          page,
          size: pageSize,
        });
      } catch (error) {
        logError("useHomePageLogic.fetchPublicRestaurants", error);
      }
    })();
  }, [debouncedSearch, onlyOpen, sort, direction, page, pageSize, fetchPublicRestaurants]);

  const {
    accumulated: allRestaurants,
    hasMore,
    sentinelRef,
  } = useInfiniteList<Restaurant>({
    items: publicRestaurants,
    total: publicRestaurantsTotal || 0,
    page,
    pageSize,
    resetKey: `${debouncedSearch}:${onlyOpen}:${sort}:${direction}`,
    loading,
    infiniteScroll,
    getId: getRestaurantId,
    onLoadMore: () => { setPage((p) => p + 1); },
  });

  const resetFilters = () => {
    setSearch("");
    setOnlyOpen(false);
  };

  return {
    search,
    setSearch,
    debouncedSearch,
    searching,
    onlyOpen,
    setOnlyOpen,
    sort,
    setSort,
    direction,
    setDirection,
    page,
    setPage,
    allRestaurants,
    hasMore,
    loading,
    publicRestaurantsTotal,
    sentinelRef,
    resetFilters,
  };
};
