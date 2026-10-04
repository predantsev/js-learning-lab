// A latency check on a realistic synthetic dataset, for the service's test suite.
import { makeExpenses } from './expenses.js';

export async function checkLatency(createService, { records = 20_000, requests = 20, budgetMs = 20 } = {}) {
  // TODO: start the service on `records` synthetic expenses, measure p95 of `requests` requests,
  // throw when it is above budgetMs, otherwise return it
}
