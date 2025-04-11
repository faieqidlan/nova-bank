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
  Alert,
  Animated,
  Dimensions
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../navigation/types';
import { useAuth } from '../context/AuthContext';
import { useAuthPersistence } from '../hooks/useAuthPersistence';
import { COLORS, SIZES } from '../constants/theme';
import Button from '../components/common/Button';
import Card from '../components/common/Card';
import { Ionicons } from '@expo/vector-icons';

const { width } = Dimensions.get('window');

// Define the different steps in our onboarding flow
enum OnboardingStep {
  WELCOME = 'welcome',                 // Welcome screen with signup/login options
  EMAIL = 'email',                     // Email entry
  PASSWORD = 'password',               // Password entry (and confirmation for signup)
  NAME = 'name',                       // Name entry (for signup only)
  SUCCESS = 'success',                 // Registration successful
  BIOMETRIC_PERMISSION = 'permission', // Request permission for biometrics
  BIOMETRICS = 'biometrics',           // Biometrics setup
  LOGIN = 'login'                      // Login screen for returning users
}

const OnboardingScreen: React.FC = () => {
  const navigation = useNavigation<StackNavigationProp<RootStackParamList>>();
  const { 
    registerUser, 
    authenticateWithCredentials, 
    authenticateWithBiometrics, 
    isBiometricSupported, 
    biometricType,
    biometricTypeName,
    error, 
    clearError,
    isLoading 
  } = useAuth();
  
  const { completeOnboarding, setUserLoggedIn } = useAuthPersistence();
  
  // State variables for onboarding
  const [currentStep, setCurrentStep] = useState<OnboardingStep>(OnboardingStep.WELCOME);
  const [slideAnim] = useState(new Animated.Value(0));
  const [isSigningUp, setIsSigningUp] = useState(true);
  
  // Form state
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [name, setName] = useState('');
  const [passwordVisible, setPasswordVisible] = useState(false);
  
  useEffect(() => {
    if (error) {
      Alert.alert('Authentication Error', error, [
        { text: 'OK', onPress: clearError }
      ]);
    }
  }, [error]);
  
  // Animate transition between steps
  useEffect(() => {
    Animated.timing(slideAnim, {
      toValue: 0,
      duration: 300,
      useNativeDriver: true
    }).start();
  }, [currentStep]);

  // Redirect to Auth screen if user reaches LOGIN step
  useEffect(() => {
    if (currentStep === OnboardingStep.LOGIN) {
      // Navigate to Auth screen with biometric prompt
      navigation.navigate('Auth', { showBiometricPrompt: true });
    }
  }, [currentStep]);

  const animateToNextStep = (nextStep: OnboardingStep) => {
    Animated.timing(slideAnim, {
      toValue: -width,
      duration: 300,
      useNativeDriver: true
    }).start(() => {
      setCurrentStep(nextStep);
    });
  };

  const animateToPrevStep = (prevStep: OnboardingStep) => {
    Animated.timing(slideAnim, {
      toValue: width,
      duration: 300,
      useNativeDriver: true
    }).start(() => {
      setCurrentStep(prevStep);
    });
  };

  const handleStartSignup = () => {
    setIsSigningUp(true);
    animateToNextStep(OnboardingStep.EMAIL);
  };

  const handleStartLogin = () => {
    // Navigate directly to Auth screen instead of showing the login step
    navigation.navigate('Auth', { showBiometricPrompt: true });
  };
  
  const handleLoginSubmit = async () => {
    if (!email || !password) {
      Alert.alert('Missing Fields', 'Please enter both email and password');
      return;
    }
    
    const success = await authenticateWithCredentials(email, password);
    if (success) {
      // Navigate to Auth screen instead of waiting for AuthContext listener
      navigation.navigate('Auth', { showBiometricPrompt: true });
    }
  };
  
  const handleEmailContinue = () => {
    if (!email) {
      Alert.alert('Email Required', 'Please enter your email address');
      return;
    }
    
    // Simple email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      Alert.alert('Invalid Email', 'Please enter a valid email address');
      return;
    }
    
    animateToNextStep(OnboardingStep.PASSWORD);
  };
  
  const handlePasswordContinue = () => {
    if (!password) {
      Alert.alert('Password Required', 'Please create a password');
      return;
    }
    
    // Simple password validation
    if (password.length < 6) {
      Alert.alert('Weak Password', 'Password should be at least 6 characters long');
      return;
    }
    
    if (isSigningUp) {
      if (password !== confirmPassword) {
        Alert.alert('Password Mismatch', 'Passwords do not match');
        return;
      }
      
      animateToNextStep(OnboardingStep.NAME);
    } else {
      handleLoginSubmit();
    }
  };
  
  const handleNameContinue = async () => {
    if (!name) {
      Alert.alert('Name Required', 'Please enter your name');
      return;
    }
    
    const success = await registerUser(email, password, name);
    if (success) {
      animateToNextStep(OnboardingStep.SUCCESS);
    }
  };
  
  const handleSuccessContinue = () => {
    // Mark onboarding as complete
    completeOnboarding();
    
    if (isBiometricSupported) {
      // First prompt for permission before actual setup
      animateToNextStep(OnboardingStep.BIOMETRIC_PERMISSION);
    } else {
      // If biometrics not supported, proceed directly
      // Navigation to main app will be handled by AuthContext
      setUserLoggedIn();
      navigation.reset({
        index: 0,
        routes: [{ name: 'Main' }],
      });
    }
  };
  
  const handleEnableBiometrics = async () => {
    // Mark user as logged in for future reference
    setUserLoggedIn();
    await authenticateWithBiometrics();
    // Navigate to Auth screen after biometric authentication
    navigation.navigate('Auth', { showBiometricPrompt: true });
  };
  
  const handleSkipBiometrics = () => {
    // Mark user as logged in even if they skip biometrics
    setUserLoggedIn();
    // Navigate to main app - the AuthContext should already have authenticated the user
    navigation.reset({
      index: 0,
      routes: [{ name: 'Main' }],
    });
  };
  
  const handleBiometricLogin = async () => {
    await authenticateWithBiometrics();
    // Navigate to Auth screen instead of waiting for AuthContext listener
    navigation.navigate('Auth', { showBiometricPrompt: true });
  };
  
  const handleBack = () => {
    if (currentStep === OnboardingStep.EMAIL) {
      animateToPrevStep(OnboardingStep.WELCOME);
    } else if (currentStep === OnboardingStep.PASSWORD) {
      animateToPrevStep(OnboardingStep.EMAIL);
    } else if (currentStep === OnboardingStep.NAME) {
      animateToPrevStep(OnboardingStep.PASSWORD);
    } else if (currentStep === OnboardingStep.SUCCESS) {
      animateToPrevStep(OnboardingStep.NAME);
    }
  };
  
  const handlePermissionGranted = () => {
    // Move to actual biometrics setup after permission is granted
    animateToNextStep(OnboardingStep.BIOMETRICS);
  };
  
  const handlePermissionDenied = () => {
    // Skip biometrics if permission is denied
    handleSkipBiometrics();
  };
  
  const renderBackButton = () => {
    if (currentStep !== OnboardingStep.WELCOME && 
        currentStep !== OnboardingStep.SUCCESS && 
        currentStep !== OnboardingStep.BIOMETRICS &&
        currentStep !== OnboardingStep.BIOMETRIC_PERMISSION &&
        currentStep !== OnboardingStep.LOGIN) {
      return (
        <TouchableOpacity style={styles.backButton} onPress={handleBack}>
          <Ionicons name="arrow-back" size={24} color={COLORS.primary} />
        </TouchableOpacity>
      );
    }
    return null;
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
  
  const renderWelcomeStep = () => (
    <View style={styles.stepContainer}>
      <View style={styles.welcomeImageContainer}>
        <Ionicons name="shield-checkmark-outline" size={120} color={COLORS.primary} />
      </View>
      
      <Text style={styles.welcomeTitle}>Welcome to Ryt Bank</Text>
      <Text style={styles.welcomeSubtitle}>Secure banking at your fingertips</Text>
      
      <Button
        title="Get Started"
        onPress={handleStartSignup}
        style={styles.welcomeButton}
      />
      
      <Button
        title="I already have an account"
        onPress={handleStartLogin}
        variant="outline"
        style={styles.welcomeButton}
      />
    </View>
  );
  
  const renderLoginStep = () => (
    <View style={styles.stepContainer}>
      <Text style={styles.stepTitle}>Welcome Back</Text>
      <Text style={styles.stepSubtitle}>Sign in to your account</Text>
      
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
        title="Sign In"
        onPress={handleLoginSubmit}
        loading={isLoading}
        style={styles.continueButton}
      />
      
      {isBiometricSupported && (
        <TouchableOpacity 
          style={styles.biometricButton}
          onPress={handleBiometricLogin}
          disabled={isLoading}
        >
          <Ionicons name={getBiometricIcon()} size={24} color={COLORS.primary} />
          <Text style={styles.biometricText}>
            Login with {biometricTypeName}
          </Text>
        </TouchableOpacity>
      )}
      
      <TouchableOpacity
        style={styles.switchOption}
        onPress={() => {
          setIsSigningUp(true);
          animateToNextStep(OnboardingStep.EMAIL);
        }}
      >
        <Text style={styles.switchOptionText}>
          Don't have an account? <Text style={styles.switchOptionHighlight}>Sign Up</Text>
        </Text>
      </TouchableOpacity>
    </View>
  );
  
  const renderEmailStep = () => (
    <View style={styles.stepContainer}>
      <Text style={styles.stepTitle}>What's your email?</Text>
      <Text style={styles.stepSubtitle}>We'll use this for your account</Text>
      
      <View style={styles.inputContainer}>
        <Text style={styles.inputLabel}>Email Address</Text>
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
      
      <Button
        title="Continue"
        onPress={handleEmailContinue}
        style={styles.continueButton}
      />
    </View>
  );
  
  const renderPasswordStep = () => (
    <View style={styles.stepContainer}>
      <Text style={styles.stepTitle}>{isSigningUp ? 'Create a password' : 'Enter your password'}</Text>
      <Text style={styles.stepSubtitle}>{isSigningUp ? 'Make it secure and memorable' : 'Use your account password'}</Text>
      
      <View style={styles.inputContainer}>
        <Text style={styles.inputLabel}>Password</Text>
        <View style={styles.inputWrapper}>
          <Ionicons name="lock-closed-outline" size={20} color={COLORS.textSecondary} style={styles.inputIcon} />
          <TextInput
            style={styles.input}
            placeholder={isSigningUp ? "Create a password" : "Enter your password"}
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
      
      {isSigningUp && (
        <View style={styles.inputContainer}>
          <Text style={styles.inputLabel}>Confirm Password</Text>
          <View style={styles.inputWrapper}>
            <Ionicons name="lock-closed-outline" size={20} color={COLORS.textSecondary} style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="Confirm your password"
              placeholderTextColor={COLORS.textSecondary}
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              secureTextEntry={!passwordVisible}
            />
          </View>
        </View>
      )}
      
      <Button
        title="Continue"
        onPress={handlePasswordContinue}
        loading={isLoading && !isSigningUp}
        style={styles.continueButton}
      />
    </View>
  );
  
  const renderNameStep = () => (
    <View style={styles.stepContainer}>
      <Text style={styles.stepTitle}>What's your name?</Text>
      <Text style={styles.stepSubtitle}>Let us know what to call you</Text>
      
      <View style={styles.inputContainer}>
        <Text style={styles.inputLabel}>Full Name</Text>
        <View style={styles.inputWrapper}>
          <Ionicons name="person-outline" size={20} color={COLORS.textSecondary} style={styles.inputIcon} />
          <TextInput
            style={styles.input}
            placeholder="Enter your full name"
            placeholderTextColor={COLORS.textSecondary}
            value={name}
            onChangeText={setName}
            autoCapitalize="words"
          />
        </View>
      </View>
      
      <Button
        title="Complete Registration"
        onPress={handleNameContinue}
        loading={isLoading}
        style={styles.continueButton}
      />
    </View>
  );
  
  const renderSuccessStep = () => (
    <View style={styles.stepContainer}>
      <View style={styles.successIconContainer}>
        <Ionicons name="checkmark-circle" size={100} color={COLORS.primary} />
      </View>
      
      <Text style={styles.stepTitle}>Registration Successful!</Text>
      <Text style={styles.stepSubtitle}>Your account has been created</Text>
      
      <Button
        title="Continue"
        onPress={handleSuccessContinue}
        style={styles.continueButton}
      />
    </View>
  );
  
  
  const renderBiometricsStep = () => (
    <View style={styles.stepContainer}>
      <View style={styles.biometricIconContainer}>
        <Ionicons name={getBiometricIcon()} size={80} color={COLORS.primary} />
      </View>
      
      <Text style={styles.stepTitle}>Enable {biometricTypeName}</Text>
      <Text style={styles.stepSubtitle}>
        Use {biometricTypeName} for quick and secure access to your account
      </Text>
      
      <Button
        title={`Enable ${biometricTypeName}`}
        onPress={handleEnableBiometrics}
        loading={isLoading}
        style={styles.continueButton}
      />
      
      <Button
        title="Skip for now"
        onPress={handleSkipBiometrics}
        variant="outline"
        style={styles.skipButton}
      />
      
      <Text style={styles.biometricNote}>
        You can enable this later in your profile settings
      </Text>
    </View>
  );
  
  const renderCurrentStep = () => {
    switch (currentStep) {
      case OnboardingStep.WELCOME:
        return renderWelcomeStep();
      case OnboardingStep.LOGIN:
        // This step should never be shown now as we redirect in useEffect
        // but providing fallback to welcome step
        return renderWelcomeStep();
      case OnboardingStep.EMAIL:
        return renderEmailStep();
      case OnboardingStep.PASSWORD:
        return renderPasswordStep();
      case OnboardingStep.NAME:
        return renderNameStep();
      case OnboardingStep.SUCCESS:
        return renderSuccessStep();
      case OnboardingStep.BIOMETRICS:
        return renderBiometricsStep();
      default:
        return renderWelcomeStep();
    }
  };
  
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
            {renderBackButton()}
            
            <View style={styles.logoContainer}>
              <Text style={styles.logo}>Ryt</Text>
              <Text style={styles.logoSubtitle}>Bank</Text>
            </View>
            
            <Animated.View 
              style={[
                styles.stepWrapper,
                { transform: [{ translateX: slideAnim }] }
              ]}
            >
              {renderCurrentStep()}
            </Animated.View>
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
  },
  container: {
    flex: 1,
    padding: SIZES.padding,
    paddingTop: 40,
  },
  logoContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: 40,
    alignSelf: 'center',
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
  stepWrapper: {
    width: '100%',
    flex: 1,
  },
  stepContainer: {
    width: '100%',
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  welcomeImageContainer: {
    marginVertical: 40,
    alignItems: 'center',
  },
  welcomeTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: 12,
    textAlign: 'center',
  },
  welcomeSubtitle: {
    fontSize: 16,
    color: COLORS.textSecondary,
    marginBottom: 40,
    textAlign: 'center',
  },
  welcomeButton: {
    marginBottom: 16,
    width: '100%',
  },
  stepTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: 8,
    textAlign: 'center',
  },
  stepSubtitle: {
    fontSize: 16,
    color: COLORS.textSecondary,
    marginBottom: 32,
    textAlign: 'center',
  },
  inputContainer: {
    width: '100%',
    marginBottom: 20,
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
  continueButton: {
    marginTop: 12,
    width: '100%',
  },
  skipButton: {
    marginTop: 12,
    width: '100%',
  },
  backButton: {
    position: 'absolute',
    top: 10,
    left: 10,
    zIndex: 10,
    padding: 10,
  },
  switchOption: {
    marginTop: 24,
  },
  switchOptionText: {
    fontSize: 14,
    color: COLORS.textSecondary,
  },
  switchOptionHighlight: {
    color: COLORS.primary,
    fontWeight: 'bold',
  },
  successIconContainer: {
    marginVertical: 40,
    alignItems: 'center',
  },
  biometricIconContainer: {
    width: 150,
    height: 150,
    borderRadius: 75,
    backgroundColor: COLORS.primary + '15',
    justifyContent: 'center',
    alignItems: 'center',
    marginVertical: 30,
  },
  biometricButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    marginTop: 12,
  },
  biometricText: {
    color: COLORS.primary,
    marginLeft: 8,
    fontWeight: '500',
  },
  biometricNote: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginTop: 24,
    textAlign: 'center',
  }
});

export default OnboardingScreen; 