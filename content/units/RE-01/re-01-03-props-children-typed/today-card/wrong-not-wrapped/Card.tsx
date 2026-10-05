import type { ReactNode } from "react";

type CardProps = {
  title: string;
  children: ReactNode;
};

// A wrapper: a heading with the title, then whatever is nested inside <Card>…</Card>.
export function Card({ title, children }: CardProps) {
  return (
    <section>
      <h2>{title}</h2>
      {children}
    </section>
  );
}
