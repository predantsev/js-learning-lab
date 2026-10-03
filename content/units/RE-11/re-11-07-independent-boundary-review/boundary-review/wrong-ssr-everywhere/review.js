// "SSR is the modern default" — chosen without reading each page's facts.
export const PAGES = {
  catalog: { strategy: "ssr", why: "Server rendering is always the best choice for every page." },
  dashboard: { strategy: "ssr", why: "Server rendering is always the best choice for every page!" },
  admin: { strategy: "ssr", why: "Server rendering is always the best choice for every page?" },
};

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

export const CANNOT_CROSS = ["onRegistered", "registration"];
export const SECRETS = ["adminToken"];
export const LABELS = { useServer: "stable", taintObjectReference: "experimental", serverOnlyPackage: "framework" };
