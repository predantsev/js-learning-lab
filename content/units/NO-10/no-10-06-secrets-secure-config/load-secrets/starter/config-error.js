// The error a config check throws (read-only). Its message names the variable and the problem.
export class ConfigError extends Error {
  constructor(message) {
    super(message);
    this.name = 'ConfigError';
  }
}
