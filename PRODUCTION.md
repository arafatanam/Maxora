# Production Guide

This guide covers hosting the backend, testing over a public connection, preparing the mobile project and shipping builds to Google Play and the App Store.

## Order of operations

1. Prepare accounts and tools.
2. Deploy the backend to Vercel.
3. Verify the backend and test the app through a tunnel.
4. Prepare `app.json` and `eas.json`.
5. Add EAS environment variables for `preview` and `production`.
6. Build, test and release on Android.
7. Build, test and release on iOS.
8. Prepare the store listings.
9. Switch billing on and set `TEST_MODE=false`.
10. Run the final checklist.

## 1. Accounts and tools

| Item                    | Cost         | Notes                                                                                                  |
| ----------------------- | ------------ | ------------------------------------------------------------------------------------------------------ |
| Vercel                  | Free tier    | Hosts the Next.js backend                                                                              |
| Expo account (EAS)      | Free tier    | Free plans cap monthly builds. Check your quota in the EAS dashboard.                                  |
| Google Play Console     | $25 one time | New personal accounts need a closed test with at least 12 testers for 14 days before production access |
| Apple Developer Program | $99 per year | Required for every iOS build. Approval takes 1 to 2 days.                                              |

Install the EAS CLI once (Run from the `mobile/` folder.):

```powershell
npm install -g eas-cli
eas login
```

**Recommended order:** Ship Android first. Start Play closed testing, then enroll in Apple while testers use the Android app.

## 2. Deploy the backend to Vercel

Push the latest code to GitHub. Then open Vercel, choose **Add New Project** and import the repository.

### Project settings

| Setting          | Value                                     |
| ---------------- | ----------------------------------------- |
| Framework preset | Next.js                                   |
| Root directory   | `backend`                                 |
| Build command    | Default (`next build`)                    |
| Output directory | Default (`.next`)                         |
| Install command  | Default (`npm install`)                   |
| Node.js version  | 20.x (Settings, General, Node.js Version) |

Open `backend/vercel.json`. A `buildCommand` or `outputDirectory` value there overrides the dashboard. Remove any value that conflicts with the defaults.

### Request time limit

Photo analysis calls Groq and takes several seconds. A low time limit kills the request mid-analysis. Set `maxDuration` for the API route in `backend/vercel.json`. Merge this block with the existing file. Use a value your Vercel plan allows.

```json
{
  "functions": {
    "app/api/[...path]/route.js": { "maxDuration": 60 }
  }
}
```

### Environment variables

Add these before the first deploy. Select Production, Preview and Development for each.

| Name                            | Value                                        |
| ------------------------------- | -------------------------------------------- |
| `NEXT_PUBLIC_SUPABASE_URL`      | Supabase project URL                         |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anon key                            |
| `SUPABASE_SERVICE_ROLE_KEY`     | Supabase service role key                    |
| `GROQ_API_KEY`                  | Groq API key                                 |
| `GROQ_MODEL`                    | A vision-capable Groq model                  |
| `MOCK_AI`                       | `false`                                      |
| `TEST_MODE`                     | `true` until billing is live (see section 9) |

Copy every other key listed in `backend/.env.example`. Use the exact names from the file.

Rules:

- Never prefix `SUPABASE_SERVICE_ROLE_KEY` with `NEXT_PUBLIC_`.
- Vercel bakes `NEXT_PUBLIC_` values into the build. Redeploy after changing one.
- Keep the Supabase setup from the README: run `backend/supabase/schema.sql` and enable anonymous sign-ins.

Click **Deploy**. Vercel assigns a URL such as `https://maxora-app.vercel.app`.

### Hardening before real users

- Add per-user rate limiting on every Groq route.
- Confirm Row Level Security is on for every table.
- Confirm the `photos` storage bucket is private.
- Compare Groq pricing and limits against expected traffic. Set a spending alert.
- Confirm account deletion removes the auth user, the database rows and the photo files in storage.
- Replace the placeholder legal copy. The backend serves legal pages at `/legal/[doc]`. Use the public URL as the privacy policy link.

## 3. Verify the backend and test through a tunnel

### Check the backend

1. Turn off Wi-Fi on your phone.
2. Open the Vercel URL in a browser.
3. Confirm the legal page loads.

### Test the app against the hosted backend

You no longer start the backend locally. Start only the mobile app.

1. In `mobile/.env`, set the hosted URL. Use no port and no trailing slash.

```env
EXPO_PUBLIC_API_URL=https://maxora-app.vercel.app
EXPO_PUBLIC_SUPABASE_URL=
EXPO_PUBLIC_SUPABASE_ANON_KEY=
```

2. Start Expo in tunnel mode.

```powershell
cd mobile
npx expo start --tunnel -c
```

