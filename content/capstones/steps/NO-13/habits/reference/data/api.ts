// The data source of the screens: the one module that decides where the habits come from. The screens
// (ui/habitsCache.tsx) import only from here, so switching the source changes no component and no domain
// function. With DATA_SOURCE=http (in .env, built into the bundle as CLIENT_ENV) it is the records server
// (data/httpApi.ts); without it, the fixture API (data/fixtureApi.ts). The tests call resetApi(), which
// switches to the fixture API with their own habits.
import type { Habit } from "../domain/habits.ts";
import { loadClientConfig } from "./config.js";
import * as fixtureApi from "./fixtureApi.ts";
import type { ListFilter } from "./fixtureApi.ts";
import { createHttpApi } from "./httpApi.ts";
import type { HabitFields } from "../ui/habitsReducer.ts";

export { ApiError } from "./apiError.ts";
export { settings, requests } from "./fixtureApi.ts";
export type { ListFilter } from "./fixtureApi.ts";

type DataSource = {
  listHabits(filter: ListFilter, signal?: AbortSignal): Promise<unknown>;
  createHabit(fields: HabitFields): Promise<void>;
  saveHabit(id: string, fields: HabitFields): Promise<void>;
  deleteHabit(id: string): Promise<void>;
  addCompletion(id: string, day: string): Promise<void>;
};

// The build puts the values of .env here; a build without them (the tests' bundle) has no such name.
declare const CLIENT_ENV: Record<string, string | undefined> | undefined;

const config = loadClientConfig(typeof CLIENT_ENV === "object" ? CLIENT_ENV : {});
// Measuring (docs/performance.md): ?synthetic=N in the address still means the fixture API's generated
// habits, kept only in memory, whatever the source — a measurement never writes to the server.
const measuring = typeof location === "object" && Number(new URLSearchParams(location.search).get("synthetic") ?? "0") > 0;
let source: DataSource = config.dataSource === "http" && !measuring ? createHttpApi({ baseUrl: config.apiBaseUrl, fetch: (url, init) => fetch(url, init) }) : fixtureApi;

// For the tests: the fixture API with these habits.
export function resetApi(list: Habit[], options: { delayMs?: number } = {}) {
  source = fixtureApi;
  fixtureApi.resetApi(list, options);
}

export const listHabits = (filter: ListFilter, signal?: AbortSignal) => source.listHabits(filter, signal);
export const createHabit = (fields: HabitFields) => source.createHabit(fields);
export const saveHabit = (id: string, fields: HabitFields) => source.saveHabit(id, fields);
export const deleteHabit = (id: string) => source.deleteHabit(id);
export const addCompletion = (id: string, day: string) => source.addCompletion(id, day);
