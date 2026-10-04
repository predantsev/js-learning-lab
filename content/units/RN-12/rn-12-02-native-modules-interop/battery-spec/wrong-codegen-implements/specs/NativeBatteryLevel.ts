// specs/NativeBatteryLevel.ts: the typed spec of the battery capability (a TurboModule).
import type { TurboModule } from 'react-native';
import { TurboModuleRegistry } from 'react-native';

export interface Spec extends TurboModule {
  getLevel(): Promise<number>;
  isCharging(): boolean;
}

export default TurboModuleRegistry.getEnforcing<Spec>('NativeBatteryLevel');