3. Accept the prompt to install `@expo/ngrok`.
4. Scan the QR code in Expo Go with Wi-Fi off.

Why tunnel mode: a plain `npx expo start` serves the app JavaScript from your PC over your home network. A phone on mobile data cannot reach your PC, so the request times out. Tunnel mode routes through a public URL. Your PC must stay on and load times are slow. Use tunnel mode for quick tests only.

## 4. Prepare `app.json` and `eas.json`

### `mobile/app.json`

Use this as the reference. Keep your existing `projectId` and `owner` values.

```json
{
  "expo": {
    "name": "Maxora",
    "slug": "maxora",
    "scheme": "maxora",
    "version": "1.0.0",
    "orientation": "portrait",
    "icon": "./assets/icon.png",
    "userInterfaceStyle": "dark",
    "backgroundColor": "#080A0D",
    "splash": {
      "image": "./assets/icon.png",
      "resizeMode": "contain",
      "backgroundColor": "#0B0B10"
    },
    "ios": {
      "supportsTablet": false,
      "bundleIdentifier": "com.user.maxora",
      "config": {
        "usesNonExemptEncryption": false
      },
      "infoPlist": {
        "NSCameraUsageDescription": "Maxora uses your camera to take the front and side photos for your face rating.",
        "NSPhotoLibraryUsageDescription": "Maxora reads photos you pick so it can rate your face."
      }
    },
    "android": {
      "package": "com.user.maxora",
      "adaptiveIcon": {
        "backgroundColor": "#0B0B10",
        "foregroundImage": "./assets/icon.png"
      },
      "permissions": ["android.permission.CAMERA"]
    },
    "web": {
      "favicon": "./assets/icon.png"
    },
    "plugins": [
      [
        "expo-image-picker",
        {
          "cameraPermission": "Maxora uses your camera to take the front and side photos for your face rating.",
          "photosPermission": "Maxora reads photos you pick so it can rate your face.",
          "microphonePermission": false
        }
      ],
      "expo-sharing",
      "expo-status-bar"
    ],
    "extra": {
      "eas": {
        "projectId": "YOUR_EXISTING_PROJECT_ID"
      }
    },
    "owner": "YOUR_EXPO_USERNAME"
  }
}
```

What each rule prevents:

- **Bundle identifier and package.** Pick `com.user.maxora` once. You cannot change either value after store submission.
- **No `RECORD_AUDIO`.** Maxora never records audio. Google Play asks you to justify sensitive permissions, and a reviewer flags this one.
- **`microphonePermission: false`.** The `expo-image-picker` plugin adds the microphone permission otherwise.
- **Permission strings.** Keep them specific. Apple rejects vague strings.
- **`usesNonExemptEncryption: false`.** Skips the export compliance question on every iOS upload.
- **Icon.** Use a 1024x1024 PNG with no transparency. Apple rejects icons with an alpha channel.
- **Adaptive icon.** Android crops the foreground layer. Keep the logo inside the center 66 percent of the canvas.
- **Version.** Use `version` for the public number. EAS manages build numbers (see below).

### `mobile/eas.json`

The `environment` field in each profile links the profile to its EAS environment. Without the field, EAS ignores your variables and the app ships with an undefined API URL.

```json
{
  "cli": {
    "version": ">= 12.0.0",
    "appVersionSource": "remote"
  },
  "build": {
    "development": {
      "developmentClient": true,
      "distribution": "internal"
    },
    "preview": {
      "distribution": "internal",
      "environment": "preview",
      "android": { "buildType": "apk" }
    },
    "production": {
      "autoIncrement": true,
      "environment": "production"
    }
  },
  "submit": {
    "production": {}
  }
}
```

- `appVersionSource: remote` lets `autoIncrement` manage build numbers on EAS servers.
- Preview builds produce an APK for direct install on Android and an internal build for registered iPhones.
- Production builds produce an AAB for Google Play and an App Store build for iOS.

### Pre-build checks

Run these from `mobile/` before every build:

```powershell
npx expo-doctor
npx expo install --check
```

Fix every error they report. Then commit all changes. EAS builds from your project files and warns about uncommitted changes.

Open `mobile/src/purchases.js`. Confirm the RevenueCat init step skips setup when no key exists or when `TEST_MODE` is on. Real builds load native modules, and a missing key crashes some setups at launch.

## 5. EAS environment variables

EAS keeps environments separate. Create the same three variables in both `preview` and `production`.

