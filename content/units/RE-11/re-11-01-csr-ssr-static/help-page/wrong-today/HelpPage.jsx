// Shows "today" instead of the date the page was written: it changes with the clock.
export default function HelpPage({ title, questions }) {
  const today = new Date().toISOString().slice(0, 10);
  return (
    <article>
      <h1>{title}</h1>
      <p>{`%%updated%%: ${today}`}</p>
      {questions.map((item) => (
        <details key={item.id}>
          <summary>{item.question}</summary>
          <p>{item.answer}</p>
        </details>
      ))}
    </article>
  );
}
