// The shape every part of the planner script expects its config to have.
export interface Config {
  port: number;
  locale: "uk" | "en";
}

export function describeConfig(config: Config): string {
  return `port ${config.port}, next ${config.port + 1}, locale ${config.locale}`;
}
