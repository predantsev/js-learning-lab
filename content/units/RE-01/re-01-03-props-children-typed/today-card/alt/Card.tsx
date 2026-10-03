import type { ReactNode } from "react";

interface CardProps {
  title: string;
  children?: ReactNode;
}

export function Card(props: CardProps) {
  return (
    <div className="card">
      <h2>{props.title}</h2>
      <div className="card-body">{props.children}</div>
    </div>
  );
}
