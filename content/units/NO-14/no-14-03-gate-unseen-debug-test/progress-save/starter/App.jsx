import { ReadingProgress } from './ReadingProgress.jsx';
import { saveProgress } from './progressServer.js';

export default function App() {
  return (
    <main>
      <h1>%%title%%</h1>
      <ReadingProgress memberId="m-03" bookId="b-02" initialPages={40} onSave={saveProgress} />
    </main>
  );
}
