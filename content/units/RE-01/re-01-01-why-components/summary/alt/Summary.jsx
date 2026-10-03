import { expenses } from "./expenses.js";

export const Summary = () => {
  const count = expenses.length;
  return (
    <>
      <h2>%%heading%%</h2>
      <p>{`%%countLabel%% ${count}`}</p>
    </>
  );
};
