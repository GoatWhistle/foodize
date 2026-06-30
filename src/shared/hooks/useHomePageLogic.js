import { useState, useEffect, useCallback, useRef } from "react";
import { useShallow } from "zustand/react/shallow";
import { useRestaurantStore } from "@shared/store/useRestaurantStore.js";

export const useHomePageLogic = ({ pageSize = 20, infiniteScroll = false } = {}) => {
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [searching, setSearching] = useState(false);
  const [onlyOpen, setOnlyOpen] = useState(false);
  const [sort, setSort] = useState("default");
  const [direction, setDirection] = useState("desc");
  const [page, setPage] = useState(1);
  const [allRestaurants, setAllRestaurants] = useState([]);
  const [hasMore, setHasMore] = useState(true);
  const sentinelRef = useRef(null);
  const fetchIdRef = useRef(0);
  const canLoadMoreRef = useRef({ hasMore: true, loading: false });

  const { publicRestaurants, loading, publicRestaurantsTotal, fetchPublicRestaurants } =
    useRestaurantStore(
      useShallow((s) => ({
        publicRestaurants: s.publicRestaurants,
        loading: s.loading,
        publicRestaurantsTotal: s.publicRestaurantsTotal,
        fetchPublicRestaurants: s.fetchPublicRestaurants,
      })),
    );

  canLoadMoreRef.current = { hasMore, loading };

  useEffect(() => {
    setSearching(true);
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
      setSearching(false);
    }, 380);
    return () => {
      clearTimeout(timer);
      setSearching(false);
    };
  }, [search]);

  const resetAndLoad = useCallback(() => {
    setAllRestaurants([]);
    setPage(1);
    setHasMore(true);
  }, []);

  useEffect(() => {
    resetAndLoad();
  }, [debouncedSearch, onlyOpen, sort, direction, resetAndLoad]);

  useEffect(() => {
    const id = ++fetchIdRef.current;
    fetchPublicRestaurants({
      name: debouncedSearch || undefined,
      is_open: onlyOpen ? true : undefined,
      sort,
      direction,
      page,
      size: pageSize,
    }).catch(() => {}).finally(() => {
      if (fetchIdRef.current !== id) return;
    });
  }, [debouncedSearch, onlyOpen, sort, direction, page, pageSize, fetchPublicRestaurants]);

  useEffect(() => {
    if (page === 1) {
      setAllRestaurants(publicRestaurants);
    } else {
      setAllRestaurants((prev) => {
        const ids = new Set(prev.map((r) => r.id));
        return [...prev, ...publicRestaurants.filter((r) => !ids.has(r.id))];
      });
    }
    const total = publicRestaurantsTotal || 0;
    setHasMore(page * pageSize < total);
  }, [publicRestaurants, publicRestaurantsTotal, page, pageSize]);

  useEffect(() => {
    if (!infiniteScroll) return;
    const el = sentinelRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        const { hasMore: hm, loading: ld } = canLoadMoreRef.current;
        if (entry.isIntersecting && hm && !ld) {
          setPage((p) => p + 1);
        }
      },
      { threshold: 0.1 },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [infiniteScroll]);

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
