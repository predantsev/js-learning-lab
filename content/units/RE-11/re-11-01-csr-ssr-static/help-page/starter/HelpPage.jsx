export default function HelpPage({ title, questions }) {
  const updated = new Date().toLocaleDateString();
  const openId = localStorage.getItem("help.openId") ?? questions[0].id;

  return (
    <article>
      <h1>{title}</h1>
      <p>{`%%updated%%: ${updated}`}</p>
      {questions.map((item) => (
        <section key={item.id}>
          <h2>{item.question}</h2>
          {item.id === openId && <p>{item.answer}</p>}
        </section>
      ))}
    </article>
  );
}
