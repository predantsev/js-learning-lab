// Treats the token as "cannot cross": but a string serializes fine — that is exactly the danger.
export const PAGES = {
  catalog: { strategy: "static", why: "The same for everyone and rebuilt when organizers publish." },
  dashboard: { strategy: "ssr", why: "Personal data that slow phones should see in the first HTML." },
  admin: { strategy: "csr", why: "An interactive form behind login with no first-view needs." },
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

export const CANNOT_CROSS = ["onRegistered", "registration", "adminToken"];
export const SECRETS = [];
export const LABELS = { useServer: "stable", taintObjectReference: "experimental", serverOnlyPackage: "framework" };
