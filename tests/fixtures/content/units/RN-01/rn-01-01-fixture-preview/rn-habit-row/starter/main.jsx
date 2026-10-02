// Shows one habit row in the browser preview (react-native-web).
import { createRoot } from 'react-dom/client';
import { HabitRow } from './HabitRow.jsx';

createRoot(document.getElementById('root')).render(<HabitRow name="%%habit%%" />);
