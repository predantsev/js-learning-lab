// Preview plumbing: the records from records.js, each with the status the course's rules give it.
import { createRoot } from 'react-dom/client';
import { RecordCards } from './RecordCards.jsx';
import { records } from './records.js';

createRoot(document.getElementById('root')).render(<RecordCards records={records} />);
