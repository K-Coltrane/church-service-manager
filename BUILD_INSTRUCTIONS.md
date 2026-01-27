# Building Standalone APK for Production

This guide will help you build a standalone APK file that can be installed on Android devices without needing a connection to your PC or development tools.

## Option 1: EAS Build (Recommended - Cloud-based, Easier)

EAS Build is Expo's cloud-based build service. It's the easiest way to create production APKs.

### Prerequisites
1. Install EAS CLI globally:
   ```bash
   npm install -g eas-cli
   ```

2. Create an Expo account (if you don't have one):
   - Visit https://expo.dev and sign up for a free account

3. Login to EAS:
   ```bash
   eas login
   ```

### Building the APK

1. **Configure your project** (first time only):
   ```bash
   eas build:configure
   ```

2. **Build the production APK**:
   ```bash
   npm run build:android
   ```
   Or directly:
   ```bash
   eas build --platform android --profile production
   ```

3. **Wait for the build to complete** (usually 10-20 minutes):
   - The build runs on Expo's servers
   - You'll see progress in your terminal
   - You can also check status at https://expo.dev

4. **Download your APK**:
   - Once complete, EAS will provide a download link
   - Or download from https://expo.dev/accounts/[your-username]/builds
   - The APK file will be named something like: `app-release.apk`

5. **Install on Android device**:
   - Transfer the APK file to your Android device
   - Enable "Install from Unknown Sources" in Android settings
   - Tap the APK file to install

### Build Profiles

- **Production**: Optimized APK for production use
- **Preview**: APK for testing (faster builds, less optimization)

To build a preview APK:
```bash
npm run build:android:preview
```

---

## Option 2: Local Build (Advanced)

If you prefer to build locally on your machine, you'll need Android Studio and the Android SDK.

### Prerequisites
1. Install [Android Studio](https://developer.android.com/studio)
2. Install Android SDK (API level 33 or higher)
3. Set up environment variables:
   - `ANDROID_HOME` pointing to your Android SDK location
   - Add `$ANDROID_HOME/platform-tools` to your PATH

### Building Locally

1. **Prebuild native code**:
   ```bash
   npm run prebuild
   ```
   This creates the `android/` folder with native Android project files.

2. **Navigate to Android folder**:
   ```bash
   cd android
   ```

3. **Build the APK**:
   ```bash
   ./gradlew assembleRelease
   ```
   On Windows:
   ```bash
   gradlew.bat assembleRelease
   ```

4. **Find your APK**:
   - Location: `android/app/build/outputs/apk/release/app-release.apk`
   - This is your standalone APK file

5. **Sign the APK** (for production):
   - Generate a keystore (first time only):
     ```bash
     keytool -genkeypair -v -storetype PKCS12 -keystore my-release-key.keystore -alias my-key-alias -keyalg RSA -keysize 2048 -validity 10000
     ```
   - Follow Android's signing guide: https://reactnative.dev/docs/signed-apk-android

---

## Important Notes

### Package Name
- The app uses package name: `com.churchservice.manager`
- You can change this in `app.json` under `android.package`
- **Important**: Once published, you cannot change the package name

### Version Management
- Update `version` in `app.json` for user-facing version (e.g., "1.0.1")
- Update `versionCode` in `app.json` for each build (must increment: 1, 2, 3...)

### App Icon & Splash Screen
- Icon: `./assets/images/icon.png` (1024x1024px recommended)
- Adaptive Icon: `./assets/images/adaptive-icon.png` (1024x1024px)
- Splash: `./assets/images/splash-icon.png`

### Testing Before Production
1. Build a preview APK first: `npm run build:android:preview`
2. Install on test devices
3. Test all features thoroughly
4. Build production APK when ready

---

## Troubleshooting

### Build fails with "No credentials found"
- Run `eas build:configure` to set up credentials
- Or use `--local` flag for local builds

### APK is too large
- Enable ProGuard/R8 in `android/app/build.gradle`
- Remove unused assets
- Use Android App Bundle (AAB) instead of APK

### App crashes on startup
- Check logs: `adb logcat`
- Ensure all environment variables are set correctly
- Verify API endpoints are accessible from device

---

## Quick Start (EAS Build)

```bash
# 1. Install EAS CLI
npm install -g eas-cli

# 2. Login
eas login

# 3. Configure (first time)
eas build:configure

# 4. Build APK
npm run build:android

# 5. Download and install APK on your device
```

The APK will be ready for production use and doesn't require any connection to your PC!





