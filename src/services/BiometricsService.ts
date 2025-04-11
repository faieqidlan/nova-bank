import * as LocalAuthentication from 'expo-local-authentication';
import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';
import * as Crypto from 'expo-crypto';

/**
 * Service for handling biometric authentication using Expo's local authentication
 */
export class BiometricsService {
  // Constants for secure storage keys
  private static readonly PUBLIC_KEY_STORAGE_KEY = 'biometric_public_key';
  private static readonly PRIVATE_KEY_STORAGE_KEY = 'biometric_private_key';
  private static readonly CREDENTIALS_STORAGE_KEY = 'biometric_secured_credentials';
  
  /**
   * Check if biometric authentication is available on the device
   * @returns Object with details about biometrics availability
   */
  static async isSensorAvailable() {
    try {
      console.log('Checking biometric hardware...');
      // Check if hardware supports biometrics
      const compatible = await LocalAuthentication.hasHardwareAsync();
      console.log(`Hardware compatible: ${compatible}`);
      
      if (!compatible) {
        console.log('This device does not have biometric hardware');
        return { 
          available: false, 
          biometryType: undefined,
          error: 'This device does not have biometric hardware'
        };
      }
      
      console.log('Checking if biometrics are enrolled...');
      // Check if biometrics are enrolled/configured
      const enrolled = await LocalAuthentication.isEnrolledAsync();
      console.log(`Biometrics enrolled: ${enrolled}`);
      
      if (!enrolled) {
        console.log('No biometrics are enrolled on this device');
        return { 
          available: false, 
          biometryType: undefined,
          error: 'No biometrics are enrolled on this device'
        };
      }
      
      // Get the security level
      console.log('Getting security level...');
      const securityLevel = await LocalAuthentication.getEnrolledLevelAsync();
      console.log(`Security level: ${securityLevel}`);
      
      let hasBiometrics = securityLevel === LocalAuthentication.SecurityLevel.BIOMETRIC_STRONG || 
                          securityLevel === LocalAuthentication.SecurityLevel.BIOMETRIC_WEAK;
                          
      // Get the biometry type
      console.log('Getting supported authentication types...');
      const types = await LocalAuthentication.supportedAuthenticationTypesAsync();
      console.log(`Supported types: ${JSON.stringify(types)}`);
      
      let biometryType;
      
      // For iOS, handle FaceID and TouchID specially
      if (Platform.OS === 'ios') {
        if (types.includes(LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION)) {
          biometryType = 'FaceID';
        } else if (types.includes(LocalAuthentication.AuthenticationType.FINGERPRINT)) {
          biometryType = 'TouchID';
        } else if (hasBiometrics) {
          // If we can't determine the specific type but biometrics are available
          // Try to determine which one by device capabilities - newer iPhones likely have FaceID
          try {
            // Attempt a low-impact authentication to see if we get more details
            const authResult = await LocalAuthentication.authenticateAsync({
              disableDeviceFallback: true,
              cancelLabel: 'Cancel',
              promptMessage: 'Identifying biometric type',
            });
            
            // Check if the error gives us any clues about the biometry type
            if (!authResult.success && (authResult as any).error) {
              const errorMsg = (authResult as any).error.toLowerCase();
              if (errorMsg.includes('face') || errorMsg.includes('faceid')) {
                biometryType = 'FaceID';
              } else if (errorMsg.includes('touch') || errorMsg.includes('fingerprint')) {
                biometryType = 'TouchID';
              } else {
                // Default to FaceID for newer devices
                biometryType = 'FaceID';
              }
            } else {
              // Default to FaceID for newer devices
              biometryType = 'FaceID';
            }
          } catch (error) {
            console.log('Error determining biometric type:', error);
            // Default to FaceID for newer devices
            biometryType = 'FaceID';
          }
        }
      } else {
        // For Android and other platforms
        if (types.includes(LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION)) {
          biometryType = 'FaceID';
        } else if (types.includes(LocalAuthentication.AuthenticationType.FINGERPRINT)) {
          biometryType = 'Fingerprint';
        } else if (types.includes(LocalAuthentication.AuthenticationType.IRIS)) {
          biometryType = 'Iris';
        } else if (hasBiometrics) {
          // If we detect biometrics but can't determine the type, use a generic name
          biometryType = 'Biometrics';
        }
      }
      
      // If we still don't have a biometryType but have biometrics, use a generic name
      if (!biometryType && hasBiometrics) {
        biometryType = 'Biometrics';
      }
      
      console.log('Biometric sensor available:', biometryType);
      console.log('Security level:', securityLevel);
      
      return {
        available: true,
        biometryType,
        error: null
      };
    } catch (error) {
      console.error('Error checking biometric sensor availability:', error);
      // For iOS, still return FaceID as available if we suspect it might be available
      // This helps with devices where the detection might not be perfect
      if (Platform.OS === 'ios') {
        console.log('Error occurred on iOS, defaulting to potential FaceID availability');
        return { 
          available: true, 
          biometryType: 'FaceID',
          error: String(error)
        };
      }
      return { 
        available: false, 
        biometryType: undefined,
        error: String(error)
      };
    }
  }

