// The data source of the screens: the one module that decides where the tasks come from. The screens
// (ui/tasksCache.tsx) import only from here, so switching the source changes no component and no domain
// function. With DATA_SOURCE=http (in .env, built into the bundle as CLIENT_ENV) it is the records server
// (data/httpApi.ts); without it, the fixture API (data/fixtureApi.ts). The tests call resetApi(), which
// switches to the fixture API with their own tasks.
import type { Task } from "../domain/tasks.ts";
import { loadClientConfig } from "./config.js";
import * as fixtureApi from "./fixtureApi.ts";
import type { ListFilter } from "./fixtureApi.ts";
import { createHttpApi } from "./httpApi.ts";
import type { TaskFields } from "../ui/tasksReducer.ts";

export { ApiError } from "./apiError.ts";
export { settings, requests } from "./fixtureApi.ts";
export type { ListFilter } from "./fixtureApi.ts";

type DataSource = {
  listTasks(filter: ListFilter, signal?: AbortSignal): Promise<unknown>;
  createTask(fields: TaskFields): Promise<void>;
  saveTask(id: string, fields: TaskFields): Promise<void>;
  setDone(id: string, done: boolean): Promise<void>;
  deleteTask(id: string): Promise<void>;
};

// The build puts the values of .env here; a build without them (the tests' bundle) has no such name.
declare const CLIENT_ENV: Record<string, string | undefined> | undefined;

const config = loadClientConfig(typeof CLIENT_ENV === "object" ? CLIENT_ENV : {});
// Measuring (docs/performance.md): ?synthetic=N in the address still means the fixture API's generated
// tasks, kept only in memory, whatever the source — a measurement never writes to the server.
const measuring = typeof location === "object" && Number(new URLSearchParams(location.search).get("synthetic") ?? "0") > 0;
let source: DataSource = config.dataSource === "http" && !measuring ? createHttpApi({ baseUrl: config.apiBaseUrl, fetch: (url, init) => fetch(url, init) }) : fixtureApi;

// For the tests: the fixture API with these tasks.
export function resetApi(list: Task[], options: { delayMs?: number } = {}) {
  source = fixtureApi;
  fixtureApi.resetApi(list, options);
}

export const listTasks = (filter: ListFilter, signal?: AbortSignal) => source.listTasks(filter, signal);
export const createTask = (fields: TaskFields) => source.createTask(fields);
export const saveTask = (id: string, fields: TaskFields) => source.saveTask(id, fields);
export const setDone = (id: string, done: boolean) => source.setDone(id, done);
export const deleteTask = (id: string) => source.deleteTask(id);
