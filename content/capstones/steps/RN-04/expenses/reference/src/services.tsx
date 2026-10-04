// What every screen of the stack needs from App.tsx: the repository over the storage adapter, the money
// format, and whether the starting records could be read. A context passes them down, so the navigator
// does not have to.
import { createContext, useContext } from 'react';
import type { MoneyFormat } from './contracts.ts';
import type { ExpensesRepository } from './repository.ts';

export type Services = {
  repository: ExpensesRepository;
  format: MoneyFormat;
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
