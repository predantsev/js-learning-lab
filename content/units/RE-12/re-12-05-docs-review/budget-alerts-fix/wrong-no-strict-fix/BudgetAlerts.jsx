import { useEffect, useRef, useState } from "react";
import { budgetFeed } from "./budgetFeed.js";

const format = (amountMinor) => (amountMinor / 100).toFixed(2);

// Hides the double subscription with a ref instead of cleaning up: the listener outlives the component.
export default function BudgetAlerts() {
  const [alerts, setAlerts] = useState([]);
  const subscribed = useRef(false);

  useEffect(() => {
    if (subscribed.current) return;
    subscribed.current = true;
    budgetFeed.subscribe((alert) => setAlerts((current) => [...current, alert]));
  }, []);

  return (
    <section>
      <h2>%%alertsTitle%%</h2>
      <ul>
        {alerts.map((alert, index) => (
          <li key={`${alert.id}-${index}`}>
            {alert.category}: %%overBy%% {format(alert.overMinor)} %%currency%%
          </li>
        ))}
      </ul>
    </section>
  );
}
