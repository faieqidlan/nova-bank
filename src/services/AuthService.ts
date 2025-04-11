import { BiometricsService } from './BiometricsService';
import { FirebaseService } from './FirebaseService';
import { User } from '../types';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Storage keys for user credentials
const FIREBASE_USER_ID_KEY = 'firebase_user_id';
const FIREBASE_EMAIL_KEY = 'firebase_user_email';

/**
 * Service for handling user authentication
 */
export class AuthService {
  // In a real app, this would be fetched from a server
  private static readonly MOCK_API_SECRET = 'server_secret_key_12345';
  
  /**
   * Register a new user
   * @param email User email
   * @param password User password
   * @param name User name
   * @returns User object if successful
   */
  static async register(
    email: string,
    password: string,
    name: string
  ): Promise<{ user: User | null; error?: string }> {
    try {
      // Validate input
      if (!email || !password || !name) {
        return { user: null, error: 'All fields are required' };
      }

      // Register user with Firebase
      const { user, error } = await FirebaseService.registerUser(email, password, name);
      
      if (!user) {
        return { user: null, error: error || 'Registration failed' };
      }

      // Check if biometrics is available
      const { available } = await BiometricsService.isSensorAvailable();
      
      if (available) {
        // Create biometric keys and store the public key
        await this.setupBiometricKeys(user.id);
      } else {
        console.log('Biometrics not available for key generation');
      }

      return { user };
    } catch (error) {
      console.error('Registration error:', error);
      return { user: null, error: 'Registration failed. Please try again.' };
    }
  }

  /**
   * Login with email and password
   * @param email User email
   * @param password User password
   * @returns User object if successful
   */
  static async login(
    email: string,
    password: string
  ): Promise<{ user: User | null; error?: string }> {
    try {
      // Validate input
      if (!email || !password) {
        return { user: null, error: 'Email and password are required' };
      }

      // Sign in with Firebase
      const { user, error } = await FirebaseService.signInUser(email, password);
      
      if (!user) {
        return { user: null, error: error || 'Login failed' };
      }
      
      console.log('Login successful, storing user credentials', user.id);
      
      // Store user credentials in AsyncStorage for persistent login
      await AsyncStorage.setItem(FIREBASE_USER_ID_KEY, user.id);
      await AsyncStorage.setItem(FIREBASE_EMAIL_KEY, user.email);
      
      // Store additional user data if needed for biometric login
      const userData = JSON.stringify({
        id: user.id,
        email: user.email,
        name: user.name,
        lastLogin: new Date().toISOString()
      });
      
      console.log('Storing complete user data in AsyncStorage');
      await AsyncStorage.setItem('user_data', userData);
      
      // Check if biometrics is available
      const { available } = await BiometricsService.isSensorAvailable();
      
      if (available) {
        // Set up biometric keys if they don't exist
        await this.setupBiometricKeys(user.id);
        
        // Store credentials for biometric authentication
        console.log('Storing credentials for biometric authentication');
        await BiometricsService.storeCredentials(email, password);
      }

      return { user };
    } catch (error) {
      console.error('Login error:', error);
      return { user: null, error: 'Login failed. Please try again.' };
    }
  }

  /**
   * Set up biometric keys for a user
   * @param userId User ID
   */
  private static async setupBiometricKeys(userId: string): Promise<void> {
    try {
      // Check if biometric keys exist
      const { keysExist } = await BiometricsService.biometricKeysExist();
      
      if (!keysExist) {
        console.log('No biometric keys found, creating new keys');
        const { publicKey } = await BiometricsService.createKeys();
        
        if (publicKey) {
          // Store the public key in Firebase
          await FirebaseService.storePublicKey(userId, publicKey);
        } else {
          console.warn('Failed to generate public key');
        }
      } else {
        console.log('Biometric keys already exist');
        
        // Verify if the public key is stored in Firebase
        const storedKey = await FirebaseService.getPublicKey(userId);
        
        if (!storedKey) {
          // If key exists locally but not in Firebase, we should regenerate and store it
          console.log('Public key not found in Firebase, generating new keys');
          
          // Delete existing keys
          await BiometricsService.deleteKeys();
          
          // Create new keys
          const { publicKey } = await BiometricsService.createKeys();
          
          if (publicKey) {
            // Store the public key in Firebase
            await FirebaseService.storePublicKey(userId, publicKey);
          }
        }
      }
    } catch (error) {
      console.error('Error setting up biometric keys:', error);
    }
  }

  /**
   * Login with biometrics
   * @returns User object if successful
   */
  static async loginWithBiometrics(): Promise<{
    user: User | null;
    error?: string;
  }> {
    try {
      console.log('LoginWithBiometrics called');
      
      // Check if biometric authentication is available
      const biometricResult = await BiometricsService.isSensorAvailable();
      const { available, biometryType } = biometricResult;
      
      console.log(`BiometricResult: available=${available}, type=${biometryType}`);

      if (!available) {
        // For iOS, we'll attempt anyway since the detection may not be reliable
        if (Platform.OS === 'ios') {
          console.log('iOS device detected, attempting biometric authentication despite availability check');
        } else {
          return {
            user: null,
            error: 'Biometric authentication is not available on this device',
          };
        }
      }
      
      // Check if biometric keys exist before attempting authentication
      const { keysExist } = await BiometricsService.biometricKeysExist();
      if (!keysExist) {
        console.log('No biometric keys found, cannot authenticate with biometrics');
        return {
          user: null,
          error: 'Biometric authentication is not set up. Please login with email and password first.',
        };
      }
      
      // Get stored credentials without requiring another biometric prompt
      const storedCredentials = await BiometricsService.getStoredCredentials();
      
      if (!storedCredentials) {
        console.log('No stored credentials found');
        return {
          user: null,
          error: 'No stored credentials found. Please login with email and password first.',
        };
      }
      
      // Login with stored credentials
      const { email, password } = storedCredentials;
      console.log(`Attempting login with stored credentials for ${email}`);
      
      const { user, error } = await this.login(email, password);
      
      if (user) {
        console.log('Successfully authenticated using biometrics');
      } else {
        console.log('Failed to authenticate with stored credentials:', error);
      }
      
      return { user, error };
    } catch (error) {
      console.error('Biometric login error:', error);
      return {
        user: null,
        error: 'Biometric authentication failed. Please try again or login with your password.',
      };
    }
  }

  /**
   * Verify with biometrics (for revealing sensitive data)
   * @param promptMessage Message to show in biometric prompt
   * @returns Success status
   */
  static async verifyWithBiometrics(
    promptMessage: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      // Simple biometric prompt for verification
      const result = await BiometricsService.simplePrompt(promptMessage);
      return { 
        success: result.success, 
        error: result.error || undefined 
      };
    } catch (error) {
      console.error('Biometric verification error:', error);
      return { success: false, error: 'Verification failed. Please try again.' };
    }
  }

  /**
   * Logout the current user
   */
  static async logout(): Promise<void> {
    try {
      console.log('Logging out user, clearing all credentials');
      
      // Clear all stored credentials
      await AsyncStorage.removeItem(FIREBASE_USER_ID_KEY);
      await AsyncStorage.removeItem(FIREBASE_EMAIL_KEY);
      await AsyncStorage.removeItem('user_data');
      await AsyncStorage.removeItem('wasLoggedIn');
      
      // Sign out from Firebase
      await FirebaseService.signOutUser();
      
      console.log('User logged out successfully');
    } catch (error) {
      console.error('Logout error:', error);
    }
  }
} 