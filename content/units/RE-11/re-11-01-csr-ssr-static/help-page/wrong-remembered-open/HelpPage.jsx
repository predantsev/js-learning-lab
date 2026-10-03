// Every answer is in the markup, but the question opened last time comes from localStorage.
export default function HelpPage({ title, updatedOn, questions }) {
  const openId = localStorage.getItem("help.openId");
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
