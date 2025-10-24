# Building APK for Thandi Than Paren V2

## Prerequisites

1. **Install EAS CLI globally:**
   ```bash
   npm install -g eas-cli
   ```

2. **Login to Expo:**
   ```bash
   eas login
   ```
   (Create an account at https://expo.dev if you don't have one)

## Building the APK

### Option 1: Production Build (Recommended)
```bash
npm run build:android
```
or
```bash
eas build --platform android --profile production
```

### Option 2: Preview Build (For Testing)
```bash
npm run build:android:preview
```
or
```bash
eas build --platform android --profile preview
```

## What Happens During Build

1. EAS will ask if you want to configure the project - answer **Yes**
2. It will generate a new Android keystore if needed - answer **Yes**
3. The build will be queued on Expo's servers
4. You'll receive a link to track the build progress
5. Once complete, you can download the APK from the build page

## Download Your APK

After the build completes:
1. Visit https://expo.dev/accounts/[your-username]/projects/event-checkin-app/builds
2. Click on the latest build
3. Download the APK file
4. Install it on your Android device

## App Configuration

Your app is now configured with:
- **App Name:** Thandi Than Paren v2
- **Icon:** gold_CL.png (main icon)
- **Adaptive Icon:** gold_CL_adaptive.png (Android home screen)
- **Splash Screen:** gold_CL_splash.png
- **Package Name:** com.talentia.thandiparen

## Installing on Device

1. Transfer the APK to your Android device
2. Enable "Install from Unknown Sources" in Android settings
3. Tap the APK file to install
4. Accept the permissions when prompted

## Troubleshooting

If you encounter issues:
- Make sure you're logged into EAS: `eas whoami`
- Check build status: `eas build:list`
- View build logs on the Expo website

## Local Build (Alternative - Requires Android Studio)

If you want to build locally without EAS:
```bash
npx expo run:android --variant release
```

Note: This requires Android Studio and Android SDK to be installed and configured.
