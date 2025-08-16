# EduDash Pro Mobile — Android Build & Release Guide

This guide is written to be super simple — like packing your school bag.

## 0) Names and IDs
- App package (Android): `com.edudashpro.app`
- Firebase Android app: must match the package above
- File needed: `android/app/google-services.json` (you already placed it)

## 1) Environment variables (EAS)
Set these on Expo EAS (Project → Environment variables → production):

| Name | What it does | Example |
|---|---|---|
| EXPO_PUBLIC_SUPABASE_URL | Supabase URL | https://xxxx.supabase.co |
| EXPO_PUBLIC_SUPABASE_ANON_KEY | Supabase anon key | eyJh… |
| EXPO_PUBLIC_ADMOB_ANDROID_APP_ID | AdMob App ID | ca-app-pub-xxxxxxxx~yyyyyyyy |
| EXPO_PUBLIC_ADMOB_ANDROID_BANNER_UNIT_ID | Banner unit | ca-app-pub-xxxxxxxx/zzzzzzzz |
| EXPO_PUBLIC_ENABLE_ADS | Show ads or not | `true` (live) or `false` (off) |

Notes:
- App ID is baked into the build (manifest placeholder). Changing it requires a rebuild.
- Banner unit can be changed via env without code changes.

## 2) Push notifications (Firebase)
- You already added `google-services.json` in `android/app/`.
- The app asks permission and registers a token on start (best-effort setup in `app/_layout.tsx`).

## 3) AdMob (Family-friendly)
- In AdMob Console: mark the app for Families policy, set content rating to **G**.
- Keep `EXPO_PUBLIC_ENABLE_ADS=false` for review if you want zero risk; turn **true** when ready.
- The app renders a small banner at the bottom via `components/ui/AdPlacement.tsx`.

## 4) Build types — which one do I use?
Think of three buckets:

1) Development build (Fast refresh ON)
- One-time build of Dev Client you install on your phone
- Push: yes. Ads: test units. Fast refresh: yes.
- Command:
  ```bash
  eas build --platform android --profile development
  # after installing the dev client on your device:
  npx expo start --dev-client
  ```

2) Preview build (Release-like APK)
- Easy to install as APK, no store.
- Push: yes. Ads: live if env says true. Fast refresh: no.
- Command:
  ```bash
  eas build --platform android --profile preview
  ```

3) Production build (Play Console AAB)
- Upload to Play Internal/Closed/Production testing.
- Push: yes. Ads: live if env says true. Fast refresh: no.
- Command:
  ```bash
  eas build --platform android --profile production
  ```

> Tip: For quick sideload testing, you can also do a production APK build:
```bash
eas build --platform android --profile production-apk
```

## 5) Keystore (Keys)
- When prompted the first time: choose **Y** to generate.
- Keep the same keystore for all future builds of this package id.
- With Play App Signing enabled (recommended), this keystore becomes your upload key; Google manages the app signing key.
- Backup from EAS: Project → Credentials.

## 6) How do I know a build is successful?
- EAS Dashboard → Builds → status is **Finished** with a green check.
- The build page has an **Artifact**:
  - AAB for Play (production/preview), or APK (preview/production-apk/dev client).
- Logs end without errors.

## 7) Installing and testing
- APK: download from the build page and install on your Android device.
- AAB (Play testing): go to Play Console → Internal testing → upload AAB → add testers → share link.

## 8) Versioning
- EAS auto-increments `versionCode` for Android.
- Keep `expo.version` / `runtimeVersion` stable unless you intentionally change them.

## 9) Common switches
- Turn ads OFF for review:
  - Set `EXPO_PUBLIC_ENABLE_ADS=false` → rebuild.
- Turn ads ON for live:
  - Set `EXPO_PUBLIC_ENABLE_ADS=true` → rebuild.

## 10) Troubleshooting quick list
- Build asks for keystore → choose **Y** once. Later builds: no.
- Push not working → confirm `google-services.json` path and Firebase app id matches `com.edudashpro.app`.
- Ads not showing → ensure Family policy + `G` rating in AdMob, envs set, rebuild for App ID changes.
- Play rejection → minimize permissions (we already did), ensure privacy policy and Families policy.

## 11) Submission checklist (Play)
- AAB built with `production` profile
- Privacy Policy URL + Data Safety form done
- Families policy enabled in AdMob
- Screenshots, icon, feature graphic
- Internal testing first (recommended)

---

### Quick commands
```bash
# Dev client (fast refresh)
eas build --platform android --profile development
npx expo start --dev-client

# Preview (APK)
eas build --platform android --profile preview

# Production (AAB)
eas build --platform android --profile production

# Sideloadable production APK
eas build --platform android --profile production-apk
```

You’re good to go — keep this file as your go-to cheat sheet.
