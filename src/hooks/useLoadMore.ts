"use client";

import { useCallback, useEffect, useState } from "react";

export function useLoadMore<T>(items: T[], pageSize: number) {
  const [visibleCount, setVisibleCount] = useState(pageSize);

  useEffect(() => {
    setVisibleCount(pageSize);
  }, [items, pageSize]);

  const shown = items.slice(0, visibleCount);
  const hasMore = visibleCount < items.length;
  const remaining = items.length - visibleCount;

  const loadMore = useCallback(() => {
    setVisibleCount((count) => Math.min(count + pageSize, items.length));
  }, [items.length, pageSize]);

  return { shown, hasMore, loadMore, remaining, total: items.length };
}