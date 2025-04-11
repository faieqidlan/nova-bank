import React, { createContext, useState, useContext, useEffect, ReactNode } from 'react';
import { AuthService } from '../services/AuthService';
import { BiometricsService } from '../services/BiometricsService';
import { FirebaseService } from '../services/FirebaseService';
import { AuthStatus, User } from '../types';
import { Platform, Alert } from 'react-native';
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import { useAuthPersistence } from '../hooks/useAuthPersistence';
import * as LocalAuthentication from 'expo-local-authentication';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface AuthContextType {
  user: User | null;
  authStatus: AuthStatus;
  authenticateWithBiometrics: () => Promise<boolean>;
  authenticateWithCredentials: (email: string, password: string) => Promise<boolean>;
  registerUser: (email: string, password: string, name: string) => Promise<boolean>;
  updateUserProfile: (profileData: Partial<User>) => Promise<boolean>;
  logout: () => void;
  isBiometricSupported: boolean;
  biometricType: string;
  biometricTypeName: string;
  revealSensitiveData: () => Promise<boolean>;
  isDataRevealed: boolean;
  toggleDataVisibility: () => void;
  checkBiometricPermission: () => Promise<boolean>;
  showBiometricEnrollment: boolean;
  handleBiometricEnrollmentDecision: (shouldEnroll: boolean) => Promise<void>;
  error: string | null;
  clearError: () => void;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Get Firebase auth instance
const auth = getAuth();

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [authStatus, setAuthStatus] = useState<AuthStatus>('idle');
  const [isBiometricSupported, setIsBiometricSupported] = useState<boolean>(false);
  const [biometricType, setBiometricType] = useState<string>('');
  const [isDataRevealed, setIsDataRevealed] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  
  const { clearLoginStatus, setUserLoggedIn } = useAuthPersistence();

  // Add state for biometric enrollment prompt
  const [showBiometricEnrollment, setShowBiometricEnrollment] = useState<boolean>(false);
  const [pendingCredentials, setPendingCredentials] = useState<{email: string, password: string} | null>(null);

  useEffect(() => {
    // Check for biometric support
    checkBiometricSupport();
    
    // Set up Firebase auth state listener
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        // User is signed in, get their profile from Firestore
        const userProfile = await FirebaseService.getUserProfile(firebaseUser.uid);
        
        if (userProfile) {
          setUser(userProfile);
          setAuthStatus('authenticated');
        } else {
          // User is authenticated but no profile exists
          setAuthStatus('unauthenticated');
        }
      } else {
        // User is signed out
        setUser(null);
        setAuthStatus('unauthenticated');
      }
      
      // Set loading to false after auth state is determined
      setIsLoading(false);
    });
    
    // Clean up the listener when the component unmounts
    return () => unsubscribe();
  }, []);

  const checkBiometricSupport = async () => {
    try {
      console.log('Checking biometric support...');
      
      // Check if hardware is available first
      const hasHardware = await LocalAuthentication.hasHardwareAsync();
      console.log('Has hardware support:', hasHardware);
      
      if (hasHardware) {
        // Check if biometrics are enrolled
        const isEnrolled = await LocalAuthentication.isEnrolledAsync();
        console.log('Is enrolled:', isEnrolled);
        
        if (isEnrolled) {
          // If hardware and enrollment are available, check security level
          const securityLevel = await LocalAuthentication.getEnrolledLevelAsync();
          console.log('Security level:', securityLevel);
          
          // Check supported authentication types
          const supportedTypes = await LocalAuthentication.supportedAuthenticationTypesAsync();
          console.log('Supported types:', supportedTypes);
          
          // Map numeric types to readable names for better logging
          const readableTypes = supportedTypes.map(type => {
            switch (type) {
              case LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION:
                return 'FACIAL_RECOGNITION';
              case LocalAuthentication.AuthenticationType.FINGERPRINT:
                return 'FINGERPRINT';
              case LocalAuthentication.AuthenticationType.IRIS:
                return 'IRIS';
              default:
                return `UNKNOWN_TYPE(${type})`;
            }
          });
          console.log('Readable supported types:', readableTypes);
        }
      }
      
      // Use the enhanced BiometricsService method for more accurate detection
      const { available, biometryType, error: bioError } = await BiometricsService.isSensorAvailable();
      
      console.log(`Biometric support: available=${available}, type=${biometryType}`);
      
      setIsBiometricSupported(available);

      if (available && biometryType) {
        setBiometricType(biometryType);
        console.log(`Biometric type set to: ${biometryType}`);
        
        // For FaceID on iOS, try to ensure permissions are set up early
        if (Platform.OS === 'ios' && biometryType === 'FaceID') {
          console.log('FaceID detected on iOS, checking permission status');
          const { permissionGranted } = await BiometricsService.checkBiometricPermission();
          
          if (!permissionGranted) {
            console.log('FaceID permission not yet granted - will be requested when needed');
          } else {
            console.log('FaceID permission already granted');
          }
        }
      } else if (Platform.OS === 'ios') {
        // Fallback for iOS devices that might not be correctly detected
        console.log('iOS device detected but biometrics not available, trying fallback to FaceID');
        setBiometricType('FaceID');
        setIsBiometricSupported(true);
        
        // For fallback FaceID, also check permission status
        const { permissionGranted } = await BiometricsService.checkBiometricPermission();
        console.log(`Fallback FaceID permission status: ${permissionGranted}`);
      } else if (bioError) {
        console.warn("Biometric error:", bioError);
      }
    } catch (error) {
      console.error('Error checking biometric support:', error);
    }
  };

  const authenticateWithBiometrics = async (): Promise<boolean> => {
    setIsLoading(true);
    setAuthStatus('authenticating');
    setError(null);
    
    try {
      console.log('Attempting biometric authentication...');
      
      // Check if we're in Expo Go (where FaceID might not work)
      let isExpoGo = false;
      try {
        const constants = require('expo-constants');
        isExpoGo = constants.default.executionEnvironment === 'storeClient';
        console.log('Running in Expo Go:', isExpoGo);
      } catch (err) {
        console.log('Error checking Expo Go:', err);
      }
      
      // For Expo Go with FaceID, show a helpful message
      if (isExpoGo && biometricType === 'FaceID' && Platform.OS === 'ios') {
        console.log('FaceID detected in Expo Go - will use passcode fallback');
        // Still attempt authentication but with an explicit warning
        Alert.alert(
          'FaceID Limitation',
          'FaceID is not fully supported in Expo Go. The app will use passcode fallback instead.',
          [{ text: 'Continue' }]
        );
      }
      
      // First try a direct authentication approach with passcode fallback
      const authResult = await LocalAuthentication.authenticateAsync({
        promptMessage: "Authenticate to continue",
        fallbackLabel: "Use Device Passcode",
        disableDeviceFallback: false // Enable passcode fallback
      });
      
      console.log('Direct auth result:', JSON.stringify(authResult));
      
      if (authResult.success) {
        // If direct authentication succeeds, log the user in
        const { user: authenticatedUser, error: authError } = await AuthService.loginWithBiometrics();
        
        if (authenticatedUser) {
          console.log('Biometric authentication successful');
          setUser(authenticatedUser);
          setAuthStatus('authenticated');
          setIsLoading(false);
          
          // Persist login state - ensure wasLoggedIn is set
          console.log('Persisting login state after biometric auth');
          await AsyncStorage.setItem('wasLoggedIn', 'true');
          await setUserLoggedIn();
          
          return true;
        } else {
          console.log('Backend authentication failed:', authError);
          setError(authError || 'Authentication failed');
          setAuthStatus('unauthenticated');
          setIsLoading(false);
          return false;
        }
      } else {
        console.log('Biometric authentication failed:', authResult.error);
        
        // Handle FaceID warning specifically
        if (authResult.warning && authResult.warning.includes("FaceID is available but has not been configured")) {
          setError('FaceID is not available in Expo Go. Please build a development client or use passcode/TouchID.');
        } else {
          setError(authResult.error || 'Authentication failed');
        }
        
        setAuthStatus('unauthenticated');
        setIsLoading(false);
        return false;
      }
    } catch (error) {
      console.error('Authentication error:', error);
      setError('An unexpected error occurred during authentication');
      setAuthStatus('error');
      setIsLoading(false);
      return false;
    }
  };

  /**
   * Enroll in biometric authentication by storing credentials
   * @returns Success status of enrollment
   */
  const enrollInBiometricAuth = async (email: string, password: string): Promise<boolean> => {
    setIsLoading(true);
    setError(null);
    
    try {
      console.log('Attempting to enroll in biometric authentication');
      
      // Store credentials with biometric protection
      const { success, error: enrollError } = await BiometricsService.storeCredentials(email, password);
      
      setIsLoading(false);
      
      if (!success) {
        setError(enrollError || 'Failed to set up biometric authentication');
        return false;
      }
      
      console.log('Successfully enrolled in biometric authentication');
      return true;
    } catch (error) {
      console.error('Error enrolling in biometric auth:', error);
      setError('An unexpected error occurred during biometric enrollment');
      setIsLoading(false);
      return false;
    }
  };
  
  /**
   * Prompt user to enroll in biometric authentication
   */
  const promptBiometricEnrollment = (email: string, password: string) => {
    console.log('Prompting for biometric enrollment');
    setPendingCredentials({ email, password });
    setShowBiometricEnrollment(true);
  };
  
  /**
   * Handle user decision about biometric enrollment
   */
  const handleBiometricEnrollmentDecision = async (shouldEnroll: boolean) => {
    setShowBiometricEnrollment(false);
    
    if (shouldEnroll && pendingCredentials) {
      console.log('User accepted biometric enrollment, storing credentials');
      await enrollInBiometricAuth(pendingCredentials.email, pendingCredentials.password);
    } else {
      console.log('User declined biometric enrollment');
    }
    
    // Clear pending credentials regardless of decision
    setPendingCredentials(null);
  };

  const authenticateWithCredentials = async (email: string, password: string): Promise<boolean> => {
    setIsLoading(true);
    setAuthStatus('authenticating');
    setError(null);
    
    try {
      const { user: authenticatedUser, error: authError } = await AuthService.login(email, password);
      
      if (authenticatedUser) {
        setUser(authenticatedUser);
        setAuthStatus('authenticated');
        
        // Persist login state - this must be set for biometric auth to work later
        console.log('User authenticated, persisting login state');
        
        // Set in both AsyncStorage directly and via the hook for redundancy
        await AsyncStorage.setItem('wasLoggedIn', 'true');
        await setUserLoggedIn();
        
        setIsLoading(false);
        
        // Check if biometrics are available and prompt for enrollment if not already set up
        if (isBiometricSupported) {
          const { keysExist } = await BiometricsService.biometricKeysExist();
          if (!keysExist) {
            // Prompt user to enable biometric authentication
            promptBiometricEnrollment(email, password);
          }
        }
        
        return true;
      } else {
        setError(authError || 'Login failed');
        setAuthStatus('unauthenticated');
        setIsLoading(false);
        return false;
      }
    } catch (error) {
      console.error('Login error:', error);
      setError('An unexpected error occurred during login');
      setAuthStatus('error');
      setIsLoading(false);
      return false;
    }
  };

  const registerUser = async (email: string, password: string, name: string): Promise<boolean> => {
    setIsLoading(true);
    setAuthStatus('authenticating');
    setError(null);
    
    try {
      const { user: registeredUser, error: regError } = await AuthService.register(email, password, name);
      
      if (registeredUser) {
        setUser(registeredUser);
        setAuthStatus('authenticated');
        setIsLoading(false);
        return true;
      } else {
        setError(regError || 'Registration failed');
        setAuthStatus('unauthenticated');
        setIsLoading(false);
        return false;
      }
    } catch (error) {
      console.error('Registration error:', error);
      setError('An unexpected error occurred during registration');
      setAuthStatus('error');
      setIsLoading(false);
      return false;
    }
  };

  const revealSensitiveData = async (): Promise<boolean> => {
    // If data is already revealed, we can just mask it without authentication
    if (isDataRevealed) {
      setIsDataRevealed(false);
      return true;
    }
    
    try {
      // Direct authentication with passcode fallback
      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: `View sensitive data`,
        fallbackLabel: "Use Passcode",
        disableDeviceFallback: false // Enable passcode fallback
      });
      
      console.log('Reveal data auth result:', JSON.stringify(result));
      
      if (result.success) {
        setIsDataRevealed(true);
        return true;
      } else {
        // If authentication fails but with a FaceID warning, show a helpful message
        if (result.warning && result.warning.includes("FaceID is available but has not been configured")) {
          console.log('FaceID not available in Expo Go when revealing data');
          Alert.alert(
            'FaceID Not Available',
            'FaceID is not supported in Expo Go. Please use passcode instead or build a development client.',
            [{ text: 'OK' }]
          );
        }
        return false;
      }
    } catch (error) {
      console.error('Authentication error:', error);
      return false;
    }
  };

  // Simple toggle without authentication - useful when we want to hide already revealed data
  const toggleDataVisibility = () => {
    if (isDataRevealed) {
      setIsDataRevealed(false);
    } else {
      // Only try to reveal if currently hidden - will trigger authentication
      revealSensitiveData();
    }
  };

  const logout = async () => {
    try {
      setIsLoading(true);
      
      // Clear login status before logging out
      await clearLoginStatus();
      
      // Log out from Firebase
      await AuthService.logout();
      
      // Update local state
      setUser(null);
      setAuthStatus('unauthenticated');
      setIsLoading(false);
    } catch (error) {
      console.error('Logout error:', error);
      setError('Failed to logout');
      setIsLoading(false);
    }
  };

  /**
   * Update the user's profile information
   * @param profileData Data to update
   * @returns Whether update was successful
   */
  const updateUserProfile = async (profileData: Partial<User>): Promise<boolean> => {
    setIsLoading(true);
    setError(null);
    
    try {
      if (!user?.id) {
        throw new Error('No user is logged in');
      }
      
      const { user: updatedUser, error: updateError } = await FirebaseService.updateUserProfile(
        user.id,
        profileData
      );
      
      if (updateError) {
        setError(updateError);
        return false;
      }
      
      if (updatedUser) {
        setUser(updatedUser);
        return true;
      }
      
      return false;
    } catch (error: any) {
      console.error('Error updating profile:', error);
      setError(error.message);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const clearError = () => {
    setError(null);
  };

  const getBiometricTypeName = (): string => {
    return BiometricsService.getBiometricTypeText(biometricType);
  };

  const checkBiometricPermission = async (): Promise<boolean> => {
    try {
      console.log('Checking biometric permission in AuthContext...');
      const { permissionGranted, error: permissionError } = await BiometricsService.checkBiometricPermission();
      
      if (permissionError) {
        console.warn('Biometric permission check error:', permissionError);
      }
      
      console.log('Biometric permission granted:', permissionGranted);
      return permissionGranted;
    } catch (error) {
      console.error('Error checking biometric permission:', error);
      return false;
    }
  };

  const value: AuthContextType = {
    user,
    authStatus,
    authenticateWithBiometrics,
    authenticateWithCredentials,
    registerUser,
    updateUserProfile,
    logout,
    isBiometricSupported,
    biometricType,
    biometricTypeName: getBiometricTypeName(),
    revealSensitiveData,
    isDataRevealed,
    toggleDataVisibility,
    checkBiometricPermission,
    showBiometricEnrollment,
    handleBiometricEnrollmentDecision,
    error,
    clearError,
    isLoading,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  
  return context;
}; 