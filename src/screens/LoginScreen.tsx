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
  ScrollView
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../navigation/types';
import { useAuth } from '../context/AuthContext';
import { COLORS, SIZES } from '../constants/theme';
import Button from '../components/common/Button';
import Card from '../components/common/Card';
import { Ionicons } from '@expo/vector-icons';

const LoginScreen: React.FC = () => {
  const navigation = useNavigation<StackNavigationProp<RootStackParamList>>();
  const { 
    authenticateWithCredentials, 
    authenticateWithBiometrics,
    isBiometricSupported,
    biometricTypeName,
    error: authError,
    clearError,
    isLoading 
  } = useAuth();
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  
  useEffect(() => {
    if (authError) {
      setErrorMessage(authError);
    }
  }, [authError]);
  
  const handleLogin = async () => {
    clearError();
    setErrorMessage(null);
    
    // Basic validation
    if (!email.trim()) {
      setErrorMessage('Please enter your email address');
      return;
    }
    
    if (!password) {
      setErrorMessage('Please enter your password');
      return;
    }
    
    // Perform login
    const success = await authenticateWithCredentials(email, password);
    
    if (success) {
      // Navigation is handled by the auth context
      console.log('Login successful');
    }
  };
  
  const handleBiometricLogin = async () => {
    clearError();
    setErrorMessage(null);
    
    const success = await authenticateWithBiometrics();
    
    if (!success && !authError) {
      setErrorMessage('Biometric authentication failed. Please try again or use email and password.');
    }
  };
  
  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        style={styles.keyboardAvoidView}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.header}>
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => navigation.goBack()}
            >
              <Ionicons name="arrow-back" size={24} color={COLORS.text} />
            </TouchableOpacity>
            <Text style={styles.title}>Welcome Back</Text>
          </View>
          
          <Card style={styles.card}>
            <View style={styles.formContainer}>
              {errorMessage && (
                <View style={styles.errorContainer}>
                  <Text style={styles.errorText}>{errorMessage}</Text>
                </View>
              )}
              
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Email</Text>
                <View style={styles.inputContainer}>
                  <Ionicons name="mail-outline" size={20} color={COLORS.textSecondary} style={styles.inputIcon} />
                  <TextInput
                    style={styles.input}
                    placeholder="Your email address"
                    value={email}
                    onChangeText={setEmail}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    placeholderTextColor={COLORS.textSecondary}
                  />
                </View>
              </View>
              
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Password</Text>
                <View style={styles.inputContainer}>
                  <Ionicons name="lock-closed-outline" size={20} color={COLORS.textSecondary} style={styles.inputIcon} />
                  <TextInput
                    style={styles.input}
                    placeholder="Your password"
                    value={password}
                    onChangeText={setPassword}
                    secureTextEntry={!passwordVisible}
                    placeholderTextColor={COLORS.textSecondary}
                  />
                  <TouchableOpacity
                    style={styles.visibilityIcon}
                    onPress={() => setPasswordVisible(!passwordVisible)}
                  >
                    <Ionicons
                      name={passwordVisible ? 'eye-off-outline' : 'eye-outline'}
                      size={20}
                      color={COLORS.textSecondary}
                    />
                  </TouchableOpacity>
                </View>
              </View>
              
              <TouchableOpacity style={styles.forgotPassword}>
                <Text style={styles.forgotPasswordText}>Forgot Password?</Text>
              </TouchableOpacity>
              
              <Button
                title="Login"
                onPress={handleLogin}
                style={styles.loginButton}
                loading={isLoading}
              />
              
              {isBiometricSupported && (
                <TouchableOpacity
                  style={styles.biometricButton}
                  onPress={handleBiometricLogin}
                  disabled={isLoading}
                >
                  <Ionicons
                    name={biometricTypeName === 'FaceID' ? 'scan-outline' : 'finger-print'}
                    size={22}
                    color={COLORS.primary}
                  />
                  <Text style={styles.biometricText}>
                    Login with {biometricTypeName}
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          </Card>
          
          <View style={styles.footer}>
            <Text style={styles.footerText}>Don't have an account?</Text>
            <TouchableOpacity onPress={() => navigation.navigate('Onboarding')}>
              <Text style={styles.signUpText}>Sign Up</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  keyboardAvoidView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    padding: SIZES.padding,
  },
  header: {
    marginBottom: 24,
    flexDirection: 'row',
    alignItems: 'center',
  },
  backButton: {
    padding: 8,
    marginRight: 12,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  card: {
    borderRadius: SIZES.radius,
    marginBottom: 24,
  },
  formContainer: {
    padding: SIZES.padding,
  },
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 8,
    color: COLORS.text,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: SIZES.radius,
    paddingHorizontal: 12,
    height: 48,
  },
  inputIcon: {
    marginRight: 8,
  },
  input: {
    flex: 1,
    height: '100%',
    color: COLORS.text,
  },
  visibilityIcon: {
    padding: 4,
  },
  forgotPassword: {
    alignSelf: 'flex-end',
    marginVertical: 16,
  },
  forgotPasswordText: {
    color: COLORS.primary,
    fontWeight: '500',
  },
  loginButton: {
    marginBottom: 16,
  },
  biometricButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    borderWidth: 1,
    borderColor: COLORS.primary,
    borderRadius: SIZES.radius,
    backgroundColor: 'transparent',
  },
  biometricText: {
    color: COLORS.primary,
    fontWeight: '500',
    marginLeft: 8,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginVertical: 16,
  },
  footerText: {
    color: COLORS.textSecondary,
  },
  signUpText: {
    color: COLORS.primary,
    fontWeight: '500',
    marginLeft: 4,
  },
  errorContainer: {
    backgroundColor: 'rgba(255, 0, 0, 0.1)',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  errorText: {
    color: COLORS.danger,
    textAlign: 'center',
  },
});

export default LoginScreen; 