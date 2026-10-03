export const PAGES = {
  catalog: { strategy: "Static", why: "Nobody sees anything personal there; build it once per publish and let crawlers read plain HTML." },
  dashboard: { strategy: " SSR ", why: "Needs this visitor's registrations, and the tickets must be visible before the bundle loads." },
  admin: { strategy: "CSR", why: "Three staff members on desktops; it is all form state, and search engines must not see it." },
};

export const COMPONENTS = {
  AdminEventForm: "client",
  AdminPage: "server",
  CancelButton: "client",
  CategoryFilter: "client",
  CountdownBadge: "client",
  DashboardPage: "server",
  EventCard: "server",
  EventList: "server",
  EventsPage: "server",
  MyRegistrations: "server",
  RegisterButton: "client",
};

export const CANNOT_CROSS = ["registration", "onRegistered"];
export const SECRETS = ["adminToken"];
export const LABELS = { serverOnlyPackage: "framework", taintObjectReference: "experimental", useServer: "stable" };
