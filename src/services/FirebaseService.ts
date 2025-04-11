import { initializeApp } from 'firebase/app';
import { 
  getAuth, 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  signOut,
  User as FirebaseUser,
  UserCredential,
  setPersistence, 
  browserLocalPersistence
} from 'firebase/auth';
import {
  getFirestore,
  doc,
  setDoc,
  getDoc,
  updateDoc,
  collection,
  Timestamp
} from 'firebase/firestore';
import { User } from '../types';
import { firebaseConfig } from '../config/firebase';
import { Platform } from 'react-native';

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Use standard auth - we'll handle persistence via AsyncStorage
const auth = getAuth(app);

// If on web, enable persistence
if (Platform.OS === 'web') {
  setPersistence(auth, browserLocalPersistence)
    .catch((error) => {
      console.error('Error setting auth persistence:', error);
    });
}

const db = getFirestore(app);

/**
 * Service for handling Firebase operations
 */
export class FirebaseService {
  /**
   * Register a new user with Firebase
   * @param email User email
   * @param password User password
   * @param name User name
   * @returns Firebase user if successful
   */
  static async registerUser(
    email: string,
    password: string,
    name: string
  ): Promise<{ user: User | null; error?: string }> {
    try {
      // Create user account
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const firebaseUser = userCredential.user;
      
      // Create user profile document
      const user = await this.createUserProfile(firebaseUser, { name });
      
      return { user };
    } catch (error: any) {
      console.error('Firebase registration error:', error);
      return { 
        user: null, 
        error: this.getErrorMessage(error) 
      };
    }
  }

  /**
   * Sign in a user with Firebase
   * @param email User email
   * @param password User password
   * @returns Firebase user if successful
   */
  static async signInUser(
    email: string,
    password: string
  ): Promise<{ user: User | null; error?: string }> {
    try {
      // Sign in user
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const firebaseUser = userCredential.user;
      
      // Get user profile
      const user = await this.getUserProfile(firebaseUser.uid);
      
      if (!user) {
        throw new Error('User profile not found');
      }
      
      return { user };
    } catch (error: any) {
      console.error('Firebase sign in error:', error);
      return { 
        user: null, 
        error: this.getErrorMessage(error) 
      };
    }
  }

  /**
   * Sign out the current user
   */
  static async signOutUser(): Promise<void> {
    try {
      await signOut(auth);
    } catch (error) {
      console.error('Firebase sign out error:', error);
    }
  }

  /**
   * Get the current Firebase user
   * @returns Current Firebase user
   */
  static getCurrentUser(): FirebaseUser | null {
    return auth.currentUser;
  }

  /**
   * Create a user profile document in Firestore
   * @param firebaseUser Firebase user
   * @param additionalData Additional data to store (name, etc.)
   * @returns User profile
   */
  static async createUserProfile(
    firebaseUser: FirebaseUser,
    additionalData: { name: string }
  ): Promise<User> {
    const userRef = doc(db, 'users', firebaseUser.uid);
    
    const userProfile: User = {
      id: firebaseUser.uid,
      email: firebaseUser.email || '',
      name: additionalData.name,
      isAuthenticated: true,
      createdAt: Timestamp.now()
    };
    
    // Create the user document
    await setDoc(userRef, userProfile);
    
    return userProfile;
  }

  /**
   * Get a user profile from Firestore
   * @param userId User ID
   * @returns User profile
   */
  static async getUserProfile(userId: string): Promise<User | null> {
    try {
      const userRef = doc(db, 'users', userId);
      const userSnap = await getDoc(userRef);
      
      if (userSnap.exists()) {
        return userSnap.data() as User;
      } else {
        return null;
      }
    } catch (error) {
      console.error('Error getting user profile:', error);
      return null;
    }
  }

  /**
   * Store public key for biometric authentication
   * @param userId User ID
   * @param publicKey Public key
   */
  static async storePublicKey(userId: string, publicKey: string): Promise<void> {
    try {
      const userRef = doc(db, 'users', userId);
      
      await updateDoc(userRef, {
        biometricPublicKey: publicKey,
        biometricKeyUpdatedAt: Timestamp.now()
      });
      
      console.log('Public key stored in Firebase');
    } catch (error) {
      console.error('Error storing public key:', error);
    }
  }

  /**
   * Get public key for biometric authentication
   * @param userId User ID
   * @returns Public key
   */
  static async getPublicKey(userId: string): Promise<string | null> {
    try {
      const user = await this.getUserProfile(userId);
      return user?.biometricPublicKey || null;
    } catch (error) {
      console.error('Error getting public key:', error);
      return null;
    }
  }

  /**
   * Verify signature using public key (would normally be server-side)
   * @param userId User ID
   * @param signature Signature to verify
   * @param payload Original payload that was signed
   * @returns Whether signature is valid
   */
  static async verifySignature(
    userId: string,
    signature: string,
    payload: string
  ): Promise<boolean> {
    try {
      // In a real app, this would be a server-side API call to verify the signature
      // For this demo, we'll just simulate success
      console.log(`Verifying signature for user ${userId}`);
      console.log(`Signature: ${signature.substring(0, 20)}...`);
      console.log(`Payload: ${payload}`);
      
      // Get the user to ensure they exist
      const user = await this.getUserProfile(userId);
      return !!user;
    } catch (error) {
      console.error('Error verifying signature:', error);
      return false;
    }
  }

  /**
   * Get a user-friendly error message from Firebase error
   * @param error Firebase error
   * @returns User-friendly error message
   */
  private static getErrorMessage(error: any): string {
    const errorCode = error.code;
    
    switch (errorCode) {
      case 'auth/email-already-in-use':
        return 'Email already registered';
      case 'auth/invalid-email':
        return 'Invalid email address';
      case 'auth/weak-password':
        return 'Password too weak';
      case 'auth/user-not-found':
      case 'auth/wrong-password':
        return 'Invalid email or password';
      case 'auth/too-many-requests':
        return 'Too many attempts, try again later';
      default:
        return 'Authentication error';
    }
  }

  /**
   * Update a user's profile information
   * @param userId User ID
   * @param profileData Profile data to update
   * @returns Updated user if successful
   */
  static async updateUserProfile(
    userId: string,
    profileData: Partial<User>
  ): Promise<{ user: User | null; error?: string }> {
    try {
      const userRef = doc(db, 'users', userId);
      
      // Remove id and authentication status from updates for security
      const { id, isAuthenticated, ...updateData } = profileData;
      
      // Add timestamp for last update
      const dataToUpdate = {
        ...updateData,
        updatedAt: Timestamp.now()
      };
      
      // Update the document
      await updateDoc(userRef, dataToUpdate);
      
      // Get the updated user profile
      const updatedUser = await this.getUserProfile(userId);
      
      return { user: updatedUser };
    } catch (error: any) {
      console.error('Error updating user profile:', error);
      return { 
        user: null, 
        error: this.getErrorMessage(error) 
      };
    }
  }
} 