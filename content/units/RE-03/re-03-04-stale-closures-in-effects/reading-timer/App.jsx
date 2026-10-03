import { useEffect, useState } from "react";

// Every 300 ms of real time counts as one minute of reading.
export default function ReadingTimer() {
  const [minutes, setMinutes] = useState(0);
  console.log(`render: minutes = ${minutes}`);

  useEffect(() => {
    console.log("start interval");
    const timer = setInterval(() => {
      console.log(`tick sees minutes = ${minutes}`);
      setMinutes(minutes + 1);
    }, 300);
    return () => {
      console.log("stop interval");
      clearInterval(timer);
    };
  }, []);

  return (
    <section>
      <h2>%%habit%%</h2>
      <p>
        %%read%% {minutes} %%min%%
      </p>
    </section>
  );
}
