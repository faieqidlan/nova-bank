import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Switch, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { BiometricsService } from '../../services/BiometricsService';
import { COLORS, SIZES } from '../../constants/theme';
import { useAuth } from '../../context/AuthContext';
import { useAuthPersistence } from '../../hooks/useAuthPersistence';
import Card from '../common/Card';
import * as LocalAuthentication from 'expo-local-authentication';

interface BiometricSettingsProps {
  onUpdate?: (enabled: boolean) => void;
}

const BiometricSettings: React.FC<BiometricSettingsProps> = ({ onUpdate }) => {
  const [isEnabled, setIsEnabled] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const { biometricType, biometricTypeName, isBiometricSupported } = useAuth();
  const [isExpoGo, setIsExpoGo] = useState(false);
  const { setUserLoggedIn } = useAuthPersistence();

  useEffect(() => {
    checkBiometricStatus();
    
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
  }, []);

  const checkBiometricStatus = async () => {
    try {
      // Check if biometrics is available
      const { available } = await BiometricsService.isSensorAvailable();
      
      if (available) {
        // Check if keys exist
        const { keysExist } = await BiometricsService.biometricKeysExist();
        setIsEnabled(keysExist);
      } else {
        setIsEnabled(false);
      }
    } catch (error) {
      console.error('Error checking biometric status:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggle = async (value: boolean) => {
    if (value && !isEnabled) {
      // Enable biometrics
      setIsLoading(true);
      try {
        // Verify user's identity first
        const authResult = await LocalAuthentication.authenticateAsync({
          promptMessage: "Authenticate to enable biometric login",
          fallbackLabel: "Use Passcode",
          disableDeviceFallback: false
        });
        
        if (authResult.success) {
          // Create biometric keys
          console.log('Authentication successful, creating biometric keys...');
          const { publicKey } = await BiometricsService.createKeys();
          
          if (publicKey) {
            setIsEnabled(true);
            // Persist login state
            await setUserLoggedIn();
            if (onUpdate) {
              onUpdate(true);
            }
            Alert.alert('Success', 'Biometric login has been enabled');
          } else {
            Alert.alert('Error', 'Failed to enable biometric login');
          }
        } else {
          console.log('Authentication failed:', authResult.error);
          // If in Expo Go and we get FaceID warning, show a helpful message
          if (authResult.warning && authResult.warning.includes("FaceID is available but has not been configured")) {
            Alert.alert(
              'FaceID Not Available',
              'FaceID is not supported in Expo Go. Please use passcode for authentication or build a development client.',
              [{ text: 'OK' }]
            );
          }
        }
      } catch (error) {
        console.error('Error enabling biometrics:', error);
        Alert.alert('Error', 'Failed to enable biometric login');
      } finally {
        setIsLoading(false);
      }
    } else if (!value && isEnabled) {
      // Disable biometrics
      setIsLoading(true);
      try {
        // Verify user's identity first before disabling
        const authResult = await LocalAuthentication.authenticateAsync({
          promptMessage: "Authenticate to disable biometric login",
          fallbackLabel: "Use Passcode",
          disableDeviceFallback: false
        });
        
        if (authResult.success) {
          // Delete biometric keys
          console.log('Authentication successful, deleting biometric keys...');
          const { keysDeleted } = await BiometricsService.deleteKeys();
          
          if (keysDeleted) {
            setIsEnabled(false);
            if (onUpdate) {
              onUpdate(false);
            }
            Alert.alert('Success', 'Biometric login has been disabled');
          } else {
            Alert.alert('Error', 'Failed to disable biometric login');
          }
        } else {
          console.log('Authentication failed:', authResult.error);
        }
      } catch (error) {
        console.error('Error disabling biometrics:', error);
        Alert.alert('Error', 'Failed to disable biometric login');
      } finally {
        setIsLoading(false);
      }
    }
  };

  const getBiometricIcon = () => {
    switch (biometricType) {
      case 'FaceID':
        return 'scan-outline';
      case 'TouchID':
      case 'Fingerprint':
        return 'finger-print';
      case 'Iris':
        return 'eye-outline';
      default:
        return 'lock-closed';
    }
  };

  if (isLoading) {
    return (
      <Card style={styles.card}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="small" color={COLORS.primary} />
          <Text style={styles.loadingText}>Checking biometric settings...</Text>
        </View>
      </Card>
    );
  }

  if (!isBiometricSupported) {
    return (
      <Card style={styles.card}>
        <View style={styles.row}>
          <View style={[styles.iconContainer, styles.iconDisabled]}>
            <Ionicons name="lock-closed" size={24} color={COLORS.textSecondary} />
          </View>
          <View style={styles.textContainer}>
            <Text style={styles.title}>Biometric Login</Text>
            <Text style={styles.description}>
              Biometric authentication is not available on this device. Please use password login instead.
            </Text>
          </View>
        </View>
      </Card>
    );
  }

  return (
    <View>
      <Card style={styles.card}>
        <View style={styles.row}>
          <View style={[styles.iconContainer, isEnabled ? styles.iconEnabled : styles.iconDisabled]}>
            <Ionicons 
              name={getBiometricIcon()} 
              size={24} 
              color={isEnabled ? COLORS.primary : COLORS.textSecondary} 
            />
          </View>
          <View style={styles.textContainer}>
            <Text style={styles.title}>{biometricTypeName} Login</Text>
            <Text style={styles.description}>
              {isEnabled
                ? `${biometricTypeName} login is enabled for quick and secure access`
                : `Enable ${biometricTypeName} login for quick and secure access`}
            </Text>
            {isExpoGo && biometricType === 'FaceID' && (
              <Text style={styles.warning}>
                Note: FaceID is not supported in Expo Go. Authentication will use passcode.
              </Text>
            )}
          </View>
          <Switch
            value={isEnabled}
            onValueChange={handleToggle}
            trackColor={{ false: '#D1D5DB', true: COLORS.primary + '80' }}
            thumbColor={isEnabled ? COLORS.primary : '#F4F4F5'}
            ios_backgroundColor="#D1D5DB"
            disabled={isLoading}
          />
        </View>
      </Card>
        
      <Card style={styles.infoCard}>
        <Text style={styles.infoTitle}>About Biometric Authentication</Text>
        <View style={styles.infoItem}>
          <Ionicons name="shield-checkmark-outline" size={20} color={COLORS.primary} style={styles.infoIcon} />
          <Text style={styles.infoText}>
            Your biometric data never leaves your device and is protected by secure hardware
          </Text>
        </View>
        <View style={styles.infoItem}>
          <Ionicons name="speedometer-outline" size={20} color={COLORS.primary} style={styles.infoIcon} />
          <Text style={styles.infoText}>
            Login faster without typing your password each time
          </Text>
        </View>
        <View style={styles.infoItem}>
          <Ionicons name="lock-closed-outline" size={20} color={COLORS.primary} style={styles.infoIcon} />
          <Text style={styles.infoText}>
            Enhanced security with unique biometric signature that's difficult to fake
          </Text>
        </View>
      </Card>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    marginBottom: 16,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SIZES.padding,
  },
  iconContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  iconEnabled: {
    backgroundColor: COLORS.primary + '15',
  },
  iconDisabled: {
    backgroundColor: COLORS.border,
  },
  textContainer: {
    flex: 1,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 4,
  },
  description: {
    fontSize: 14,
    color: COLORS.textSecondary,
    lineHeight: 20,
  },
  warning: {
    fontSize: 12,
    color: COLORS.danger,
    marginTop: 4,
  },
  loadingContainer: {
    padding: SIZES.padding,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
  },
  loadingText: {
    marginLeft: 12,
    fontSize: 14,
    color: COLORS.textSecondary,
  },
  infoCard: {
    padding: SIZES.padding,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 16,
  },
  infoItem: {
    flexDirection: 'row',
    marginBottom: 12,
    alignItems: 'flex-start',
  },
  infoIcon: {
    marginRight: 12,
    marginTop: 2,
  },
  infoText: {
    flex: 1,
    fontSize: 14,
    color: COLORS.textSecondary,
    lineHeight: 20,
  },
});

export default BiometricSettings; 