```powershell
cd mobile

eas env:create --environment preview --name EXPO_PUBLIC_API_URL --value https://maxora-app.vercel.app --visibility plaintext
eas env:create --environment preview --name EXPO_PUBLIC_SUPABASE_URL --value YOUR_SUPABASE_URL --visibility plaintext
eas env:create --environment preview --name EXPO_PUBLIC_SUPABASE_ANON_KEY --value YOUR_ANON_KEY --visibility plaintext

eas env:create --environment production --name EXPO_PUBLIC_API_URL --value https://maxora-app.vercel.app --visibility plaintext
eas env:create --environment production --name EXPO_PUBLIC_SUPABASE_URL --value YOUR_SUPABASE_URL --visibility plaintext
eas env:create --environment production --name EXPO_PUBLIC_SUPABASE_ANON_KEY --value YOUR_ANON_KEY --visibility plaintext
```

Verify both:

```powershell
eas env:list --environment preview
eas env:list --environment production
```

Rules:

- Replace every placeholder. A value such as `https://your-project.vercel.app` breaks every API call.
- The message "No environment variables ... found for the production environment" means production is empty. Create the variables before any production build.
- `EXPO_PUBLIC_` values ship inside the app and anyone extracts them. The anon key is public by design. Never place the service role key, Groq key or Stripe secrets here.
- Changing a variable needs a new build. Builds read values at build time.
- If `purchases.js` reads RevenueCat keys, add them to both environments. Check the file for the exact names. RevenueCat uses separate public SDK keys for iOS and Android.

## 6. Android

### Preview build (free APK for testing)

```powershell
cd mobile
eas build --platform android --profile preview
```

Prompts:

- **Generate a new Android keystore:** answer `Y`. EAS stores the keystore and reuses the keystore for production.
- **Install and run on an emulator:** answer `n` unless Android Studio and a virtual device exist.

Back up the keystore after the first build:

```powershell
eas credentials --platform android
```

Choose the download option. Store the file in a password manager or private drive.

### Install and test

1. Open the build page link on an Android phone and tap Install. A QR code also works.
2. Allow installs from your browser when Android asks.
3. Turn off Wi-Fi and use mobile data.
4. Run the full flow: sign-in, age confirmation, consent, onboarding, camera capture, photo picker, upload, scan, results, plan, history, Coach Vee, settings and account deletion.
5. Switch on airplane mode during a scan. Confirm the app shows a clear error.

No Android phone: install Android Studio, create a virtual device and run `eas build:run --platform android --latest`. The emulator uses a fake camera scene, so test uploads with the photo picker.

### Production build (AAB for Google Play)

```powershell
eas build --platform android --profile production
```

1. Create the app in Play Console.
2. Open a closed testing track and upload the AAB by hand. The first release always needs a manual upload.
3. Add at least 12 testers who own real Android devices. They must opt in and stay opted in for 14 days.
4. Complete the store listing, the Data safety form, the content rating and the privacy policy URL.
5. Apply for production access after the 14 days. Then promote the release to production.

Play App Signing is on by default for new apps. Your EAS keystore acts as the upload key.

### Automated submission for later releases

`eas submit` needs a Google service account key.

1. In Play Console, open Setup, API access and create a service account with release permissions.
2. Download the JSON key. Save the file as `mobile/play-service-account.json`.
3. Add `play-service-account.json` to `mobile/.gitignore`. Never commit the file.
4. Update `eas.json`:

```json
"submit": {
  "production": {
    "android": {
      "serviceAccountKeyPath": "./play-service-account.json",
      "track": "internal"
    }
  }
}
```

5. Run `eas submit --platform android`.

## 7. iOS

A paid Apple Developer account is required for every iOS build. This includes preview, production and TestFlight builds. You do not need a Mac. EAS builds in the cloud.

The prompt "Do you want to log in to your Apple account?" changes nothing. Answer `n` and EAS asks again at the credentials step. Without a paid team, the build stops with "You have no team associated with your Apple account." Enroll first at developer.apple.com/programs/enroll. Check developer.apple.com/account for a Team ID before you retry.

### Prompts after login

1. Apple ID, password and 2FA code. Use the Apple ID enrolled in the program.
2. Team selection, if Apple lists more than one.
3. Register bundle ID `com.user.maxora`: `Y`.
4. Generate a new Apple Distribution Certificate: `Y`.
5. Generate a provisioning profile: `Y`.
6. Push Notifications: `n`. Maxora sends none.
7. Register a device: `Y` for preview builds.

### Preview build on your iPhone

```powershell
cd mobile
eas device:create
eas build --platform ios --profile preview
```

1. For `eas device:create`, choose the website option. Open the link in Safari on your iPhone and install the profile.
2. When the build finishes, open the build link on your iPhone and tap Install.
3. Go to Settings, Privacy & Security, Developer Mode. Turn the setting on and restart the phone.
4. Run the full test flow from section 6 on mobile data.

Each new test device needs registration and a fresh build.

### Production build and TestFlight

1. In App Store Connect, create the app with bundle ID `com.user.maxora`.
2. Build and submit:

```powershell
cd mobile
eas build --platform ios --profile production
eas submit --platform ios
```

