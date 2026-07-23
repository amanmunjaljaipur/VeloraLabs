"use client";

import { useCallback, useEffect, useState } from "react";

export function useLoadMore<T>(items: T[], pageSize: number) {
  const [visibleCount, setVisibleCount] = useState(pageSize);

  // Reset when the *content* of the list actually changes (length is a cheap,
  // reliable proxy - a genuine filter/search change almost always changes
  // count too). Deliberately NOT keyed on the `items` array reference: many
  // callers derive `items` inline on every render (e.g. destructuring a new
  // array from a memoized parent), which would give a fresh reference on
  // every render - including the very re-render triggered by clicking
  // "Load more" - snapping visibleCount straight back to pageSize before the
  // user ever sees more items.
  useEffect(() => {
    setVisibleCount(pageSize);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [items.length, pageSize]);

  const shown = items.slice(0, visibleCount);
  const hasMore = visibleCount < items.length;
  const remaining = items.length - visibleCount;

  const loadMore = useCallback(() => {
    setVisibleCount((count) => Math.min(count + pageSize, items.length));
  }, [items.length, pageSize]);

  return { shown, hasMore, loadMore, remaining, total: items.length };
}