// Design review of the "Meetups" app. Fill in every answer; keep the keys as they are.

// For each page: strategy "csr", "ssr" or "static", and why (one sentence).
export const PAGES = {
  catalog: {
    strategy: "static",
    why: "Same for every visitor, changes only with a rebuild after publishing, and must be readable without JavaScript.",
  },
  dashboard: {
    strategy: "ssr",
    why: "Personal per request, and slow phones must see the tickets in the first HTML.",
  },
  admin: {
    strategy: "csr",
    why: "Behind login, a purely interactive form for three people with no first-view requirement.",
  },
};

// For each component of the tree: "server" or "client".
export const COMPONENTS = {
  EventsPage: "server",
  EventList: "server",
  EventCard: "server",
  RegisterButton: "client",
  CategoryFilter: "client",
  CountdownBadge: "client",
  DashboardPage: "server",
  MyRegistrations: "server",
  CancelButton: "client",
  AdminPage: "server",
  AdminEventForm: "client",
};

// Names of the props in the crossings that React cannot serialize.
export const CANNOT_CROSS = ["onRegistered", "registration"];

// Names of the props in the crossings that React could serialize but that must never reach the browser.
export const SECRETS = ["adminToken"];

// For each API from the tutorial: "stable", "canary", "experimental" or "framework" (a framework's rule, not a React API).
export const LABELS = {
  useServer: "stable",
  taintObjectReference: "experimental",
  serverOnlyPackage: "framework",
};
