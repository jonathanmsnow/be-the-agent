import type { ComponentPropsWithoutRef, ReactNode } from "react";

export interface CardProps
  extends Omit<ComponentPropsWithoutRef<"article">, "children"> {
  icon: string;
  title: string;
  description: string;
  eyebrow?: ReactNode;
  children?: ReactNode;
  className?: string;
}

export function Card({
  icon,
  title,
  description,
  eyebrow,
  children,
  className = "",
  ...articleProps
}: CardProps) {
  return (
    <article
      className={`card ${className}`.trim()}
      {...articleProps}
    >
      <div className="card-icon" aria-hidden="true">
        {icon}
      </div>
      <div className="card-content">
        {eyebrow}
        <h3>{title}</h3>
        <p>{description}</p>
        {children}
      </div>
    </article>
  );
}
