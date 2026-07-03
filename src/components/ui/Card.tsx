import { cn } from "@/lib/utils";
import { HTMLAttributes } from "react";

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  hover?: boolean;
}

export function Card({ className, hover, children, ...props }: CardProps) {
  return (
    <div
      className={cn(
        "card-verlin rounded-2xl p-6 md:p-8 text-card-foreground",
        hover && "card-verlin-hover",
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}