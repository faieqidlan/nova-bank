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

// Simplified onboarding steps
enum OnboardingStep {
  WELCOME = 'WELCOME',
  EMAIL = 'email',
  PASSWORD = 'password',
  NAME = 'NAME',
  BIOMETRIC_SETUP = 'BIOMETRIC_SETUP',
  PASSCODE_SETUP = 'PASSCODE_SETUP',
  SUCCESS = 'SUCCESS'
}

const OnboardingScreen: React.FC = () => {
  const navigation = useNavigation<StackNavigationProp<RootStackParamList>>();
  const { 
    registerUser, 
    authenticateWithCredentials, 
    isBiometricSupported, 
    biometricType,
    biometricTypeName,
    error, 
    clearError,
    isLoading 
  } = useAuth();
  
  const { completeOnboarding } = useAuthPersistence();
  
  // State variables
  const [currentStep, setCurrentStep] = useState<OnboardingStep>(OnboardingStep.WELCOME);
  const [slideAnim] = useState(new Animated.Value(0));
  
  // Form state
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [name, setName] = useState('');
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [enableBiometrics, setEnableBiometrics] = useState(true);
  
  // Progress tracking
  const totalSteps = Object.keys(OnboardingStep).length;
  const currentStepIndex = Object.values(OnboardingStep).indexOf(currentStep);
  const progress = (currentStepIndex / (totalSteps - 1)) * 100;
  
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
    animateToNextStep(OnboardingStep.EMAIL);
  };

  const handleReturnUserLogin = () => {
    navigation.navigate('Auth', { showBiometricPrompt: true });
  };
  
  const handleEmailContinue = () => {
    if (!email) {
      Alert.alert('Email Required', 'Please enter your email address');
      return;
    }
    
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
    
    if (password.length < 8) {
      Alert.alert('Weak Password', 'Password should be at least 8 characters long');
      return;
    }
    
    if (password !== confirmPassword) {
      Alert.alert('Password Mismatch', 'Passwords do not match');
      return;
    }
    
    animateToNextStep(OnboardingStep.NAME);
  };
  
  const handleNameContinue = async () => {
    if (!name) {
      Alert.alert('Name Required', 'Please enter your name');
      return;
    }

    // Instead of registering here, just move to the next step
    if (isBiometricSupported) {
      console.log('Biometrics supported, navigating to biometric setup');
      animateToNextStep(OnboardingStep.BIOMETRIC_SETUP);
    } else {
      console.log('Biometrics not supported, navigating to passcode setup');
      animateToNextStep(OnboardingStep.PASSCODE_SETUP);
    }
  };
  
  const handleBiometricSetup = async () => {
    try {
      // Skip authentication since user is already in onboarding flow
      // Proceed directly to passcode setup
      animateToNextStep(OnboardingStep.PASSCODE_SETUP);
    } catch (error) {
      console.error('Biometric setup error:', error);
      Alert.alert(
        'Setup Error',
        'You can still set up a passcode for secure access.',
        [{ text: 'Continue', onPress: () => animateToNextStep(OnboardingStep.PASSCODE_SETUP) }]
      );
    }
  };
  
  const skipBiometricSetup = () => {
    // Instead of going directly to success, go to passcode setup
    animateToNextStep(OnboardingStep.PASSCODE_SETUP);
  };
  
  const handleBack = () => {
    switch (currentStep) {
      case OnboardingStep.EMAIL:
        animateToPrevStep(OnboardingStep.WELCOME);
        break;
      case OnboardingStep.PASSWORD:
        animateToPrevStep(OnboardingStep.EMAIL);
        break;
      case OnboardingStep.NAME:
        animateToPrevStep(OnboardingStep.PASSWORD);
        break;
      case OnboardingStep.BIOMETRIC_SETUP:
        animateToPrevStep(OnboardingStep.NAME);
        break;
    }
  };
  
  const handleSuccess = async () => {
    try {
      console.log('Starting user registration...');
      const success = await registerUser(email, password, name);
      console.log('Registration result:', success);
      
      if (success) {
        completeOnboarding();
        navigation.navigate('Main');
      } else {
        console.error('Registration returned false');
        Alert.alert('Registration Failed', 'Please try again');
      }
    } catch (error) {
      console.error('Registration error:', error);
      Alert.alert('Registration Failed', 'Please try again');
    }
  };
  
  const renderProgressBar = () => (
    <View style={styles.progressContainer}>
      <View style={styles.progressBar}>
        <View style={[styles.progressFill, { width: `${progress}%` }]} />
      </View>
      <Text style={styles.progressText}>
        Step {currentStepIndex + 1} of {totalSteps}
      </Text>
    </View>
  );
  
  const renderBackButton = () => {
    if (currentStep !== OnboardingStep.WELCOME && 
        currentStep !== OnboardingStep.SUCCESS) {
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
      <Animated.View style={[styles.stepContent, { transform: [{ translateX: slideAnim }] }]}>
        <View style={styles.logoContainer}>
          <View style={styles.logoCircle}>
            <Ionicons name="wallet-outline" size={80} color={COLORS.primary} />
          </View>
          <Text style={styles.appName}>Nova Bank</Text>
        </View>
        
        <View style={styles.welcomeContent}>
          <Text style={styles.welcomeText}>
            Welcome to Nova Bank
          </Text>
          
          <Text style={styles.descriptionText}>
            Your secure financial companion for managing money with ease and confidence
          </Text>
          
          <View style={styles.featuresContainer}>
            <View style={styles.featureItem}>
              <Ionicons name="shield-checkmark-outline" size={24} color={COLORS.primary} />
              <Text style={styles.featureText}>Bank-Grade Security</Text>
            </View>
            <View style={styles.featureItem}>
              <Ionicons name="finger-print" size={24} color={COLORS.primary} />
              <Text style={styles.featureText}>Biometric Authentication</Text>
            </View>
            <View style={styles.featureItem}>
              <Ionicons name="card-outline" size={24} color={COLORS.primary} />
              <Text style={styles.featureText}>Smart Money Management</Text>
            </View>
          </View>
        </View>
        
        <View style={styles.buttonsContainer}>
          <Button
            title="Get Started"
            onPress={handleStartSignup}
            style={styles.primaryButton}
          />
          
          <Button
            title="I Already Have an Account"
            onPress={handleReturnUserLogin}
            variant="outline"
            style={styles.secondaryButton}
          />
        </View>
      </Animated.View>
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
      <Text style={styles.stepTitle}>Create a password</Text>
      <Text style={styles.stepSubtitle}>Make it secure and memorable</Text>
      
      <View style={styles.inputContainer}>
        <Text style={styles.inputLabel}>Password</Text>
        <View style={styles.inputWrapper}>
          <Ionicons name="lock-closed-outline" size={20} color={COLORS.textSecondary} style={styles.inputIcon} />
          <TextInput
            style={styles.input}
            placeholder="Create a password"
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
      
      <Button
        title="Continue"
        onPress={handlePasswordContinue}
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
        title="Continue"
        onPress={handleNameContinue}
        loading={isLoading}
        style={styles.continueButton}
      />
    </View>
  );
  
  const renderBiometricSetupStep = () => (
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
        onPress={handleBiometricSetup}
        loading={isLoading}
        style={styles.continueButton}
      />
      
      <Button
        title="Skip for now"
        onPress={() => animateToNextStep(OnboardingStep.PASSCODE_SETUP)}
        variant="outline"
        style={styles.skipButton}
      />
      
      <Text style={styles.biometricNote}>
        You can enable this later in your profile settings
      </Text>
    </View>
  );
  
  const renderPasscodeSetupStep = () => (
    <View style={styles.stepContainer}>
      <View style={styles.biometricIconContainer}>
        <Ionicons name="lock-closed" size={80} color={COLORS.primary} />
      </View>
      
      <Text style={styles.stepTitle}>Set Up Passcode</Text>
      <Text style={styles.stepSubtitle}>
        Create a secure passcode for accessing your account
      </Text>
      
      <Button
        title="Set Up Passcode"
        onPress={() => animateToNextStep(OnboardingStep.SUCCESS)}
        style={styles.continueButton}
      />
      
      <Button
        title="Skip for now"
        onPress={() => animateToNextStep(OnboardingStep.SUCCESS)}
        variant="outline"
        style={styles.skipButton}
      />
      
      <Text style={styles.biometricNote}>
        You can set up a passcode later in your profile settings
      </Text>
    </View>
  );
  
  const renderSuccessStep = () => (
    <View style={styles.stepContainer}>
      <View style={styles.successIconContainer}>
        <Ionicons name="checkmark-circle" size={100} color={COLORS.primary} />
      </View>
      
      <Text style={styles.stepTitle}>Ready to Complete</Text>
      <Text style={styles.stepSubtitle}>Let's create your account</Text>
      
      <Button
        title="Complete Registration"
        onPress={handleSuccess}
        loading={isLoading}
        style={styles.continueButton}
      />
    </View>
  );
  
  const renderStep = () => {
    switch (currentStep) {
      case OnboardingStep.WELCOME:
        return renderWelcomeStep();
      case OnboardingStep.EMAIL:
        return renderEmailStep();
      case OnboardingStep.PASSWORD:
        return renderPasswordStep();
      case OnboardingStep.NAME:
        return renderNameStep();
      case OnboardingStep.BIOMETRIC_SETUP:
        return renderBiometricSetupStep();
      case OnboardingStep.PASSCODE_SETUP:
        return renderPasscodeSetupStep();
      case OnboardingStep.SUCCESS:
        return renderSuccessStep();
      default:
        return renderWelcomeStep();
    }
  };
  
  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardAvoidView}
      >
        <ScrollView 
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          {renderProgressBar()}
          {renderBackButton()}
          {renderStep()}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: SIZES.padding,
    paddingTop: 40,
  },
  keyboardAvoidView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
  progressContainer: {
    width: '100%',
    paddingHorizontal: 16,
    marginBottom: 24,
  },
  progressBar: {
    height: 4,
    backgroundColor: COLORS.border,
    borderRadius: 2,
    marginBottom: 8,
  },
  progressFill: {
    height: '100%',
    backgroundColor: COLORS.primary,
    borderRadius: 2,
  },
  progressText: {
    fontSize: 12,
    color: COLORS.textSecondary,
    textAlign: 'right',
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 40,
  },
  logoCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: COLORS.primary + '15',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  appName: {
    fontSize: 32,
    fontWeight: 'bold',
    color: COLORS.text,
    letterSpacing: 1,
  },
  welcomeContent: {
    width: '100%',
    alignItems: 'center',
    marginBottom: 40,
  },
  welcomeText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: 16,
    textAlign: 'center',
  },
  descriptionText: {
    fontSize: 16,
    color: COLORS.textSecondary,
    marginBottom: 32,
    textAlign: 'center',
    lineHeight: 24,
  },
  featuresContainer: {
    width: '100%',
    gap: 16,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: COLORS.card,
    borderRadius: SIZES.radius,
    gap: 12,
  },
  featureText: {
    fontSize: 16,
    color: COLORS.text,
    fontWeight: '500',
  },
  buttonsContainer: {
    width: '100%',
    gap: 16,
  },
  primaryButton: {
    width: '100%',
  },
  secondaryButton: {
    width: '100%',
  },
  stepContainer: {
    width: '100%',
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  stepContent: {
    width: '100%',
    alignItems: 'center',
    paddingHorizontal: 16,
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
  biometricNote: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginTop: 24,
    textAlign: 'center',
  }
});

export default OnboardingScreen; 