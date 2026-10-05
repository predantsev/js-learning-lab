// The declaration derived from the data flow, so the two cannot drift apart.
import { dataFlow } from './data-flow.js';

const WHERE = { 'mock-service': 'sent', 'crash-library': 'sent', device: 'device', removed: 'none' };

export const declaration = dataFlow.map(({ field, destination, purpose }) => {
  const where = WHERE[destination];
  return { field, collected: where === 'sent', purpose: where === 'sent' ? purpose : null, where };
});
