// Preview plumbing (read-only): your two records, each with the status the course's rules give it.
import { createRoot } from 'react-dom/client';
import { RecordCards } from './RecordCards.jsx';
import { iosSkip, lifecycleRecord } from './records.js';

createRoot(document.getElementById('root')).render(<RecordCards records={[lifecycleRecord, iosSkip]} />);