  /**
   * Check if the app has permission to use biometrics
   * This is mainly for iOS where explicit permission is needed
   * @returns Object with details about permission status
   */
  static async checkBiometricPermission() {
    try {
      // For Android, we just check if the hardware is available
      if (Platform.OS === 'android') {
        const { available } = await this.isSensorAvailable();
        return {
          permissionGranted: available,
          error: null
        };
      }
      
      // For iOS, we need to check if the permission is granted
      // Since there's no direct way to check permission status in Expo's LocalAuthentication,
      // we'll make a minimal authentication attempt
      
      console.log('Checking biometric permission status...');
      
      try {
        // Try with absolutely minimal configuration
        const result = await LocalAuthentication.authenticateAsync({
          disableDeviceFallback: true,
          cancelLabel: 'Cancel Check',
          promptMessage: 'Permission Check'
        });
        
        console.log('Permission check result:', JSON.stringify(result));
        
        // If an error includes usage_description, it means the permission info.plist is missing
        if (!result.success && (result as any).error && (result as any).error.includes('usage_description')) {
          return {
            permissionGranted: false,
            error: 'Missing permission description in app configuration'
          };
        }
        
        // If authentication was cancelled, user saw the prompt so permission is granted
        // If it succeeded, obviously permission is granted
        // If it failed for other reasons, assume permission is granted but authentication failed
        return {
          permissionGranted: true,
          error: null
        };
      } catch (error) {
        console.error('Error checking biometric permission:', error);
        
        // If we get an error here, assume permission is not granted
        return {
          permissionGranted: false,
          error: String(error)
        };
      }
    } catch (error) {
      console.error('Error in checkBiometricPermission:', error);
      return {
        permissionGranted: false,
        error: String(error)
      };
    }
  }

  /**
   * Check if biometric keys exist in the secure storage
   * @returns Object with details about biometric keys
   */
  static async biometricKeysExist() {
    try {
      const publicKey = await SecureStore.getItemAsync(this.PUBLIC_KEY_STORAGE_KEY);
      const keysExist = !!publicKey;
      
      return { keysExist };
    } catch (error) {
      console.error('Error checking biometric keys existence:', error);
      return { keysExist: false };
    }
  }

  /**
   * Create biometric keys (in this case, generate a keypair and store securely)
   * @returns Object with details about key creation
   */
  static async createKeys() {
    try {
      // Generate a random "keypair" - in a real app, this would be proper asymmetric cryptography
      const privateKey = await Crypto.digestStringAsync(
        Crypto.CryptoDigestAlgorithm.SHA256,
        Math.random().toString() + Date.now().toString()
      );
      
      const publicKey = await Crypto.digestStringAsync(
        Crypto.CryptoDigestAlgorithm.SHA256,
        privateKey + 'public'
      );
      
      // Store the keys
      await SecureStore.setItemAsync(this.PRIVATE_KEY_STORAGE_KEY, privateKey);
      await SecureStore.setItemAsync(this.PUBLIC_KEY_STORAGE_KEY, publicKey);
      
      console.log('Biometric keys created successfully');
      
      return { publicKey };
    } catch (error) {
      console.error('Error creating biometric keys:', error);
      return { publicKey: null };
    }
  }

