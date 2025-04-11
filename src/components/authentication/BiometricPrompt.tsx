import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  ActivityIndicator,
  Alert,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SIZES } from '../../constants/theme';
import { useAuth } from '../../context/AuthContext';
import Card from '../common/Card';
import * as LocalAuthentication from 'expo-local-authentication';

interface BiometricPromptProps {
  onSuccess?: () => void;
  onCancel?: () => void;
  promptMessage?: string;
  autoStart?: boolean;
}

const BiometricPrompt: React.FC<BiometricPromptProps> = ({ 
  onSuccess,
  onCancel,
  promptMessage = "Authenticate to continue",
  autoStart = true
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [isExpoGo, setIsExpoGo] = useState(false);
  const { biometricType, biometricTypeName } = useAuth();

  useEffect(() => {
    // Check if running in Expo Go
    const checkExpoGo = async () => {
      try {
        const constants = require('expo-constants');
        const isRunningInExpoGo = constants.default.executionEnvironment === 'storeClient';
        setIsExpoGo(isRunningInExpoGo);
        console.log('Running in Expo Go:', isRunningInExpoGo);
      } catch (error) {
        console.log('Error checking Expo Go:', error);
      }
    };
    
    checkExpoGo();
    
    // Start authentication immediately when component mounts if autoStart is true
    if (autoStart) {
      handleAuthenticate();
    }
  }, [autoStart]);

  const getBiometricIcon = () => {
    switch (biometricType) {
      case 'FaceID':
        return 'scan-outline';
      case 'TouchID':
        return 'finger-print';
      default:
        return 'lock-closed';
    }
  };

  const handleAuthenticate = async () => {
    if (isLoading) return;
    
    setIsLoading(true);
    
    try {
      // Simple authentication with passcode fallback enabled
      const result = await LocalAuthentication.authenticateAsync({
        promptMessage,
        fallbackLabel: "Use Device Passcode",
        disableDeviceFallback: false // Enable passcode fallback
      });
      
      console.log('Authentication result:', JSON.stringify(result));
      
      if (result.success) {
        console.log('Authentication successful');
        if (onSuccess) onSuccess();
      } else {
        console.log('Authentication failed:', result.error);
        
        // Handle FaceID not available in Expo Go specifically
        if (result.warning && result.warning.includes("FaceID is available but has not been configured")) {
          console.log('FaceID not available in Expo Go');
          // No need for alert since we already show a warning text in the UI
        }
        
        if (onCancel) onCancel();
      }
    } catch (error) {
      console.error('Authentication error:', error);
      if (onCancel) onCancel();
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    if (onCancel) onCancel();
  };

  return (
    <View style={styles.container}>
      <Card style={styles.card}>
        <View style={styles.iconContainer}>
          <Ionicons name={getBiometricIcon()} size={60} color={COLORS.primary} />
        </View>
        
        <Text style={styles.title}>
          {biometricTypeName} Authentication
        </Text>
        
        <Text style={styles.description}>
          {isExpoGo 
            ? "FaceID is not available in Expo Go. Please use a development build for full biometric functionality."
            : `Use your ${biometricTypeName} to authenticate`}
        </Text>
        
        {!autoStart && (
          <TouchableOpacity 
            style={styles.button}
            onPress={handleAuthenticate}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator color={COLORS.background} />
            ) : (
              <Text style={styles.buttonText}>Authenticate</Text>
            )}
          </TouchableOpacity>
        )}
        
        {isLoading && (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={COLORS.primary} />
            <Text style={styles.loadingText}>Authenticating...</Text>
          </View>
        )}
      </Card>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    padding: SIZES.padding,
  },
  card: {
    padding: SIZES.padding * 2,
    alignItems: 'center',
  },
  iconContainer: {
    marginBottom: SIZES.padding * 2,
  },
  title: {
    fontSize: SIZES.large,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: SIZES.padding,
    textAlign: 'center',
  },
  description: {
    fontSize: SIZES.medium,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginBottom: SIZES.padding * 2,
  },
  button: {
    backgroundColor: COLORS.primary,
    padding: SIZES.padding,
    borderRadius: SIZES.radius,
    width: '100%',
    alignItems: 'center',
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: SIZES.medium,
    fontWeight: 'bold',
  },
  loadingContainer: {
    marginTop: SIZES.padding,
    alignItems: 'center',
  },
  loadingText: {
    marginTop: SIZES.padding,
    color: COLORS.textSecondary,
  },
});

export default BiometricPrompt; 