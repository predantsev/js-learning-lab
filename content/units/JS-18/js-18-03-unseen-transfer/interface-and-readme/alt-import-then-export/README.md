# Plant care

## Public interface

Import from `plant-care.ts` only:

- `parsePlants(input: unknown): Plant[]` — the valid plants from data of unknown shape.
- `dueToday(plants, today): Plant[]` — the plants that need water on `today`, in their order.
- `waterPlants(plants, ids, today): Plant[]` — a new list with those plants watered.
- `loadPlants(storage): Plant[]` and `savePlants(storage, plants)` — persistence; loading never throws.
- `mount(root, storage, today)` — the page with the due list.

## Data

A plant is `{ id, name, location, intervalDays, lastWatered, status }`: `intervalDays` is 1–365 whole days,
`lastWatered` is a `YYYY-MM-DD` date, `status` is `"ok"`, `"thirsty"` or `"resting"`.
Storage holds `{ "schemaVersion": 1, "plants": [...] }` under `jsll.plants.v1`.

## Index choice

`waterPlants` builds a `Set` of the ids once instead of scanning the id list for every plant.
З 500 id, медіана з 5 запусків: 2000 рослин — scan 0.8 ms, Set 0.1 ms; 20000 рослин — scan 8.6 ms, Set 0.7 ms.
The scan grows with plants × ids, the Set only with plants + ids.

## Tests

- unit: `isDue`, `dueToday`, `waterPlants` and `parsePlants` on small fresh fixtures with a fixed today.
- integration: `savePlants` and `loadPlants` together with a fake storage, including broken stored text.
- user: `mount` in a test container, pressing a button and checking the list, the status and the storage.

## How to run

Open the exercise and press Check; `plants.test.js` runs with the course test runner and prints one line per test.
