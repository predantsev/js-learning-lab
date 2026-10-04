// ownership.js: who writes each part of the battery module — 'codegen' or 'developer'.
export const ownership = {
  specFile: 'codegen', //         specs/NativeBatteryLevel.ts
  androidSpecClass: 'codegen', // the abstract Java class NativeBatteryLevelSpec
  iosSpecProtocol: 'codegen', //  the Objective-C protocol NativeBatteryLevelSpec
  jsiBinding: 'codegen', //       the C++ code that turns a JSI call into a call of the native method
  androidModule: 'developer', //    the Kotlin class that reads the battery on Android
  iosModule: 'developer', //        the Objective-C++ class that reads the battery on iOS
  registration: 'developer', //    the code that tells React Native the module exists (an Android package, the iOS provider)
};
