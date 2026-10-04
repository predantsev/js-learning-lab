// SYNTHETIC build log for the lesson, assembled in the format Gradle prints. It was not captured
// from a real build: "lab-capture" is a made-up native library, pinned to a version that does
// not match the app. Do not edit; the viewer reads it.
const modules = ['expo-modules-core', 'expo-constants', 'expo-file-system', 'expo-asset', 'lab-capture', 'app'];
const steps = ['preBuild', 'preDebugBuild', 'generateDebugBuildConfig', 'generateDebugResValues', 'processDebugManifest', 'mergeDebugResources', 'compileDebugKotlin', 'compileDebugJavaWithJavac', 'bundleLibCompileToJarDebug'];

const head = ['> Configure project :app', 'Using expo modules', '  - expo-constants (57.0.4)', '  - expo-modules-core (57.0.11)', '  - lab-capture (3.0.0)'];

const tasks = [];
for (let round = 0; tasks.length < 300; round += 1) {
  for (const module of modules) {
    for (const step of steps) {
      if (module === 'lab-capture' && step === 'compileDebugKotlin') continue;
      const state = round === 0 ? 'UP-TO-DATE' : 'NO-SOURCE';
      tasks.push(`> Task :${module}:${step}${round > 0 ? round : ''} ${state}`);
      if (tasks.length % 47 === 0) tasks.push(`w: file:///Users/me/rn07-lab/node_modules/${module}/android/src/main/java/Module.kt:${tasks.length % 90}:5 'fun onHostResume(): Unit' is deprecated.`);
    }
  }
}

const failure = [
  'e: file:///Users/me/rn07-lab/node_modules/lab-capture/android/src/main/java/lab/capture/CaptureModule.kt:41:7 Unresolved reference \'registerForResult\'.',
  'e: file:///Users/me/rn07-lab/node_modules/lab-capture/android/src/main/java/lab/capture/CaptureModule.kt:58:12 Unresolved reference \'registerForResult\'.',
  '> Task :lab-capture:compileDebugKotlin FAILED',
];

const after = [];
for (const step of ['mergeDebugJniLibFolders', 'mergeDebugNativeLibs', 'stripDebugDebugSymbols', 'copyDebugJniLibsProjectOnly']) {
  for (const module of modules) after.push(`> Task :${module}:${step} UP-TO-DATE`);
}
after.push("w: file:///Users/me/rn07-lab/node_modules/expo-asset/android/src/main/java/AssetModule.kt:22:3 'val currentActivity: Activity?' is deprecated.");

const summary = [
  '',
  'FAILURE: Build failed with an exception.',
  '',
  '* What went wrong:',
  "Execution failed for task ':lab-capture:compileDebugKotlin'.",
  '> A failure occurred while executing org.jetbrains.kotlin.compilerRunner.GradleCompilerRunnerWithWorkers$GradleKotlinCompilerWorkAction',
  '   > Compilation error. See log for more details',
  '',
  '* Try:',
  '> Run with --stacktrace option to get the stack trace.',
  '> Run with --info or --debug option to get more log output.',
  '> Run with --scan to get full insights.',
  '',
  'BUILD FAILED in 1m 52s',
];

export const gradleLog = [...head, ...tasks, ...failure, ...after, ...summary];
