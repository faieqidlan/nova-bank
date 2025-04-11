import React, { useEffect, useState } from 'react';
import { View, Text, Pressable, StyleSheet, Alert } from 'react-native';
import * as LocalAuthentication from 'expo-local-authentication';
import { COLORS, SIZES } from '../../constants/theme';
import { BiometricsService } from '../../services/BiometricsService';

enum AuthModeEnum {
  Local,
  Password,
  NoComp,
  Authenticate
}

const FaceIDTest: React.FC = () => {
  const [authMode, setAuthMode] = useState(AuthModeEnum.Local);
  const [authResult, setAuthResult] = useState<any>(null);
  const [isExpoGo, setIsExpoGo] = useState(false);

  useEffect(() => {
    checkBiometrics();
    // Check if running in Expo Go
    const checkExpoGo = async () => {
      try {
        // This is a rough way to detect Expo Go
        const constants = require('expo-constants');
        const isRunningInExpoGo = constants.default.executionEnvironment === 'storeClient';
        setIsExpoGo(isRunningInExpoGo);
        console.log('Running in Expo Go:', isRunningInExpoGo);
      } catch (error) {
        console.log('Error checking Expo Go:', error);
      }
    };
    
    checkExpoGo();
  }, []);

  const checkBiometrics = async () => {
    try {
      // First check if hardware is available
      const compatible = await LocalAuthentication.hasHardwareAsync();
      console.log('Compatible hardware:', compatible);
      
      if (compatible) {
        // Check if any biometrics are enrolled
        const enrolled = await LocalAuthentication.isEnrolledAsync();
        console.log('Biometrics enrolled:', enrolled);
        
        // Get supported authentication types
        const types = await LocalAuthentication.supportedAuthenticationTypesAsync();
        console.log('Supported auth types:', types);
        
        // Convert types to readable format
        const readableTypes = types.map(type => {
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
        console.log('Readable auth types:', readableTypes);
        
        // Get security level
        const securityLevel = await LocalAuthentication.getEnrolledLevelAsync();
        console.log('Security level:', securityLevel);
      }
    } catch (error) {
      console.error('Error checking biometrics:', error);
    }
  };

  const onAuthenticate = async () => {
    try {
      // First try the direct approach with passcode fallback enabled
      console.log('Attempting authentication using direct approach...');
      const auth = await LocalAuthentication.authenticateAsync({
        promptMessage: "Authenticate to continue",
        fallbackLabel: "Use Passcode", // Encourage passcode fallback
        disableDeviceFallback: false // Enable passcode fallback
      });
      
      console.log('Auth result (direct):', JSON.stringify(auth));
      setAuthResult(auth);
      
      if (auth.success) {
        setAuthMode(AuthModeEnum.Authenticate);
        Alert.alert('Success', 'Authentication successful!');
      } else {
        // Handle FaceID not available in Expo Go specifically
        if (auth.warning && auth.warning.includes("FaceID is available but has not been configured")) {
          console.log('FaceID not available in Expo Go, using passcode fallback');
          setAuthMode(AuthModeEnum.Password);
          Alert.alert(
            'FaceID Not Available',
            'FaceID is not supported in Expo Go. Please use passcode instead or build a development client.',
            [{ text: 'OK' }]
          );
        } else {
          console.log('Authentication failed, error:', auth.error);
          setAuthMode(AuthModeEnum.Password);
          Alert.alert('Failed', 'Authentication failed: ' + (auth.error || 'Unknown error'));
        }
      }
    } catch (error) {
      console.error('Authentication error:', error);
      Alert.alert('Error', 'An error occurred during authentication: ' + error);
    }
  };

  return (
    <View style={styles.container}>
      {authMode === AuthModeEnum.Local && (
        <>
          <Text style={styles.title}>Biometric Authentication Test</Text>
          {isExpoGo && (
            <Text style={styles.warning}>
              Note: FaceID is not supported in Expo Go. Use passcode instead or TouchID if available.
            </Text>
          )}
          <Text style={styles.description}>Test biometric authentication with fallback to passcode</Text>
          {authResult && (
            <View style={styles.resultContainer}>
              <Text style={styles.resultText}>Last Result: {JSON.stringify(authResult)}</Text>
            </View>
          )}
          <Pressable style={styles.button} onPress={onAuthenticate}>
            <Text style={styles.buttonText}>Authenticate Now</Text>
          </Pressable>
        </>
      )}

      {authMode === AuthModeEnum.NoComp && (
        <>
          <Text style={styles.title}>Not Compatible</Text>
          <Text style={styles.description}>This device does not support biometric authentication</Text>
          <Pressable style={styles.button} onPress={() => setAuthMode(AuthModeEnum.Local)}>
            <Text style={styles.buttonText}>Try Again</Text>
          </Pressable>
        </>
      )}

      {authMode === AuthModeEnum.Authenticate && (
        <>
          <Text style={styles.title}>Authentication Successful!</Text>
          <Text style={styles.description}>You have successfully authenticated</Text>
          <Pressable style={styles.button} onPress={() => setAuthMode(AuthModeEnum.Local)}>
            <Text style={styles.buttonText}>Go Back</Text>
          </Pressable>
        </>
      )}

      {authMode === AuthModeEnum.Password && (
        <>
          <Text style={styles.title}>Authentication Failed</Text>
          <Text style={styles.description}>Biometric authentication failed or was cancelled</Text>
          <Pressable style={styles.button} onPress={() => setAuthMode(AuthModeEnum.Local)}>
            <Text style={styles.buttonText}>Try Again</Text>
          </Pressable>
        </>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.card,
    alignItems: 'center',
    justifyContent: 'center',
    padding: SIZES.padding * 2,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: 16,
  },
  description: {
    fontSize: 16,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginBottom: 32,
  },
  warning: {
    fontSize: 14,
    color: COLORS.danger,
    textAlign: 'center',
    marginBottom: 16,
    padding: 8,
    backgroundColor: '#FFF5F5',
    borderRadius: 8,
    overflow: 'hidden',
  },
  button: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 16,
  },
  buttonText: {
    color: COLORS.card,
    fontSize: 16,
    fontWeight: '600',
  },
  resultContainer: {
    backgroundColor: '#f5f5f5',
    padding: 16,
    borderRadius: 8,
    marginBottom: 24,
    width: '100%',
  },
  resultText: {
    fontSize: 14,
    color: COLORS.text,
  },
});

export default FaceIDTest; 