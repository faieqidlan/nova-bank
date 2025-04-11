import React, { useEffect, useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  SafeAreaView, 
  Switch,
  TouchableOpacity,
  Platform
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../context/AuthContext';
import { COLORS, SIZES } from '../constants/theme';
import { Ionicons } from '@expo/vector-icons';
import Button from '../components/common/Button';
import * as LocalAuthentication from 'expo-local-authentication';

const WelcomeScreen: React.FC = () => {
  const { authStatus, authenticateWithBiometrics, biometricType } = useAuth();
  const [loading, setLoading] = useState(false);
  const [enableBiometrics, setEnableBiometrics] = useState(true);
  const [availableAuthTypes, setAvailableAuthTypes] = useState<LocalAuthentication.AuthenticationType[]>([]);
  const navigation = useNavigation();

  // Check available authentication types
  useEffect(() => {
    const checkAuthTypes = async () => {
      try {
        const hasHardware = await LocalAuthentication.hasHardwareAsync();
        if (!hasHardware) return;
        
        const isEnrolled = await LocalAuthentication.isEnrolledAsync();
        if (!isEnrolled) return;
        
        const types = await LocalAuthentication.supportedAuthenticationTypesAsync();
        setAvailableAuthTypes(types);
      } catch (err) {
        console.error('Error checking auth types:', err);
      }
    };
    
    checkAuthTypes();
  }, []);

  const handleContinue = async () => {
    setLoading(true);
    
    if (enableBiometrics) {
      // Try biometric authentication first
      const success = await authenticateWithBiometrics();
      if (!success) {
        // If biometric auth fails, navigate to regular auth screen
        navigation.navigate('Auth' as never);
      }
    } else {
      // Skip biometrics and go straight to auth screen
      navigation.navigate('Auth' as never);
    }
    
    setLoading(false);
  };

  const getBiometricLabel = () => {
    if (availableAuthTypes.includes(LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION)) {
      return Platform.OS === 'ios' ? 'Face ID' : 'Face Recognition';
    } else if (availableAuthTypes.includes(LocalAuthentication.AuthenticationType.FINGERPRINT)) {
      return Platform.OS === 'ios' ? 'Touch ID' : 'Fingerprint';
    } else if (availableAuthTypes.includes(LocalAuthentication.AuthenticationType.IRIS)) {
      return 'Iris Scan';
    }
    return 'Biometrics';
  };

  const getBiometricDescription = () => {
    if (availableAuthTypes.includes(LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION)) {
      return Platform.OS === 'ios' 
        ? 'Use Face ID to log in quickly and securely.' 
        : 'Use Face Recognition to log in quickly and securely.';
    } else if (availableAuthTypes.includes(LocalAuthentication.AuthenticationType.FINGERPRINT)) {
      return Platform.OS === 'ios'
        ? 'Use Touch ID to log in quickly and securely.'
        : 'Use Fingerprint to log in quickly and securely.';
    }
    return 'Use biometrics to log in quickly and securely.';
  };

  const getBiometricIcon = () => {
    if (availableAuthTypes.includes(LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION)) {
      return 'scan-outline';
    } else if (availableAuthTypes.includes(LocalAuthentication.AuthenticationType.FINGERPRINT)) {
      return 'finger-print';
    } else if (availableAuthTypes.includes(LocalAuthentication.AuthenticationType.IRIS)) {
      return 'eye-outline';
    }
    return 'lock-closed';
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <View style={styles.logoContainer}>
          <Text style={styles.logo}>Nova</Text>
          <Text style={styles.logoSubtitle}>Bank</Text>
        </View>

        <View style={styles.illustrationContainer}>
          <View style={styles.securityIconContainer}>
            <Ionicons name={getBiometricIcon()} size={80} color={COLORS.primary} />
          </View>
        </View>

        <Text style={styles.title}>Welcome to Nova Bank!</Text>
        
        <Text style={styles.subtitle}>
          Secure banking at your fingertips with advanced biometric protection.
        </Text>

        <View style={styles.biometricsRow}>
          <View style={styles.biometricsTextContainer}>
            <Text style={styles.biometricsTitle}>Enable {getBiometricLabel()}</Text>
            <Text style={styles.biometricsDescription}>{getBiometricDescription()}</Text>
          </View>
          <Switch
            trackColor={{ false: COLORS.border, true: `${COLORS.primary}80` }}
            thumbColor={enableBiometrics ? COLORS.primary : COLORS.textSecondary}
            ios_backgroundColor={COLORS.border}
            onValueChange={setEnableBiometrics}
            value={enableBiometrics}
          />
        </View>

        <Button
          title="Continue"
          onPress={handleContinue}
          loading={loading}
          style={styles.button}
          size="large"
        />
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
    padding: SIZES.padding * 1.5,
  },
  logoContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
    alignSelf: 'center',
    marginBottom: 50,
    position: 'absolute',
    top: 20,
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
  illustrationContainer: {
    marginBottom: 40,
    alignItems: 'center',
  },
  securityIconContainer: {
    width: 120,
    height: 120,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: 12,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginBottom: 50,
  },
  biometricsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    paddingHorizontal: 16,
    paddingVertical: 24,
    marginBottom: 40,
    backgroundColor: COLORS.card,
    borderRadius: SIZES.radius,
  },
  biometricsTextContainer: {
    flex: 1,
  },
  biometricsTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: COLORS.text,
  },
  biometricsDescription: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginTop: 4,
  },
  button: {
    width: '100%',
    borderRadius: 30,
  },
});

export default WelcomeScreen; 