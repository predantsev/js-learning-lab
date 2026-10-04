// What every screen of the stack needs from App.tsx: the repository over the storage adapter, the date
// format, the clock, and whether the starting records could be read. A context passes them down, so
// the navigator does not have to.
import { createContext, useContext } from 'react';
import type { ClockAdapter, DateFormat } from './contracts.ts';
import type { TasksRepository } from './repository.ts';

export type Services = {
  repository: TasksRepository;
  format: DateFormat;
  clock: ClockAdapter;
  startingFailed: boolean;
};

export const ServicesContext = createContext<Services | null>(null);

export function useServices(): Services {
  const services = useContext(ServicesContext);
  if (services === null) {
    throw new Error('useServices needs a ServicesContext provider above the screen');
  }
  return services;
}
