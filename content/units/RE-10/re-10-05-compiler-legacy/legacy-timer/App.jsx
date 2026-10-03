import { useState } from "react";
import { ElapsedClass } from "./ElapsedClass";
import { ElapsedFunction } from "./ElapsedFunction";
import { Badge } from "./Badge";

export default function App() {
  const [shown, setShown] = useState(true);
  return (
    <div>
      <Badge />
      <button onClick={() => setShown(!shown)}>{shown ? "%%hide%%" : "%%show%%"}</button>
      {shown && (
        <>
          <ElapsedClass />
          <ElapsedFunction />
        </>
      )}
    </div>
  );
}
