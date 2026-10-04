// The data source of the screens: the one module that decides where the wishes come from. The screens
// (ui/itemsCache.tsx) import only from here, so switching the source changes no component and no domain
// function. With DATA_SOURCE=http (in .env, built into the bundle as CLIENT_ENV) it is the records server
// (data/httpApi.ts); without it, the fixture API (data/fixtureApi.ts). The tests call resetApi(), which
// switches to the fixture API with their own wishes.
import type { Wish } from "../domain/wishes.ts";
import { loadClientConfig } from "./config.js";
import * as fixtureApi from "./fixtureApi.ts";
import type { ListFilter } from "./fixtureApi.ts";
import { createHttpApi } from "./httpApi.ts";
import type { WishFields } from "../ui/itemsReducer.ts";

export { ApiError } from "./apiError.ts";
export { settings, requests } from "./fixtureApi.ts";
export type { ListFilter } from "./fixtureApi.ts";

type DataSource = {
  listItems(filter: ListFilter, signal?: AbortSignal): Promise<unknown>;
  createItem(fields: WishFields): Promise<void>;
  saveItem(id: string, fields: WishFields): Promise<void>;
  setAcquired(id: string, acquired: boolean): Promise<void>;
  deleteItem(id: string): Promise<void>;
};

// The build puts the values of .env here; a build without them (the tests' bundle) has no such name.
declare const CLIENT_ENV: Record<string, string | undefined> | undefined;

const config = loadClientConfig(typeof CLIENT_ENV === "object" ? CLIENT_ENV : {});
// Measuring (docs/performance.md): ?synthetic=N in the address still means the fixture API's generated
// wishes, kept only in memory, whatever the source — a measurement never writes to the server.
const measuring = typeof location === "object" && Number(new URLSearchParams(location.search).get("synthetic") ?? "0") > 0;
let source: DataSource = config.dataSource === "http" && !measuring ? createHttpApi({ baseUrl: config.apiBaseUrl, fetch: (url, init) => fetch(url, init) }) : fixtureApi;

// For the tests: the fixture API with these wishes.
export function resetApi(list: Wish[], options: { delayMs?: number } = {}) {
  source = fixtureApi;
  fixtureApi.resetApi(list, options);
}

export const listItems = (filter: ListFilter, signal?: AbortSignal) => source.listItems(filter, signal);
export const createItem = (fields: WishFields) => source.createItem(fields);
export const saveItem = (id: string, fields: WishFields) => source.saveItem(id, fields);
export const setAcquired = (id: string, acquired: boolean) => source.setAcquired(id, acquired);
export const deleteItem = (id: string) => source.deleteItem(id);
