# Planner sync — agreed requirements

The planner is used by one person from two devices: a laptop and a phone. Either can be offline.

- **R1.** An edit made on one device never silently overwrites a newer edit made on the other
  device. When both changed the same task, the person sees a conflict and chooses.
- **R2.** The server accepts at most 100 changes per request and a body of at most 64 KB; a
  larger request is refused without changing anything.
- **R3.** Every changed field passes the same validation as a normal task update.
- **R4.** Sync can be switched off without a new deploy, and the team can see how many changes are
  applied, refused and in conflict.
