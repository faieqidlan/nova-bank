# Nova Bank App

## For Evaluators

This is a React Native mobile application built with Expo and TypeScript, implementing a secure banking application with the following key features:

- User authentication with Firebase
- Biometric authentication for secure access
- Secure storage of sensitive data
- Secure account management

### Quickest Way to Evaluate

1. Install Expo Go on your mobile device:
   - [Android Play Store](https://play.google.com/store/apps/details?id=host.exp.exponent)
   - [iOS App Store](https://apps.apple.com/us/app/expo-go/id982107779)

2. Clone and set up the project:
```bash
git clone https://github.com/faieqidlan/nova-bank
cd nova-app
yarn install  # or npm install
cp .env.example .env
```

3. Add the following environment variables to the `.env` file:
   The app requires Firebase configuration. Please contact the developer to receive the necessary environment variables.
   The `.env` file should contain the following variables:
   ```
   FIREBASE_API_KEY=your_api_key
   FIREBASE_AUTH_DOMAIN=your_project_id.firebaseapp.com
   FIREBASE_PROJECT_ID=your_project_id
   FIREBASE_STORAGE_BUCKET=your_project_id.appspot.com
   FIREBASE_MESSAGING_SENDER_ID=your_sender_id
   FIREBASE_APP_ID=your_app_id
   ```

4. Start the development server:
```bash
npx expo start
```

5. Scan the QR code with your mobile device's Expo Go app

### Project Structure

```
src/
├── components/     # Reusable UI components
├── screens/        # Screen components
├── services/      # Business logic and API services
├── navigation/    # Navigation configuration
└── utils/         # Helper functions and utilities
```

A React Native mobile application built with Expo and TypeScript. The easiest way to test this app is using the Expo Go app on your mobile device.

## Quick Start with Expo Go

1. Install the Expo Go app on your mobile device:
   - [Android Play Store](https://play.google.com/store/apps/details?id=host.exp.exponent)
   - [iOS App Store](https://apps.apple.com/us/app/expo-go/id982107779)

2. Clone the repository:
```bash
git clone https://github.com/faieqidlan/nova-bank
cd nova-app
```

3. Install dependencies:
```bash
yarn install
# or
npm install
```

4. Start the development server:
```bash
npx expo start
```

5. Open the Expo Go app on your phone and scan the QR code that appears in your terminal or browser.

That's it! The app will load on your device and automatically update as you make changes to the code.

## Prerequisites

- [Node.js](https://nodejs.org/) (v16 or later)
- [Yarn](https://yarnpkg.com/) or [npm](https://www.npmjs.com/)
- [Expo Go](https://expo.dev/client) app on your mobile device
- A mobile device running:
  - Android 5 or higher
  - iOS 13 or higher

## Development Setup

1. Create a `.env` file:
```bash
cp .env.example .env
```
Then fill in the required environment variables in the `.env` file.
```
   FIREBASE_API_KEY=your_api_key
   FIREBASE_AUTH_DOMAIN=your_project_id.firebaseapp.com
   FIREBASE_PROJECT_ID=your_project_id
   FIREBASE_STORAGE_BUCKET=your_project_id.appspot.com
   FIREBASE_MESSAGING_SENDER_ID=your_sender_id
   FIREBASE_APP_ID=your_app_id
```

## Running the App

### Using Expo Go (Recommended)

1. Start the development server:
```bash
npx expo start
```

2. On your mobile device:
   - Open the Expo Go app
   - Scan the QR code shown in your terminal
   - The app will load automatically

### Using Emulators/Simulators (Alternative)

If you prefer to use emulators/simulators:

1. Install:
   - [Android Studio](https://developer.android.com/studio) for Android emulator
   - [Xcode](https://developer.apple.com/xcode/) for iOS simulator (macOS only)

2. Start the development server:
```bash
npx expo start
```

3. Press:
   - `a` to run on Android emulator
   - `i` to run on iOS simulator

## Useful Expo Commands

- Start the development server: `npx expo start`
- Clear the Metro bundler cache: `npx expo start --clear`
- Start in development mode: `npx expo start --dev-client`
- Start with tunnel connection: `npx expo start --tunnel`
- Start with LAN connection: `npx expo start --lan`
- Start with local connection: `npx expo start --localhost`

## Troubleshooting

### Expo Go Issues

1. If the app doesn't load:
   - Make sure your phone and computer are on the same network
   - Check if your firewall is blocking the connection
   - Try restarting the Expo Go app

2. If you see a blank screen:
   - Clear the Expo Go app cache
   - Restart the development server with `npx expo start --clear`

3. If the app crashes:
   - Check the error messages in the Expo Go app
   - Make sure all environment variables are set correctly
   - Verify that your Node.js version is compatible

### Development Environment Issues

1. If you encounter Metro bundler issues:
```bash
npx expo start --clear
```

2. If you have network issues:
   - Try using the Expo Go app's "Enter URL manually" option
   - The URL will be shown in your terminal (usually starts with `exp://`)
   - Try using tunnel connection: `npx expo start --tunnel`

### Biometric Authentication in Expo Go

When testing biometric authentication in Expo Go:
- On iOS devices, FaceID is not fully supported in Expo Go. The app will automatically fallback to using the device passcode for authentication.
- On Android devices, fingerprint authentication works normally in Expo Go.
- These limitations only apply to Expo Go. When building a development or production app, all biometric authentication methods will work as expected.

## Support

For additional support or to report issues, please create an issue in the repository.