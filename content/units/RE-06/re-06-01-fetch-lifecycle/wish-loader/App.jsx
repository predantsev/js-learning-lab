import { useEffect, useState } from "react";
import { fetchWishes } from "./fixtureApi.js";

export default function WishList() {
  const [status, setStatus] = useState("loading");
  const [wishes, setWishes] = useState([]);
  console.log(`render: status ${status}, wishes ${wishes.length}`);

  useEffect(() => {
    console.log("effect: the request starts");
    fetchWishes()
      .then((data) => {
        setWishes(data);
        setStatus("success");
      })
      .catch(() => setStatus("error"));
  }, []);

  if (status === "loading") return <p role="status">%%loading%%</p>;
  if (status === "error") return <p role="alert">%%loadError%%</p>;
  return (
    <ul>
      {wishes.map((wish) => (
        <li key={wish.id}>{wish.name}</li>
      ))}
    </ul>
  );
}
