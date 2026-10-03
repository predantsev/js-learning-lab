// Marks every component that renders a client child as a client component too.
export const PAGES = {
  catalog: { strategy: "static", why: "The same for everyone and rebuilt when organizers publish." },
  dashboard: { strategy: "ssr", why: "Personal data that slow phones should see in the first HTML." },
  admin: { strategy: "csr", why: "Just a form." },
};

export const COMPONENTS = {
  EventsPage: "client",
  EventList: "client",
  EventCard: "client",
  RegisterButton: "client",
  CategoryFilter: "client",
  CountdownBadge: "client",
  DashboardPage: "client",
  MyRegistrations: "server",
  CancelButton: "client",
  AdminPage: "client",
  AdminEventForm: "client",
};

export const CANNOT_CROSS = ["onRegistered", "registration"];
export const SECRETS = ["adminToken"];
export const LABELS = { useServer: "experimental", taintObjectReference: "experimental", serverOnlyPackage: "stable" };