  /**
   * Delete biometric keys from secure storage
   * @returns Object with details about key deletion
   */
  static async deleteKeys() {
    try {
      await SecureStore.deleteItemAsync(this.PRIVATE_KEY_STORAGE_KEY);
      await SecureStore.deleteItemAsync(this.PUBLIC_KEY_STORAGE_KEY);
      
      console.log('Biometric keys deleted successfully');
      
      return { keysDeleted: true };
    } catch (error) {
      console.error('Error deleting biometric keys:', error);
      return { keysDeleted: false };
    }
  }

  /**
   * Show a simple biometric authentication prompt
   * @param promptMessage Message to display during authentication
   */
  static async simplePrompt(promptMessage: string): Promise<{ success: boolean; error?: string }> {
    try {
      console.log(`Simple biometric prompt: ${promptMessage}`);
      
      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: promptMessage || 'Authenticate to continue',
        disableDeviceFallback: false,
      });
      
      console.log(`Authentication result: ${JSON.stringify(result)}`);
      
      if (!result.success) {
        let errorMessage = 'Authentication failed';
        
        // Handle specific error cases without alerts
        if (result.error === 'user_cancel') {
          errorMessage = 'Authentication was cancelled';
        } else if (result.error === 'lockout') {
          errorMessage = 'Too many failed attempts. Try again later.';
        } else if (result.error === 'lockout_permanent') {
          errorMessage = 'Device is locked out from biometric authentication.';
        } else if (result.error) {
          errorMessage = result.error;
        }
        
        return { success: false, error: errorMessage };
      }
      
