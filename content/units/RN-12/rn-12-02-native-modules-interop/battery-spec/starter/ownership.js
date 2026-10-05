// ownership.js: who writes each part of the battery module — 'codegen' or 'developer'.
export const ownership = {
  specFile: '', //         specs/NativeBatteryLevel.ts
  androidSpecClass: '', // the abstract Java class NativeBatteryLevelSpec
  iosSpecProtocol: '', //  the Objective-C protocol NativeBatteryLevelSpec
  jsiBinding: '', //       the C++ code that turns a JSI call into a call of the native method
  androidModule: '', //    the Kotlin class that reads the battery on Android
  iosModule: '', //        the Objective-C++ class that reads the battery on iOS
  registration: '', //    the code that tells React Native the module exists (an Android package, the iOS provider)
};
