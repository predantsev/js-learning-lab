// The pull request "Show price drops for watched wishes" adds this component.
import { useEffect, useState } from "react";
import { priceFeed } from "./priceFeed.js";
import { PRICE_API_KEY, PRICE_API_URL } from "./config.js";

export const sourceUrl = `${PRICE_API_URL}/drops?key=${PRICE_API_KEY}`;

export default function PriceWatch({ onClose }) {
  const [drops, setDrops] = useState([]);

  useEffect(() => {
    priceFeed.subscribe((drop) => setDrops((current) => [...current, drop]));
  }, []);

  return (
    <section>
      <h2>%%priceDrops%%</h2>
      <button type="button" onClick={onClose}>
        <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true">
          <path d="M3 3l10 10M13 3L3 13" stroke="currentColor" strokeWidth="2" />
        </svg>
      </button>
      <ul>
        {drops.map((drop, index) => (
          <li key={index}>
            {drop.name}: {drop.price} %%currency%%
          </li>
        ))}
      </ul>
    </section>
  );
}
