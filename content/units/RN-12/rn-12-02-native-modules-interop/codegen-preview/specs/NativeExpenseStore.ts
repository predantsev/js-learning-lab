// specs/NativeExpenseStore.ts: the typed spec of a native expense store (a TurboModule).
import type { TurboModule } from 'react-native';
import { TurboModuleRegistry } from 'react-native';

export interface Spec extends TurboModule {
  addAmount(expenseId: string, amount: number): void;
  getMonthTotal(month: string): number;
  addMany(expenseIds: string[], amounts: number[]): void;
}

export default TurboModuleRegistry.getEnforcing<Spec>('NativeExpenseStore');
