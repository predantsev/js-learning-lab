import { useEffect, useState } from "react";

// The rendered markup depends on props only. The question opened last time is a personal
// detail, so it is read from localStorage after the page is shown, in an effect.
export default function HelpPage({ title, updatedOn, questions }) {
  const [openId, setOpenId] = useState(null);

  useEffect(() => {
    setOpenId(localStorage.getItem("help.openId"));
  }, []);

  return (
    <article>
      <h1>{title}</h1>
      <p>{`%%updated%%: ${updatedOn}`}</p>
      {questions.map((item) => (
        <details key={item.id} open={item.id === openId}>
          <summary>{item.question}</summary>
          <p>{item.answer}</p>
        </details>
      ))}
    </article>
  );
}
