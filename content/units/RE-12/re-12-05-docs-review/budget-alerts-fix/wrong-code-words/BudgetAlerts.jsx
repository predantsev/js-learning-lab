import { useEffect, useState } from "react";
import { budgetFeed } from "./budgetFeed.js";

const format = (amountMinor) => (amountMinor / 100).toFixed(2);

export default function BudgetAlerts() {
  const [alerts, setAlerts] = useState([]);

  useEffect(() => {
    const unsubscribe = budgetFeed.subscribe((alert) => setAlerts((current) => [...current, alert]));
    return unsubscribe;
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
