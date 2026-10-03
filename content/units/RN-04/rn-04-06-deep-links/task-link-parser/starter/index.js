// Read-only: tries parseRecordLink on a few synthetic links and prints the results.
import { parseRecordLink } from './links.js';

const samples = [
  'courselab://task/t-02',
  'courselab://task/t%2D05',
  'courselab://task/t-02?utm=share',
  'courselab://task/../wish/w-01',
  'courselab://task/%E0%A4%A',
  'courselab://task/',
  'https://example.com/task/t-02',
];

for (const url of samples) {
  let result;
  try {
    result = JSON.stringify(parseRecordLink(url));
  } catch (error) {
    result = `${error.name}: ${error.message}`;
  }
  console.log(`${url} → ${result}`);
}
