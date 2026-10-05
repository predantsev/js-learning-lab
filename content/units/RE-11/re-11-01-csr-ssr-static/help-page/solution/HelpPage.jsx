// Renders only from props: the same props give the same markup on any machine, at any time,
// so a build step could render this page once and serve the HTML to everyone.
export default function HelpPage({ title, updatedOn, questions }) {
  return (
    <article>
      <h1>{title}</h1>
      <p>{`%%updated%%: ${updatedOn}`}</p>
      {questions.map((item) => (
        <details key={item.id}>
          <summary>{item.question}</summary>
          <p>{item.answer}</p>
        </details>
      ))}
    </article>
  );
}
