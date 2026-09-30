import type { HTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/cn";

export interface CardProps extends HTMLAttributes<HTMLDivElement> {
  /** Adds the hover-lift interaction (no layout shift). */
  interactive?: boolean;
  /** Removes the default padding. */
  flush?: boolean;
  /** Renders the card as a glass-morphism surface. */
  glass?: boolean;
}

/** Shared surface: border, radius, shadow and optional hover-lift. */
export function Card({ className, interactive = false, flush = false, glass = false, ...rest }: CardProps) {
  return (
    <div
      className={cn(
        "rounded-card border border-border bg-card text-card-foreground shadow-card",
        glass && "glass shadow-none",
        interactive && "hover-lift",
        !flush && "p-5 sm:p-6",
        className,
      )}
      {...rest}
    />
  );
}

export interface CardHeaderProps extends Omit<HTMLAttributes<HTMLDivElement>, "title"> {
  title: ReactNode;
  description?: ReactNode;
  /** Rendered on the trailing edge (buttons, filters). */
  action?: ReactNode;
}

export function CardHeader({ title, description, action, className, ...rest }: CardHeaderProps) {
  return (
    <div className={cn("flex flex-wrap items-start justify-between gap-3", className)} {...rest}>
      <div className="min-w-0">
        <h3 className="text-base font-semibold leading-tight text-foreground">{title}</h3>
        {description ? (
          <p className="mt-1 text-sm text-muted-foreground">{description}</p>
        ) : null}
      </div>
      {action ? <div className="flex shrink-0 items-center gap-2">{action}</div> : null}
    </div>
  );
}

export function CardContent({ className, ...rest }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("mt-4", className)} {...rest} />;
}

export function CardFooter({ className, ...rest }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("mt-4 flex flex-wrap items-center gap-2 border-t border-border pt-4", className)}
      {...rest}
    />
  );
}

export default Card;
