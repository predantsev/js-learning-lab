// SUPPLIED ARTIFACTS (read-only): excerpts of the native files `npx expo prebuild` generated for the
// release lab (Expo SDK 57, app.json with the id com.example.jsll.releaselab, version 1.0.0, build 1).
// Copied from a real prebuild run; lines that do not matter here are left out (…).

// android/app/src/main/AndroidManifest.xml — the permissions part, verbatim.
export const androidManifest = `<manifest xmlns:android="http://schemas.android.com/apk/res/android" xmlns:tools="http://schemas.android.com/tools">
  <uses-permission android:name="android.permission.INTERNET"/>
  <uses-permission android:name="android.permission.READ_EXTERNAL_STORAGE" android:maxSdkVersion="32" tools:replace="android:maxSdkVersion"/>
  <uses-permission android:name="android.permission.SYSTEM_ALERT_WINDOW"/>
  <uses-permission android:name="android.permission.VIBRATE"/>
  <uses-permission android:name="android.permission.WRITE_EXTERNAL_STORAGE" android:maxSdkVersion="32" tools:replace="android:maxSdkVersion"/>
  …
</manifest>`;

// android/app/build.gradle — defaultConfig, verbatim (minSdkVersion comes from React Native: 24).
export const androidGradle = `defaultConfig {
    applicationId 'com.example.jsll.releaselab'
    minSdkVersion rootProject.ext.minSdkVersion
    targetSdkVersion rootProject.ext.targetSdkVersion
    versionCode 1
    versionName "1.0.0"
    …
}`;

// ios/Releaselab/Info.plist — an excerpt, verbatim. CFBundleIdentifier is a build setting:
// project.pbxproj sets PRODUCT_BUNDLE_IDENTIFIER = "com.example.jsll.releaselab" and
// IPHONEOS_DEPLOYMENT_TARGET = 16.4.
export const iosInfoPlist = `<key>CFBundleDisplayName</key>
<string>Release lab</string>
<key>CFBundleIdentifier</key>
<string>$(PRODUCT_BUNDLE_IDENTIFIER)</string>
<key>CFBundleShortVersionString</key>
<string>1.0.0</string>
<key>CFBundleVersion</key>
<string>1</string>
<key>NSAppTransportSecurity</key>
<dict>
  <key>NSAllowsArbitraryLoads</key>
  <false/>
  <key>NSAllowsLocalNetworking</key>
  <true/>
</dict>`;
export const iosBuildSettings = { PRODUCT_BUNDLE_IDENTIFIER: 'com.example.jsll.releaselab', IPHONEOS_DEPLOYMENT_TARGET: '16.4' };
