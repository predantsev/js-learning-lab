// Design review of the "Meetups" app. Fill in every answer; keep the keys as they are.

// For each page: strategy "csr", "ssr" or "static", and why (one sentence).
export const PAGES = {
  catalog: { strategy: "", why: "" },
  dashboard: { strategy: "", why: "" },
  admin: { strategy: "", why: "" },
};

// For each component of the tree: "server" or "client".
export const COMPONENTS = {
  EventsPage: "",
  EventList: "",
  EventCard: "",
  RegisterButton: "",
  CategoryFilter: "",
  CountdownBadge: "",
  DashboardPage: "",
  MyRegistrations: "",
  CancelButton: "",
  AdminPage: "",
  AdminEventForm: "",
};

// Names of the props in the crossings that React cannot serialize.
export const CANNOT_CROSS = [];

// Names of the props in the crossings that React could serialize but that must never reach the browser.
export const SECRETS = [];

// For each API from the tutorial: "stable", "canary", "experimental" or "framework" (a framework's rule, not a React API).
export const LABELS = {
  useServer: "",
  taintObjectReference: "",
  serverOnlyPackage: "",
};
