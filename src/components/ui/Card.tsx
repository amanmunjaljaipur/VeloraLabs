import { cn } from "@/lib/utils";
import { HTMLAttributes } from "react";

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  hover?: boolean;
}

export function Card({ className, hover, children, ...props }: CardProps) {
  return (
    <div
      className={cn(
        "card-verlin rounded-2xl p-5 text-card-foreground md:p-8",
        hover && "card-verlin-hover hover:border-accent-teal/20",
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}