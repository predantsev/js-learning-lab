// How the planner server reads a query string. Every request to GET /tasks goes through here.
import { parse } from './vendor/tiny-query.js';

export function readQuery(search) {
  return parse(search);
}
