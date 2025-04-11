import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Alert, SafeAreaView } from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { useAuth } from '../context/AuthContext';
import { COLORS, SIZES } from '../constants/theme';
import Button from '../components/common/Button';
import Card from '../components/common/Card';
import { Ionicons } from '@expo/vector-icons';
import { RootStackParamList } from '../navigation/types';

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
  
  const navigation = useNavigation();
  const route = useRoute<RouteProp<RootStackParamList, 'Auth'>>();
  const showBiometricPrompt = route.params?.showBiometricPrompt;
  const [isAuthenticating, setIsAuthenticating] = useState(false);

  useEffect(() => {
    // Auto-trigger biometric authentication when component mounts 
    // if biometrics are supported and the flag is true (previously logged in)
    if (isBiometricSupported && showBiometricPrompt) {
      console.log('Auto-triggering biometric authentication on AuthScreen mount');
      handleAuthenticate();
    }
  }, []);

  useEffect(() => {
    if (error) {
      // Auto-clear error after 5 seconds instead of showing an alert
      const timer = setTimeout(() => {
        clearError();
      }, 5000);
      
      return () => clearTimeout(timer);
    }
  }, [error, clearError]);

  const handleAuthenticate = async () => {
    if (!isBiometricSupported) {
      Alert.alert(
        'Biometric Authentication Not Available',
        'Your device does not support biometric authentication.',
        [{ text: 'OK' }]
      );
      return;
    }

    setIsAuthenticating(true);
    await authenticateWithBiometrics();
    setIsAuthenticating(false);
  };

  const handleLoginWithPassword = () => {
    navigation.navigate('Login' as never);
  };

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

  const getBiometricText = () => {
    switch (biometricType) {
      case 'FaceID':
        return 'Use Face ID to securely access your account.';
      case 'TouchID':
        return 'Use Touch ID to securely access your account.';
      default:
        return 'Use biometric authentication to access your account securely.';
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <View style={styles.logoContainer}>
          <Text style={styles.logo}>Ryt</Text>
          <Text style={styles.logoSubtitle}>Bank</Text>
        </View>

        <Card style={styles.card} shadowType="medium">
          <Text style={styles.title}>Login to Your Account</Text>
          
          {/* Display inline error message if there is an error */}
          {error && (
            <View style={styles.errorContainer}>
              <Text style={styles.errorText}>{error}</Text>
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

          <Button
            title={`Login with ${biometricTypeName}`}
            onPress={handleAuthenticate}
            loading={isAuthenticating || isLoading}
            style={styles.button}
          />

          <Button
            title="Login with Password"
            onPress={handleLoginWithPassword}
            variant="outline"
            style={styles.passwordButton}
          />

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
  passwordButton: {
    marginTop: 12,
  },
  securityText: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginTop: 32,
    textAlign: 'center',
    opacity: 0.7,
  },
  errorContainer: {
    backgroundColor: COLORS.danger + '20', // Using danger with transparency
    padding: SIZES.padding,
    borderRadius: SIZES.radius,
    marginBottom: 16,
  },
  errorText: {
    color: COLORS.danger,
    fontWeight: '500',
  },
});

export default AuthScreen; 