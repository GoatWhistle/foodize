import { useState, useEffect, useRef, useCallback } from "react";
import type { RefObject } from "react";

const INTERSECTION_THRESHOLD = 0.1;

export interface UseInfiniteListOptions<T> {
  items: readonly T[];
  total: number;
  page: number;
  pageSize: number;
  resetKey: string;
  loading: boolean;
  infiniteScroll: boolean;
  getId: (item: T) => string;
  onLoadMore: () => void;
}

export interface UseInfiniteListResult<T> {
  accumulated: T[];
  hasMore: boolean;
  sentinelRef: RefObject<HTMLDivElement | null>;
}

export const useInfiniteList = <T>({
  items,
  total,
  page,
  pageSize,
  resetKey,
  loading,
  infiniteScroll,
  getId,
  onLoadMore,
}: UseInfiniteListOptions<T>): UseInfiniteListResult<T> => {
  const [accumulated, setAccumulated] = useState<T[]>([]);
  const sentinelRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    setAccumulated([]);
  }, [resetKey]);

  useEffect(() => {
    if (page === 1) {
      setAccumulated([...items]);
      return;
    }
    setAccumulated((prev) => {
      const seen = new Set(prev.map(getId));
      return [...prev, ...items.filter((item) => !seen.has(getId(item)))];
    });
  }, [items, page, getId]);

  const hasMore = page * pageSize < total;

  const loadMore = useCallback(() => {
    if (hasMore && !loading) onLoadMore();
  }, [hasMore, loading, onLoadMore]);

  useEffect(() => {
    if (!infiniteScroll) return;
    const el = sentinelRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) loadMore();
      },
      { threshold: INTERSECTION_THRESHOLD },
    );
    observer.observe(el);
    return () => { observer.disconnect(); };
  }, [infiniteScroll, loadMore]);

  return { accumulated, hasMore, sentinelRef };
};
