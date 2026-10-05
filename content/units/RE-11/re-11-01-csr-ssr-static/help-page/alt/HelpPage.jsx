// Every answer is always visible: no open/closed state at all.
export default function HelpPage({ title, updatedOn, questions }) {
  return (
    <article>
      <h1>{title}</h1>
      <p>
        %%updated%%: <time dateTime={updatedOn}>{updatedOn}</time>
      </p>
      {questions.map((item) => (
        <section key={item.id}>
          <h2>{item.question}</h2>
          <p>{item.answer}</p>
        </section>
      ))}
    </article>
  );
}
