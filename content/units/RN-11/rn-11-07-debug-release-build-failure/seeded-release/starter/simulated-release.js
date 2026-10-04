// SIMULATION for the preview only (read-only). It stands in for `npx expo run:android --variant release`
// on the declared target: Gradle signs the build, Android's package installer installs it over the
// installed build, and the app starts. The messages are this simulation's own; INSTALL_FAILED_… are
// the names of Android's install error codes (we did not see them on a device).
import { appConfig } from './app-config.js';
import { userGradleProperties } from './user-gradle-properties.js';
import { installed, keystores } from './target.js';
import { startApp } from './start.js';

function parseProperties(text) {
  const result = {};
  for (const line of text.split('\n')) {
    const match = /^\s*([\w.]+)\s*=\s*(.*?)\s*$/.exec(line);
    if (match) result[match[1]] = match[2];
  }
  return result;
}

// Stage 1 — build: Gradle signs the release with the key named in ~/.gradle/gradle.properties.
export function signRelease() {
  const props = parseProperties(userGradleProperties);
  const path = props.MYAPP_UPLOAD_STORE_FILE;
  const store = keystores[path];
  if (!store) return { ok: false, text: `[build] signing config 'release': keystore not found: ${path}` };
  if (props.MYAPP_UPLOAD_KEY_ALIAS !== store.alias || !props.MYAPP_UPLOAD_STORE_PASSWORD || !props.MYAPP_UPLOAD_KEY_PASSWORD) {
    return { ok: false, text: `[build] signing config 'release': wrong alias or missing password for ${path}` };
  }
  return { ok: true, signer: store.signer, text: `[build] app-release.apk signed by ${store.signer}` };
}

// Stage 2 — install over the build on the target.
export function installOver(signer) {
  const { package: id, versionCode } = appConfig.android;
  if (id !== installed.id) return { ok: false, text: `[install] ${id} installed NEXT TO ${installed.id}: a different app` };
  if (signer !== installed.signer) return { ok: false, text: `[install] INSTALL_FAILED_UPDATE_INCOMPATIBLE: signature differs from the installed build` };
  if (versionCode < installed.versionCode) {
    return { ok: false, text: `[install] INSTALL_FAILED_VERSION_DOWNGRADE: versionCode ${versionCode} < installed ${installed.versionCode}` };
  }
  if (versionCode === installed.versionCode) {
    return { ok: false, text: `[install] reinstalled versionCode ${versionCode} again — a store would refuse a used number` };
  }
  return { ok: true, text: `[install] updated ${installed.versionCode} → ${versionCode}` };
}

// Stage 3 — the first start of the release (__DEV__ is false).
export function launchRelease() {
  const saved = globalThis.__DEV__;
  globalThis.__DEV__ = false;
  try {
    const wishes = startApp();
    return { ok: true, wishes, text: `[launch] started, ${wishes.length} wishes` };
  } catch (error) {
    return { ok: false, wishes: [], text: `[launch] crashed: ${error.name}: ${error.message}` };
  } finally {
    globalThis.__DEV__ = saved;
  }
}

// The whole chain stops at the first failure, as the real one does.
export function releaseRun() {
  const stages = [];
  const signed = signRelease();
  stages.push(signed);
  if (!signed.ok) return stages;
  const install = installOver(signed.signer);
  stages.push(install);
  if (!install.ok) return stages;
  stages.push(launchRelease());
  return stages;
}
