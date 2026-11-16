import type { ReactNode, RefObject } from "react";

export function Disclosure({
  title,
  children,
  className,
  open,
  detailsRef,
}: {
  title: ReactNode;
  children: ReactNode;
  className?: string;
  open?: boolean;
  detailsRef?: RefObject<HTMLDetailsElement | null>;
}) {
  return (
    <details
      className={`disclosure${className ? ` ${className}` : ""}`}
      open={open}
      ref={detailsRef}
    >
      <summary>{title}</summary>
      <div className="disclosure-content">{children}</div>
    </details>
  );
}
