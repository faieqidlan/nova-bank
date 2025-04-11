import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Alert, SafeAreaView, Platform, TouchableOpacity } from 'react-native';
import { useNavigation, useRoute, RouteProp, NavigationProp } from '@react-navigation/native';
import { useAuth } from '../context/AuthContext';
import { COLORS, SIZES } from '../constants/theme';
import Button from '../components/common/Button';
import Card from '../components/common/Card';
import { Ionicons } from '@expo/vector-icons';
import { RootStackParamList } from '../navigation/types';
import * as LocalAuthentication from 'expo-local-authentication';
import * as SecureStore from 'expo-secure-store';
import { BiometricsService } from '../services/BiometricsService';

const AuthScreen: React.FC = () => {
  const { 
    authStatus, 
    authenticateWithBiometrics, 
    isBiometricSupported, 
    biometricType,
    biometricTypeName,
    error, 
    clearError,
    isLoading 
  } = useAuth();
  
  const navigation = useNavigation<NavigationProp<RootStackParamList>>();
  const route = useRoute<RouteProp<RootStackParamList, 'Auth'>>();
  const showBiometricPrompt = route.params?.showBiometricPrompt;
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [availableAuthTypes, setAvailableAuthTypes] = useState<LocalAuthentication.AuthenticationType[]>([]);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Check for available authentication types when the component mounts
  useEffect(() => {
    const checkAuthTypes = async () => {
      try {
        // Check if hardware is available
        const hasHardware = await LocalAuthentication.hasHardwareAsync();
        if (!hasHardware) {
          console.log('No biometric hardware detected');
          return;
        }
        
        // Check if biometrics are enrolled
        const isEnrolled = await LocalAuthentication.isEnrolledAsync();
        if (!isEnrolled) {
          console.log('No biometrics enrolled on this device');
          return;
        }
        
        // Get supported authentication types
        const types = await LocalAuthentication.supportedAuthenticationTypesAsync();
        setAvailableAuthTypes(types);
        console.log('Available auth types:', types);
      } catch (err) {
        console.error('Error checking auth types:', err);
      }
    };
    
    checkAuthTypes();
  }, []);

  useEffect(() => {
    // Auto-trigger biometric authentication when component mounts 
    // if biometrics are supported and the flag is true (previously logged in)
    if (isBiometricSupported && showBiometricPrompt) {
      console.log('Auto-triggering biometric authentication on AuthScreen mount');
      handleBiometricAuthentication();
    }
  }, [isBiometricSupported, showBiometricPrompt]);

  useEffect(() => {
    if (error) {
      // Auto-clear error after 5 seconds instead of showing an alert
      const timer = setTimeout(() => {
        clearError();
      }, 5000);
      
      return () => clearTimeout(timer);
    }
  }, [error, clearError]);

  const handleLoginWithPassword = () => {
    navigation.navigate('Login');
  };

  const getBiometricIcon = () => {
    // Determine the appropriate icon based on available authentication types
    if (availableAuthTypes.includes(LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION)) {
      return 'scan-outline';
    } else if (availableAuthTypes.includes(LocalAuthentication.AuthenticationType.FINGERPRINT)) {
      return 'finger-print'; 
    } else if (availableAuthTypes.includes(LocalAuthentication.AuthenticationType.IRIS)) {
      return 'eye-outline';
    } else {
      // Default icon if we can't determine the type
      return 'lock-closed';
    }
  };

  const getBiometricText = () => {
    if (availableAuthTypes.includes(LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION)) {
      return 'Use Face ID to securely access your account.';
    } else if (availableAuthTypes.includes(LocalAuthentication.AuthenticationType.FINGERPRINT)) {
      return Platform.OS === 'ios' 
        ? 'Use Touch ID to securely access your account.' 
        : 'Use Fingerprint to securely access your account.';
    } else if (availableAuthTypes.includes(LocalAuthentication.AuthenticationType.IRIS)) {
      return 'Use Iris scan to securely access your account.';
    } else {
      return 'Use biometric authentication to access your account securely.';
    }
  };

  const handleBiometricAuthentication = async () => {
    try {
      setIsAuthenticating(true);
      setErrorMessage(null);
      
      // Check if biometric keys exist before attempting auth
      const { keysExist } = await BiometricsService.biometricKeysExist();
      if (!keysExist) {
        console.log('No biometric keys exist, cannot authenticate with biometrics');
        setErrorMessage(`${biometricTypeName} login not set up. Please use password login.`);
        setIsAuthenticating(false);
        return;
      }
      
      // Check if credentials exist
      const storedCredentials = await SecureStore.getItemAsync('biometric_secured_credentials');
      if (!storedCredentials) {
        console.log('No stored biometric credentials found');
        setErrorMessage('Biometric login data missing. Please use password login.');
        setIsAuthenticating(false);
        return;
      }
      
      // Authentication is only possible if credentials exist
      const success = await authenticateWithBiometrics();
      if (!success) {
        console.log('Biometric authentication failed');
        // The user can still try again or use password auth
        setErrorMessage('Authentication failed. Please try again or use password.');
        setIsAuthenticating(false);
      }
    } catch (err) {
      console.error('Error during biometric authentication:', err);
      setErrorMessage('An error occurred. Please try again.');
      setIsAuthenticating(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <View style={styles.logoContainer}>
          <Text style={styles.logo}>Nova</Text>
          <Text style={styles.logoSubtitle}>Bank</Text>
        </View>

        <Card style={styles.card} shadowType="medium">
          <Text style={styles.title}>Login to Your Account</Text>
          
          {/* Display inline error message if there is an error */}
          {errorMessage && (
            <View style={styles.errorContainer}>
              <Text style={styles.errorText}>{errorMessage}</Text>
            </View>
          )}
          
          <View style={styles.biometricContainer}>
            <View style={styles.iconContainer}>
              <Ionicons name={getBiometricIcon()} size={60} color={COLORS.primary} />
            </View>
            <Text style={styles.biometricText}>
              {getBiometricText()}
            </Text>
          </View>

          {isBiometricSupported ? (
            <Button
              title={`Login with ${biometricTypeName}`}
              onPress={handleBiometricAuthentication}
              loading={isAuthenticating || isLoading}
              style={styles.button}
            />
          ) : null}

          <TouchableOpacity 
            style={styles.passwordLoginButton}
            onPress={() => navigation.navigate('Login')}
          >
            <Text style={styles.passwordLoginText}>Use Password Login</Text>
          </TouchableOpacity>

          <Text style={styles.securityText}>
            Your security is our priority. All sensitive data is encrypted and protected.
          </Text>
        </Card>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
    justifyContent: 'center',
    alignItems: 'center',
    padding: SIZES.padding,
  },
  logoContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: 40,
  },
  logo: {
    fontSize: 42,
    fontWeight: 'bold',
    color: COLORS.primary,
    letterSpacing: 1,
  },
  logoSubtitle: {
    fontSize: 28,
    fontWeight: '500',
    color: COLORS.text,
    marginLeft: 4,
  },
  card: {
    width: '100%',
    maxWidth: 400,
    padding: SIZES.padding * 1.5,
  },
  title: {
    fontSize: 24,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 24,
    textAlign: 'center',
  },
  biometricContainer: {
    alignItems: 'center',
    marginBottom: 32,
  },
  iconContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: COLORS.primary + '10',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  biometricText: {
    fontSize: 16,
    color: COLORS.textSecondary,
    textAlign: 'center',
  },
  button: {
    marginBottom: 16,
  },
  passwordLoginButton: {
    marginTop: 12,
    padding: SIZES.padding,
    backgroundColor: COLORS.primary,
    borderRadius: SIZES.radius,
    alignItems: 'center',
  },
  passwordLoginText: {
    fontSize: 16,
    fontWeight: '600',
    color: "#FFFFFF",
  },
  securityText: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginTop: 32,
    textAlign: 'center',
    opacity: 0.7,
  },
  errorContainer: {
    backgroundColor: 'rgba(255, 0, 0, 0.1)',
    padding: 10,
    borderRadius: 8,
    marginBottom: 16,
    marginTop: 8,
  },
  errorText: {
    color: COLORS.danger,
    textAlign: 'center',
    fontSize: 14,
  },
});

export default AuthScreen; 