type RecordCardProps = {
  name: string;
  price: number | null;
  category?: string; // optional: a call may leave it out
};

export function RecordCard({ name, price, category = "%%noCategory%%" }: RecordCardProps) {
  return (
    <article>
      <h3>{name}</h3>
      <p>{price === null ? "%%noPrice%%" : `${price} %%currency%%`}</p>
      <p>{category}</p>
    </article>
  );
}
