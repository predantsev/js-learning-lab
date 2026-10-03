"use client"; // marks the client boundary in a framework with Server Components; here it changes nothing

import { useState } from "react";
import { saveAcquired } from "./api";

// Receives only plain data and owns its state and its handler.
export default function AcquiredToggle({ id, initialAcquired }) {
  const [acquired, setAcquired] = useState(initialAcquired);

  function handleClick() {
    saveAcquired(id, !acquired);
    setAcquired(!acquired);
  }

  return <button onClick={handleClick}>{acquired ? "%%acquired%%" : "%%wanted%%"}</button>;
}
