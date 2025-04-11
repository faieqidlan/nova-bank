import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TextInput, 
  TouchableOpacity, 
  SafeAreaView, 
  KeyboardAvoidingView, 
  Platform,
  ScrollView,
  Alert
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../context/AuthContext';
import { COLORS, SIZES } from '../constants/theme';
import Button from '../components/common/Button';
import Card from '../components/common/Card';
import { Ionicons } from '@expo/vector-icons';
import BiometricPrompt from '../components/authentication/BiometricPrompt';
import BiometricEnrollmentPrompt from '../components/authentication/BiometricEnrollmentPrompt';
import { BiometricsService } from '../services/BiometricsService';

const LoginScreen: React.FC = () => {
  const { 
    authenticateWithCredentials, 
    authenticateWithBiometrics,
    isBiometricSupported, 
    biometricType,
    biometricTypeName,
    error,
    clearError,
    isLoading,
    showBiometricEnrollment,
    handleBiometricEnrollmentDecision
  } = useAuth();
  const navigation = useNavigation();
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [showBiometricPrompt, setShowBiometricPrompt] = useState(false);
  const [showEmailPassword, setShowEmailPassword] = useState(false);
  
  useEffect(() => {
    if (error) {
      // Auto-clear error after 5 seconds
      const timer = setTimeout(() => {
        clearError();
      }, 5000);
      
      return () => clearTimeout(timer);
    }
  }, [error, clearError]);

  // Check for stored credentials and show biometric prompt if available
  useEffect(() => {
    const checkStoredCredentials = async () => {
      if (isBiometricSupported) {
        // Check if biometric keys and credentials exist
        const { keysExist } = await BiometricsService.biometricKeysExist();
        
        if (keysExist) {
          // If we have credentials stored, show biometric prompt
          setShowBiometricPrompt(true);
          setShowEmailPassword(false);
        } else {
          // Fall back to email/password if no stored credentials
          setShowBiometricPrompt(false);
          setShowEmailPassword(true);
        }
      } else {
        // Fall back to email/password if biometrics not supported
        setShowBiometricPrompt(false);
        setShowEmailPassword(true);
      }
    };
    
    checkStoredCredentials();
  }, [isBiometricSupported]);

  const handleLogin = async () => {
    if (!email.trim() || !password.trim()) {
      Alert.alert('Missing Fields', 'Please enter both email and password');
      return;
    }
    
    await authenticateWithCredentials(email, password);
  };

  const handleBiometricCancel = () => {
    setShowBiometricPrompt(false);
    setShowEmailPassword(true);
  };

  const handleBiometricAuth = async () => {
    await authenticateWithBiometrics();
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

  // Automatically attempt biometric auth when the prompt is shown
  useEffect(() => {
    if (showBiometricPrompt) {
      handleBiometricAuth();
    }
  }, [showBiometricPrompt]);

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView 
        style={styles.keyboardAvoidingView}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView 
          contentContainerStyle={styles.scrollView}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.container}>
            <View style={styles.logoContainer}>
              <Text style={styles.logo}>Ryt</Text>
              <Text style={styles.logoSubtitle}>Bank</Text>
            </View>

            {showEmailPassword ? (
              <Card style={styles.card} shadowType="medium">
                <Text style={styles.title}>Login to Your Account</Text>
                
                {/* Display inline error message instead of alert */}
                {error && (
                  <View style={styles.errorContainer}>
                    <Text style={styles.errorText}>{error}</Text>
                  </View>
                )}
                
                <View style={styles.inputContainer}>
                  <Text style={styles.inputLabel}>Email</Text>
                  <View style={styles.inputWrapper}>
                    <Ionicons name="mail-outline" size={20} color={COLORS.textSecondary} style={styles.inputIcon} />
                    <TextInput
                      style={styles.input}
                      placeholder="Enter your email"
                      placeholderTextColor={COLORS.textSecondary}
                      value={email}
                      onChangeText={setEmail}
                      autoCapitalize="none"
                      keyboardType="email-address"
                    />
                  </View>
                </View>

                <View style={styles.inputContainer}>
                  <Text style={styles.inputLabel}>Password</Text>
                  <View style={styles.inputWrapper}>
                    <Ionicons name="lock-closed-outline" size={20} color={COLORS.textSecondary} style={styles.inputIcon} />
                    <TextInput
                      style={styles.input}
                      placeholder="Enter your password"
                      placeholderTextColor={COLORS.textSecondary}
                      value={password}
                      onChangeText={setPassword}
                      secureTextEntry={!passwordVisible}
                    />
                    <TouchableOpacity 
                      style={styles.passwordToggle}
                      onPress={() => setPasswordVisible(!passwordVisible)}
                    >
                      <Ionicons 
                        name={passwordVisible ? "eye-off-outline" : "eye-outline"} 
                        size={20} 
                        color={COLORS.textSecondary} 
                      />
                    </TouchableOpacity>
                  </View>
                </View>

                <Button
                  title="Log In"
                  onPress={handleLogin}
                  loading={isLoading}
                  style={styles.button}
                />

                {isBiometricSupported && (
                  <TouchableOpacity 
                    style={styles.biometricButton}
                    onPress={() => setShowBiometricPrompt(true)}
                    disabled={isLoading}
                  >
                    <Ionicons name={getBiometricIcon()} size={24} color={COLORS.primary} />
                    <Text style={styles.biometricText}>
                      Login with {biometricTypeName}
                    </Text>
                  </TouchableOpacity>
                )}
              </Card>
            ) : showBiometricPrompt ? (
              <Card style={styles.card} shadowType="medium">
                <View style={styles.biometricPromptContainer}>
                  <Ionicons name={getBiometricIcon()} size={64} color={COLORS.primary} style={styles.biometricPromptIcon} />
                  <Text style={styles.biometricPromptTitle}>Sign In</Text>
                  <Text style={styles.biometricPromptText}>
                    Use {biometricTypeName} to sign in to your account
                  </Text>
                  
                  <TouchableOpacity 
                    style={styles.usePasswordButton} 
                    onPress={handleBiometricCancel}
                  >
                    <Text style={styles.usePasswordText}>Use email and password instead</Text>
                  </TouchableOpacity>
                </View>
              </Card>
            ) : null}
            
            {/* Biometric enrollment prompt */}
            {showBiometricEnrollment && (
              <BiometricEnrollmentPrompt 
                onAccept={() => handleBiometricEnrollmentDecision(true)}
                onDecline={() => handleBiometricEnrollmentDecision(false)}
              />
            )}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  keyboardAvoidingView: {
    flex: 1,
  },
  scrollView: {
    flexGrow: 1,
    justifyContent: 'center',
  },
  container: {
    flex: 1,
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
  inputContainer: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: COLORS.text,
    marginBottom: 8,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: SIZES.radius,
    backgroundColor: COLORS.card,
    height: 50,
  },
  inputIcon: {
    marginLeft: 12,
  },
  input: {
    flex: 1,
    height: '100%',
    paddingHorizontal: 12,
    color: COLORS.text,
  },
  passwordToggle: {
    padding: 12,
  },
  button: {
    marginTop: 24,
    marginBottom: 16,
  },
  biometricButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
  },
  biometricText: {
    color: COLORS.primary,
    fontWeight: '500',
    marginLeft: 8,
  },
  biometricPromptContainer: {
    alignItems: 'center',
    padding: SIZES.padding,
  },
  biometricPromptIcon: {
    marginBottom: 20,
  },
  biometricPromptTitle: {
    fontSize: 24,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 8,
  },
  biometricPromptText: {
    fontSize: 16,
    color: COLORS.textSecondary,
    marginBottom: 32,
    textAlign: 'center',
  },
  usePasswordButton: {
    marginTop: 16,
    padding: 8,
  },
  usePasswordText: {
    color: COLORS.textSecondary,
    fontWeight: '500',
  },
  errorContainer: {
    backgroundColor: COLORS.danger + '20',
    padding: SIZES.padding,
    borderRadius: SIZES.radius,
    marginBottom: 16,
  },
  errorText: {
    color: COLORS.danger,
    fontWeight: '500',
  }
});

export default LoginScreen; 