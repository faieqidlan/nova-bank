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
}

const BiometricPrompt: React.FC<BiometricPromptProps> = ({ 
  onSuccess,
  onCancel,
  promptMessage = "Authenticate to continue"
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
    
    // Start authentication immediately when component mounts
    handleAuthenticate();
  }, []);

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
    <Card style={styles.card}>
      <View style={styles.container}>
        <View style={styles.iconContainer}>
          <Ionicons name={getBiometricIcon()} size={32} color={COLORS.primary} />
        </View>
        
        <Text style={styles.title}>
          {isExpoGo && biometricType === 'FaceID' 
            ? 'Authenticate with Passcode' 
            : `Authenticate with ${biometricTypeName} or Passcode`}
        </Text>
        
        {isExpoGo && biometricType === 'FaceID' && (
          <Text style={styles.warning}>
            Note: FaceID is not supported in Expo Go. Please use passcode instead.
          </Text>
        )}
        
        <Text style={styles.message}>
          {promptMessage}
        </Text>
        
        {isLoading ? (
          <ActivityIndicator size="large" color={COLORS.primary} style={styles.loader} />
        ) : (
          <View style={styles.buttonContainer}>
            <TouchableOpacity 
              style={styles.button} 
              onPress={handleAuthenticate}
            >
              <Text style={styles.buttonText}>Authenticate</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.cancelButton} 
              onPress={handleCancel}
            >
              <Text style={styles.cancelText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    </Card>
  );
};

const styles = StyleSheet.create({
  card: {
    padding: 0,
    overflow: 'hidden',
  },
  container: {
    alignItems: 'center',
    padding: SIZES.padding * 2,
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: COLORS.primary + '15',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 10,
    textAlign: 'center',
  },
  message: {
    fontSize: 16,
    color: COLORS.textSecondary,
    marginBottom: 30,
    textAlign: 'center',
  },
  warning: {
    fontSize: 14,
    color: COLORS.danger,
    textAlign: 'center',
    marginBottom: 10,
    padding: 8,
    backgroundColor: '#FFF5F5',
    borderRadius: 8,
    maxWidth: '100%',
  },
  buttonContainer: {
    width: '100%',
    marginTop: 10,
  },
  button: {
    backgroundColor: COLORS.primary,
    borderRadius: SIZES.radius,
    padding: 16,
    alignItems: 'center',
    marginBottom: 12,
  },
  buttonText: {
    color: '#FFF',
    fontWeight: '600',
    fontSize: 16,
  },
  cancelButton: {
    padding: 12,
    alignItems: 'center',
  },
  cancelText: {
    color: COLORS.textSecondary,
    fontSize: 16,
  },
  loader: {
    marginVertical: 20,
  },
});

export default BiometricPrompt; 