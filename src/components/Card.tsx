import type { ReactNode } from "react";

export interface CardProps {
  icon: string;
  title: string;
  description: string;
  eyebrow?: ReactNode;
  children?: ReactNode;
  className?: string;
  interactive?: boolean;
  onClick?: () => void;
}

export function Card({
  icon,
  title,
  description,
  eyebrow,
  children,
  className = "",
  interactive = false,
  onClick,
}: CardProps) {
  return (
    // Interactive cards retain article semantics so they can contain their action button.
    // eslint-disable-next-line jsx-a11y-x/no-noninteractive-element-interactions
    <article
      className={`card ${interactive ? "card--interactive" : ""} ${className}`.trim()}
      onClick={onClick}
      onKeyDown={(event) => {
        if (
          event.target !== event.currentTarget ||
          !interactive ||
          !onClick ||
          (event.key !== "Enter" && event.key !== " ")
        ) {
          return;
        }

        event.preventDefault();
        onClick();
      }}
      role={interactive && onClick ? "button" : undefined}
      tabIndex={interactive && onClick ? 0 : undefined}
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
