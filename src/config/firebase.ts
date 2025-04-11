// Firebase configuration
// Replace with your actual Firebase project configuration
export const firebaseConfig = {
  apiKey: "AIzaSyBqZtEPUbSYZ3YBlAPVBBzqp9_4Ozhhqdk",
  authDomain: "nova-7ecd8.firebaseapp.com",
  projectId: "nova-7ecd8",
  storageBucket: "nova-7ecd8.firebasestorage.app",
  messagingSenderId: "222630473797",
  appId: "1:222630473797:web:6a0c6999cb0062be0d332c"
};

/**
 * Instructions for setting up Firebase:
 * 
 * 1. Go to https://console.firebase.google.com
 * 2. Create a new project or select an existing one
 * 3. Add a web app to your project
 * 4. Copy the configuration values and paste them above
 * 5. Enable Authentication:
 *    - Go to Authentication > Sign-in method
 *    - Enable Email/Password authentication
 * 6. Enable Firestore Database:
 *    - Go to Firestore Database > Create database
 *    - Start in test mode or with specific security rules
 * 7. Set up security rules for Firestore:
 *    - Basic rules to allow authenticated users to read/write their own data:
 *      ```
 *      rules_version = '2';
 *      service cloud.firestore {
 *        match /databases/{database}/documents {
 *          match /users/{userId} {
 *            allow read, write: if request.auth != null && request.auth.uid == userId;
 *          }
 *        }
 *      }
 *      ```
 */ 