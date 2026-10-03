import type { ReactNode } from "react";

type CardProps = {
  heading: string;
  children: ReactNode;
};

// The prop is read as `heading`, but the call site passes `title`.
export function Card({ heading, children }: CardProps) {
  return (
    <section>
      <h2>{heading}</h2>
      {children}
    </section>
  );
}
