// specs/NativeBatteryLevel.ts: the typed spec of the battery capability (a TurboModule).
import { type TurboModule, TurboModuleRegistry } from 'react-native';

export interface Spec extends TurboModule {
  // Synchronous: a quick flag the system already knows.
  isCharging(): boolean;
  // Asynchronous: the level between 0 and 1.
  getLevel():Promise<number>
}

export default TurboModuleRegistry.getEnforcing<Spec>("NativeBatteryLevel");
