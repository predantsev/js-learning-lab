// The only module that knows which data source exists. Everything else sees listRecords().
import { expenseFixtures } from './fixtures.js';
import { createFixtureSource } from './fixture-source.js';
import { createHttpSource } from './http-source.js';

export function createDataSource(config) {
  if (config.dataSource === 'http') return createHttpSource({ baseUrl: config.apiBaseUrl });
  return createFixtureSource(expenseFixtures());
}
