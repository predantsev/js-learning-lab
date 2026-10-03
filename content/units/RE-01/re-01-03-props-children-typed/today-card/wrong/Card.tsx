import type { ReactNode } from "react";

type CardProps = {
  title: string;
  children: ReactNode;
};

// The heading is there, but what was nested inside <Card> is never shown.
export function Card({ title }: CardProps) {
  return (
    <section>
      <h2>{title}</h2>
    </section>
  );
}
