import React, { useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  SafeAreaView, 
  Switch,
  TouchableOpacity
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../context/AuthContext';
import { COLORS, SIZES } from '../constants/theme';
import { Ionicons } from '@expo/vector-icons';
import Button from '../components/common/Button';

const WelcomeScreen: React.FC = () => {
  const { authStatus, authenticateWithBiometrics, biometricType } = useAuth();
  const [loading, setLoading] = useState(false);
  const [enableBiometrics, setEnableBiometrics] = useState(true);
  const navigation = useNavigation();

  const handleContinue = async () => {
    setLoading(true);
    
    if (enableBiometrics) {
      // Try to authenticate
      await authenticateWithBiometrics();
    } else {
      // Skip biometrics authentication and navigate to auth screen
      // This would typically set some user preference in a real app
      navigation.navigate('Auth' as never);
      setLoading(false);
    }
  };

  const getBiometricLabel = () => {
    switch (biometricType) {
      case 'FaceID':
        return 'Face ID';
      case 'Fingerprint':
        return 'Fingerprint';
      default:
        return 'Biometrics';
    }
  };

  const getBiometricDescription = () => {
    switch (biometricType) {
      case 'FaceID':
        return 'Use Face ID to log in quickly and securely.';
      case 'Fingerprint':
        return 'Use Fingerprint to log in quickly and securely.';
      default:
        return 'Use biometrics to log in quickly and securely.';
    }
  };

  const getBiometricIcon = () => {
    switch (biometricType) {
      case 'FaceID':
        return 'scan-face';
      case 'Fingerprint':
        return 'finger-print';
      default:
        return 'lock-closed';
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <View style={styles.logoContainer}>
          <Text style={styles.logo}>Ryt</Text>
          <Text style={styles.logoSubtitle}>Bank</Text>
        </View>

        <View style={styles.illustrationContainer}>
          <View style={styles.securityIconContainer}>
            <Ionicons name={getBiometricIcon() as any} size={80} color={COLORS.primary} />
          </View>
        </View>

        <Text style={styles.title}>Welcome to Ryt Bank!</Text>
        
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