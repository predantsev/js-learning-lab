import { useEffect, useRef } from "react";

// After every commit, prints whether `value` is the same object as after the previous commit.
// Object.is is the same comparison React uses for effect dependencies.
export function useIdentityLog(name, value) {
  const previous = useRef(null);
  useEffect(() => {
    if (previous.current !== null) {
      console.log(`${name}: ${Object.is(previous.current.value, value) ? "%%same%%" : "%%fresh%%"}`);
    }
    previous.current = { value };
  });
}
