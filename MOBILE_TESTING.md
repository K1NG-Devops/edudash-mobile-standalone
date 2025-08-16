# 📱 EduDash Pro - Mobile Device Testing Guide

## 🚀 Quick Start

You now have everything set up to test your EduDash Pro app on your physical device with live reloading! Here are your options:

### Option 1: Using Expo Go (Recommended for Development)

1. **Install Expo Go** on your Android device from the Google Play Store
2. **Start the development server:**
   ```bash
   npm start
   ```
3. **Connect your device:**
   - Make sure your device is on the same WiFi network as your computer
   - Scan the QR code with the Expo Go app
   - The app will load and you'll see live changes!

### Option 2: Using ADB (Direct Connection)

Since your device is already connected via ADB:

1. **Start the development server:**
   ```bash
   npm start
   ```
2. **In the terminal, press 'a'** to open on Android
3. Your device should be automatically detected and the app will install

### Option 3: Using Tunnel (For Network Issues)

If your device can't connect via local network:

1. **Start with tunnel:**
   ```bash
   npm run dev:tunnel
   ```
2. **Scan the QR code** with Expo Go app
3. This creates a secure tunnel to your development server

## 🔥 Live Development Features

### Hot Reload
- **JavaScript changes** reload automatically
- **No need to rebuild** for most changes
- **Instant feedback** on your device

### Development Menu
- **Shake your device** to open the developer menu
- **Options include:**
  - Reload
  - Debug JS Remotely
  - Enable Live Reload
  - Enable Hot Reloading

### Manual Controls
While the server is running, press:
- **'r'** - Reload the app
- **'d'** - Show developer menu
- **'j'** - Open debugger
- **'a'** - Open on Android device

## 🛠️ Available Scripts

| Command | Description |
|---------|-------------|
| `npm start` | Start development server |
| `npm run start:fresh` | Clear cache and start server |
| `npm run clear-cache` | Clear all caches |
| `npm run dev:tunnel` | Start with tunnel (for network issues) |
| `npm run android:local` | Try to build and run locally |

## 🧹 Cache Management

If you're seeing stale data:

1. **Clear app cache:**
   ```bash
   npm run clear-cache
   ```

2. **Restart with fresh cache:**
   ```bash
   npm run start:fresh
   ```

3. **On your device:** Shake → Reload

## 🔧 Troubleshooting

### App Won't Connect
- Ensure both devices are on the same WiFi network
- Try using tunnel mode: `npm run dev:tunnel`
- Check firewall settings on your computer

### Stale Data Issues
- Run `npm run clear-cache`
- In Expo Go: Settings → Clear Cache
- Restart the development server

### Build Issues
- Make sure Android SDK licenses are accepted
- Check that ADB can see your device: `adb devices`
- Try clearing Metro cache: `npx expo start --clear`

## 📱 Device Requirements

### Android
- Android 6.0+ (API level 23+)
- Expo Go app from Google Play Store
- USB debugging enabled (for ADB)
- Same WiFi network as development machine

### Development Machine
- Node.js and npm installed ✅
- Expo CLI ✅
- ADB working ✅
- Android SDK (optional for local builds)

## 🎯 Testing Your Fixes

1. **Start the server:** `npm start`
2. **Connect your device** via Expo Go
3. **Make a change** to any JavaScript file
4. **Watch it update** instantly on your device!

### Test the Cache Fixes
1. Sign in to your app
2. Navigate around the dashboard
3. Check that fresh data is loaded from the database
4. No stale/deleted data should appear

## 💡 Development Tips

- Keep the development server running while coding
- Use the device shake gesture to access developer tools
- JavaScript changes reload automatically
- Native changes (if any) require app restart
- Check the terminal for any error messages
- Use `console.log()` - logs appear in terminal

## 🎉 You're All Set!

Your EduDash Pro app is now ready for mobile testing with:
- ✅ Cache issues fixed
- ✅ Fresh data loading
- ✅ Hot reload enabled  
- ✅ Mobile development setup
- ✅ ADB connection working

**Happy coding! 🚀**