3. Wait 10 to 30 minutes for Apple to process the build.
4. Add testers in TestFlight and run the full test flow.
5. Complete the store listing and privacy labels. Submit the build for App Store review.

Apple review takes 1 to 3 days. Expect at least one rejection and plan time for fixes.

Notes:

- EAS raises the build number on each production build, including failed runs. Failed runs cost nothing.
- The warning "Detected that your app uses Expo Go for development" is harmless. Silence the warning with `$env:EAS_BUILD_NO_EXPO_GO_WARNING="true"`.

## 8. Store listings

Both stores need:

- A public privacy policy URL.
- App icon, screenshots, short and long descriptions and a category.
- An age rating questionnaire. Answer honestly. Maxora targets adults.
- A data disclosure. Apple calls this privacy labels. Google calls this the Data safety form.

Declare these data types:

- Anonymous account identifier from Supabase Auth.
- Profile details from onboarding.
- Front and side face photos.
- Scan results, history and coaching chat content.
- Photos and prompts sent to Groq as a third-party processor.
- Purchase data from RevenueCat and Stripe.

Asset checklist:

- App Store icon: 1024x1024 PNG, no transparency.
- Google Play icon: 512x512 PNG.
- Google Play feature graphic: 1024x500.
- Phone screenshots for each store. Check the current size requirements in App Store Connect and Play Console.

Apple extras:

- Apple requires in-app account deletion when users create accounts. Confirm the guideline applies to anonymous accounts and test the flow.
- Add reviewer notes. Explain the anonymous sign-in and how to reach every feature.

Review risk for face-rating apps:

- Reviewers look closely at these apps.
- Provide a clear 18+ gate, a visible disclaimer that scores are estimates, photo and account deletion and a way to report bad AI output.
- Use self-improvement wording in the listing. Avoid wording that judges or ranks people.
- Test every one of these features in the real build before submission.

## 9. Billing and `TEST_MODE`

The README states the rule: set `TEST_MODE=false` only after real Stripe prices, Stripe webhooks and RevenueCat entitlements exist.

- Mobile store builds sell subscriptions through RevenueCat with Apple and Google billing. Apple requires in-app purchase for digital subscriptions sold inside an iOS app.
- Create subscription products in App Store Connect and Play Console. Connect them to RevenueCat entitlements.
- The backend must read the entitlement status your mobile purchases create.
- Read the backend code that checks `TEST_MODE`. Confirm what the flag bypasses. A free launch with `TEST_MODE=true` is acceptable only if the code still limits scans per user.

To switch:

1. Set `TEST_MODE=false` in Vercel for Production.
2. Redeploy the backend.
3. Run a full purchase test in a real build with a sandbox account.

Decide one thing early: launch free first or launch with subscriptions. A free launch removes billing review risk. Add billing in a later update.

## Troubleshooting

| Symptom                                         | Cause                                        | Fix                                                                       |
| ----------------------------------------------- | -------------------------------------------- | ------------------------------------------------------------------------- |
| Expo Go "request timed out" on mobile data      | Metro runs on your PC                        | Use `--tunnel` or install a preview build                                 |
| "No team associated with your Apple account"    | No paid Apple enrollment                     | Enroll in the Apple Developer Program                                     |
| "No environment variables found" for production | Production environment is empty              | Create the three variables (section 5)                                    |
| App shows API errors in a build                 | Placeholder or missing `EXPO_PUBLIC_API_URL` | Fix the variable and rebuild                                              |
| App crashes at launch in a build                | Missing variable or `purchases.js` init      | Check both. Read the EAS build logs. On Android, run `adb logcat`.        |
| APK does not install                            | Unknown sources blocked                      | Allow installs from your browser in Android settings                      |
| iOS preview build does not install              | Device not registered or Developer Mode off  | Run `eas device:create`, rebuild and turn on Developer Mode               |
| Vercel variable change has no effect            | Old deployment                               | Redeploy the project                                                      |
| `Debugger listening` lines in PowerShell        | Node inspector option in your environment    | Harmless. Run `$env:NODE_OPTIONS=""` to remove the lines for the session. |

## Command reference

```powershell
# Local development
cd backend
npm run dev -- --hostname 0.0.0.0
cd mobile
npx expo start
npx expo start --tunnel -c

# Checks
npx expo-doctor
npx expo install --check

# EAS setup
npm install -g eas-cli
eas login
eas env:list --environment preview
eas env:list --environment production

# Credentials and devices
eas credentials --platform android
eas device:create

# Android
eas build --platform android --profile preview
eas build --platform android --profile production
eas build:run --platform android --latest
eas submit --platform android

# iOS
eas build --platform ios --profile preview
eas build --platform ios --profile production
eas submit --platform ios
```