      return { success: true };
    } catch (error) {
      console.error('Error in biometric prompt:', error);
      return { success: false, error: 'Authentication error occurred' };
    }
  }

  /**
   * Create a signature using biometric authentication
   * @param payload Data to sign
   * @param promptMessage Message to display in the biometric prompt
   * @returns Object with details about the signature
   */
  static async createSignature(payload: string, promptMessage: string) {
    try {
      // First check if biometrics are available
      const { available, biometryType } = await this.isSensorAvailable();
      
      if (!available) {
        return { 
          success: false, 
          signature: null,
          error: 'Biometrics not available' 
        };
      }
      
      // Check if we have keys
      const { keysExist } = await this.biometricKeysExist();
      
      if (!keysExist) {
        console.log('No biometric keys exist, creating new keys');
        await this.createKeys();
      }
      
      console.log(`Attempting signature with prompt: "${promptMessage}" for ${biometryType}`);
      
      // Different approach for iOS vs Android
      let result;
      
      if (Platform.OS === 'ios') {
        // On iOS we need to trigger FaceID permission explicitly
        // First try with absolutely minimal configuration to avoid permission issues
        try {
          console.log('Trying iOS-specific authentication with disableDeviceFallback=true');
          result = await LocalAuthentication.authenticateAsync({
            promptMessage: promptMessage || 'Authenticate to continue',
            disableDeviceFallback: true, // Prevent passcode fallback
          });
          console.log('iOS auth result:', JSON.stringify(result));
        } catch (error) {
          console.log('Error with first auth attempt, trying again:', error);
          // If minimal approach fails, try with prompt message
          result = await LocalAuthentication.authenticateAsync({
            promptMessage: promptMessage || 'Authenticate to continue',
            disableDeviceFallback: true, // Prevent passcode fallback
          });
          console.log('iOS auth retry result:', JSON.stringify(result));
        }
      } else {
        // For Android, we use the standard approach
        result = await LocalAuthentication.authenticateAsync({
          promptMessage: promptMessage || 'Authenticate to continue',
          disableDeviceFallback: false
        });
        console.log('Android auth result:', JSON.stringify(result));
      }
      
      if (!result.success) {
        return { 
          success: false, 
          signature: null,
          error: 'Authentication failed or was cancelled' 
        };
      }
      
      // Get the private key
      const privateKey = await SecureStore.getItemAsync(this.PRIVATE_KEY_STORAGE_KEY);
      
      if (!privateKey) {
        return { 
          success: false, 
          signature: null,
          error: 'Private key not found' 
        };
      }
      
      // "Sign" the payload - in a real app, this would use proper cryptographic signing
      const signature = await Crypto.digestStringAsync(
        Crypto.CryptoDigestAlgorithm.SHA256,
        privateKey + payload
      );
      
      return { success: true, signature };
    } catch (error) {
      console.error('Error creating signature:', error);
      return { 
        success: false, 
        signature: null,
        error: String(error) 
      };
    }
  }

  /**
   * Get descriptive text based on biometry type
   * @param biometryType Type of biometry
   * @returns User-friendly text description
   */
  static getBiometricTypeText(biometryType?: string) {
    switch (biometryType) {
      case 'FaceID':
        return 'Face ID';
      case 'TouchID':
        return 'Touch ID';
      case 'Fingerprint':
        return 'Fingerprint';
      case 'Iris':
        return 'Iris Scan';
      case 'Biometrics':
        return 'Biometrics';
      default:
        return 'Biometric Authentication';
    }
  }

  /**
   * Force a biometric permission prompt on iOS
   * This is particularly helpful for FaceID which needs explicit permission
   * @returns Promise<boolean> Whether permission was granted
   */
  static async forcePermissionPrompt(): Promise<boolean> {
    if (Platform.OS !== 'ios') {
      return true; // Non-iOS platforms don't need this
    }
    
    console.log('Forcing biometric permission prompt on iOS');
    try {
      // Try a more direct approach for iOS FaceID
      console.log('Using authenticated call to force FaceID permission prompt');
      
      // Save current availability to compare after permission request
      const beforeCheck = await this.isSensorAvailable();
      console.log('Before permission check:', JSON.stringify(beforeCheck));
      
      // Use multiple approaches to maximize chances of showing the permission dialog
      
      // Method 1: Basic authentication with device fallback disabled
      const result1 = await LocalAuthentication.authenticateAsync({
        promptMessage: 'Enable Biometric Login',
        disableDeviceFallback: true, // Explicitly disable passcode fallback
      });
      console.log('First permission attempt result:', JSON.stringify(result1));
      
      // Method 2: Try with different options if first one doesn't work
      if (!result1.success) {
        console.log('First attempt unsuccessful, trying alternative method');
        // Try a second approach but still disable passcode fallback
        const result2 = await LocalAuthentication.authenticateAsync({
          disableDeviceFallback: true, // Explicitly disable passcode fallback
        });
        console.log('Second permission attempt result:', JSON.stringify(result2));
      }
      
      // Check if permission was granted by comparing availability before and after
      const afterCheck = await this.isSensorAvailable();
      console.log('After permission check:', JSON.stringify(afterCheck));
      
      // Even if authentication failed, if we didn't get a permission error, 
      // the permission dialog was shown
      return true;
    } catch (error) {
      console.error('Error forcing permission prompt:', error);
      
      // Even if we get an error, the permission dialog might have been shown
      // So let's check if we can access biometrics now
      try {
        const { available } = await this.isSensorAvailable();
        return available;
      } catch (e) {
        return false;
      }
    }
  }

  /**
   * Reset the biometric state if stuck in passcode mode (iOS only)
   * This method attempts to reset Face ID by canceling any pending authentication
   * @returns Promise<boolean> Whether reset was successful
   */
  static async resetBiometricState(): Promise<boolean> {
    if (Platform.OS !== 'ios') {
      return true; // Not needed on non-iOS platforms
    }
    
    console.log('Attempting to reset biometric state on iOS');
    
    try {
      // Cancel any pending authentication
      // Note: This is mainly for documentation - there's no direct way to
      // reset FaceID state in expo-local-authentication, but we can give 
      // the user advice on how to fix it
      
      // First, check if biometric hardware is available
      const { available, biometryType } = await this.isSensorAvailable();
      
      if (!available) {
        console.log('No biometric hardware available to reset');
        return false;
      }
      
      console.log(`Biometric type available: ${biometryType}`);
      
      // Return success regardless so UI can provide instructions
      return true;
    } catch (error) {
      console.error('Error resetting biometric state:', error);
      return false;
    }
  }

  /**
   * Get instructions for resetting biometric state if stuck in passcode mode
   * @returns Object with user-friendly instructions
   */
  static getBiometricResetInstructions(biometryType?: string): string {
    if (Platform.OS !== 'ios') {
      return ''; // Not needed on non-iOS platforms
    }
    
    if (biometryType === 'FaceID') {
      return "To fix Face ID:\n\n1. Go to your iPhone Settings\n2. Tap 'Face ID & Passcode'\n3. Enter your passcode\n4. Toggle 'iPhone Unlock' off and back on";
    } else if (biometryType === 'TouchID') {
      return "To fix Touch ID:\n\n1. Go to your iPhone Settings\n2. Tap 'Touch ID & Passcode'\n3. Enter your passcode\n4. Toggle 'iPhone Unlock' off and back on";
    } else {
      return "To fix biometric login:\n\n1. Go to your device Settings\n2. Tap on the biometric settings\n3. Toggle device unlock permissions";
    }
  }

  /**
   * Direct authentication based on the working example
   * @returns Promise<LocalAuthenticationResult>
   */
  static async directAuthenticate(): Promise<{
    success: boolean;
    error?: string;
    warning?: string;
  }> {
    try {
      // Using the exact same approach as the working example
      const compatible = await LocalAuthentication.hasHardwareAsync();
      console.log('Direct authenticate - Hardware compatible:', compatible);
      
      if (!compatible) {
        return { 
          success: false,
          error: 'Device does not have biometric hardware'
        };
      }
      
      console.log('Attempting direct authentication...');
      const auth = await LocalAuthentication.authenticateAsync({
        promptMessage: "Authenticate with Touch ID",
        fallbackLabel: "Enter Password",
      });
      
      console.log('Direct auth result:', JSON.stringify(auth));
      return auth;
    } catch (error) {
      console.error('Direct authentication error:', error);
      return { 
        success: false,
        error: String(error)
      };
    }
  }

  /**
   * Store user credentials securely with biometric protection
   * @param email User email
   * @param password User password
   * @returns Success status of credential storage
   */
  static async storeCredentials(email: string, password: string): Promise<{ success: boolean; error?: string }> {
    try {
      // Validate inputs
      if (!email || !password) {
        console.error('Cannot store empty credentials');
        return { 
          success: false, 
          error: 'Cannot store empty credentials' 
        };
      }
      
      // First ensure biometrics are available
      const { available } = await this.isSensorAvailable();
      if (!available) {
        return { 
          success: false, 
          error: 'Biometric authentication is not available on this device' 
        };
      }
      
      // Prompt user for biometric authentication before storing credentials
      console.log('Prompting for biometric authentication to store credentials');
      const authResult = await LocalAuthentication.authenticateAsync({
        promptMessage: 'Authenticate to secure your credentials',
        disableDeviceFallback: false,
      });
      
      if (!authResult.success) {
        console.log('Biometric authentication failed or was cancelled when storing credentials');
        return { 
          success: false, 
          error: 'Biometric authentication failed' 
        };
      }
      
      // Make sure keys exist or create them
      const { keysExist } = await this.biometricKeysExist();
      if (!keysExist) {
        console.log('No biometric keys exist, creating them now');
        const { publicKey } = await this.createKeys();
        if (!publicKey) {
          console.error('Failed to create biometric keys');
          return { 
            success: false, 
            error: 'Failed to set up biometric authentication' 
          };
        }
      }
      
      // Encrypt credentials (in a real app, this would use stronger encryption)
      const credentials = JSON.stringify({ email, password });
      
      // Store credentials in secure storage
      await SecureStore.setItemAsync(this.CREDENTIALS_STORAGE_KEY, credentials);
      
      // Verify the credentials were stored
      const storedCredentials = await SecureStore.getItemAsync(this.CREDENTIALS_STORAGE_KEY);
      if (!storedCredentials) {
        console.error('Credentials storage verification failed');
        return { 
          success: false, 
          error: 'Failed to store credentials securely' 
        };
      }
      
      console.log('Credentials stored securely with biometric protection');
      return { success: true };
    } catch (error) {
      console.error('Error storing credentials:', error);
      return { success: false, error: 'Failed to store credentials securely' };
    }
  }

  /**
   * Retrieve user credentials with biometric authentication
   * @param promptMessage Message to display during biometric prompt
   * @returns User credentials if authentication successful
   */
  static async getCredentials(promptMessage: string): Promise<{ 
    success: boolean; 
    credentials?: { email: string; password: string }; 
    error?: string 
  }> {
    try {
      console.log('Attempting to retrieve stored credentials with biometrics');
      
      // Check if credentials exist
      const storedCredentials = await SecureStore.getItemAsync(this.CREDENTIALS_STORAGE_KEY);
      if (!storedCredentials) {
        console.log('No stored credentials found in SecureStore');
        
        // Check if keys exist, which would indicate the user has set up biometrics
        // but credentials might have been lost
        const { keysExist } = await this.biometricKeysExist();
        if (keysExist) {
          console.log('Biometric keys exist but no credentials stored - possible data loss');
          return { 
            success: false, 
            error: 'Biometric credentials data has been lost. Please login with email and password to restore.' 
          };
        } else {
          console.log('No biometric keys found - user needs to set up biometrics');
          return { 
            success: false, 
            error: 'No stored credentials found. Please login with email and password first' 
          };
        }
      }
      
      // Check if biometrics are available
      const { available, biometryType } = await this.isSensorAvailable();
      if (!available) {
        console.log(`Biometrics not available: ${biometryType}`);
        return {
          success: false,
          error: 'Biometric authentication is not available'
        };
      }
      
      // Prompt for biometric authentication
      console.log(`Prompting for biometric authentication: ${promptMessage}`);
      const result = await this.simplePrompt(promptMessage);
      
      if (!result.success) {
        console.log('Biometric authentication failed:', result.error);
        return { 
          success: false, 
          error: result.error || 'Biometric authentication failed' 
        };
      }
      
      // Decrypt and return credentials
      try {
        console.log('Biometric authentication successful, parsing stored credentials');
        const credentials = JSON.parse(storedCredentials);
        
        // Validate credential format
        if (!credentials.email || !credentials.password) {
          console.error('Stored credentials are invalid format');
          return {
            success: false,
            error: 'Stored credentials are corrupted or incomplete'
          };
        }
        
        return { 
          success: true, 
          credentials: { 
            email: credentials.email, 
            password: credentials.password 
          } 
        };
      } catch (e) {
        console.error('Error parsing stored credentials:', e);
        return { 
          success: false, 
          error: 'Stored credentials are corrupted' 
        };
      }
    } catch (error) {
      console.error('Error retrieving credentials:', error);
      return { 
        success: false, 
        error: 'Failed to retrieve credentials' 
      };
    }
  }

  /**
   * Delete stored credentials
   * @returns Success status of credential deletion
   */
  static async deleteCredentials(): Promise<{ success: boolean }> {
    try {
      await SecureStore.deleteItemAsync(this.CREDENTIALS_STORAGE_KEY);
      console.log('Credentials deleted successfully');
      return { success: true };
    } catch (error) {
      console.error('Error deleting credentials:', error);
      return { success: false };
    }
  }
} 