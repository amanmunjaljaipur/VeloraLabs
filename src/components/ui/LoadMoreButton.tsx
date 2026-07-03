"use client";

import { Button } from "@/components/ui/Button";

interface LoadMoreButtonProps {
  onClick: () => void;
  remaining: number;
  total: number;
  label?: string;
}

export function LoadMoreButton({
  onClick,
  remaining,
  total,
  label = "Load more",
}: LoadMoreButtonProps) {
  if (remaining <= 0) return null;

  return (
    <div className="mt-10 flex flex-col items-center gap-2">
      <Button variant="secondary" size="lg" onClick={onClick}>
        {label} ({remaining} more)
      </Button>
      <p className="text-xs text-text-secondary">
        Showing {total - remaining} of {total}
      </p>
    </div>
  );
}