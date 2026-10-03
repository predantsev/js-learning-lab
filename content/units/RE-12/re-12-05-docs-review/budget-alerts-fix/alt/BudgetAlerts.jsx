import { useEffect, useState } from "react";
import { budgetFeed } from "./budgetFeed.js";

const format = (amountMinor) => (amountMinor / 100).toFixed(2);

export default function BudgetAlerts() {
  const [alerts, setAlerts] = useState([]);

  useEffect(() => {
    function addAlert(alert) {
      setAlerts((current) => [...current, alert]);
    }
    const stop = budgetFeed.subscribe(addAlert);
    return () => {
      stop();
    };
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
