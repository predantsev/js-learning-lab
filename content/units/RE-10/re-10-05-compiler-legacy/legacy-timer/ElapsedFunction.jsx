import { useEffect, useState } from "react";

// Today's style: a function component with an effect.
export function ElapsedFunction() {
  const [seconds, setSeconds] = useState(0);

  useEffect(() => {
    setInterval(() => {
      console.log("function tick");
      setSeconds((s) => s + 1);
    }, 1000);
  }, []);

  return <p>%%functionLabel%%: {seconds} %%sec%%</p>;
}
