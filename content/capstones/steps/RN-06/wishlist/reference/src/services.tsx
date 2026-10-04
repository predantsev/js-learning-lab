// What every screen of the stack needs from App.tsx: the repository over the storage adapter, the
// price format, and whether the starting records could be read. A context passes them down, so the
// navigator does not have to.
import { createContext, useContext } from 'react';
import type { Wish } from '../domain/wishes.ts';
import type { PriceFormat } from './contracts.ts';
import type { ItemsRepository } from './repository.ts';

export type Services = {
  repository: ItemsRepository;
  format: PriceFormat;
  startingFailed: boolean;
  starting: Wish[]; // the bundled starting wishes, the fallback of the service screen
};

export const ServicesContext = createContext<Services | null>(null);

export function useServices(): Services {
  const services = useContext(ServicesContext);
  if (services === null) {
    throw new Error('useServices needs a ServicesContext provider above the screen');
  }
  return services;
}
