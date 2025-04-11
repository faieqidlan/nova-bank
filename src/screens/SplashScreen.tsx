import React, { useEffect, useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  Image, 
  ActivityIndicator, 
  SafeAreaView, 
  Animated,
  Dimensions,
  Platform
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../context/AuthContext';
import { COLORS, SIZES } from '../constants/theme';
import { Ionicons } from '@expo/vector-icons';
import { useAuthPersistence } from '../hooks/useAuthPersistence';
import { BiometricsService } from '../services/BiometricsService';

const { width, height } = Dimensions.get('window');
const MINIMUM_SPLASH_DURATION = 2500; // 2.5 seconds minimum display time

const SplashScreen: React.FC = () => {
  const { authStatus, isBiometricSupported, biometricType } = useAuth();
  const { 
    hasCheckedStorage, 
    determineInitialRoute,
    hasCompletedOnboarding,
    previouslyLoggedIn
  } = useAuthPersistence();
  const navigation = useNavigation();
  const [isVisible, setIsVisible] = useState(true);

  // Animation values
  const opacity = useState(new Animated.Value(0))[0];
  const scale = useState(new Animated.Value(0.9))[0];

  useEffect(() => {
    // Start animation immediately
    Animated.parallel([
      Animated.timing(opacity, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.timing(scale, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
    ]).start();

    // Check FaceID permission early on iOS
    const checkBiometricPermission = async () => {
      if (Platform.OS === 'ios' && isBiometricSupported) {
        try {
          // Skip permission checking if user hasn't even onboarded yet
          if (!hasCompletedOnboarding) {
            console.log('Skipping biometric permission check - user has not completed onboarding');
            return;
          }
          
          console.log('Checking biometric availability on splash screen');
          const { available, biometryType } = await BiometricsService.isSensorAvailable();
          
          // We don't need to force permission during splash if user hasn't completed onboarding yet
          if (available && biometryType === 'FaceID' && hasCompletedOnboarding) {
            console.log('FaceID available, checking permission status');
            const { permissionGranted } = await BiometricsService.checkBiometricPermission();
            
            if (!permissionGranted) {
              console.log('FaceID permission not granted, attempting to request');
              // Just do a check - we'll prompt properly during the flow
              await BiometricsService.forcePermissionPrompt();
            } else {
              console.log('FaceID permission already granted');
            }
          }
        } catch (error) {
          console.log('Error checking biometric permission during splash:', error);
        }
      }
    };
    
    // Check biometric permission early
    checkBiometricPermission();

    // Set a timer for minimum display time
    const startTime = Date.now();
    
    const initializeApp = async () => {
      try {
        // Only navigate after we've checked AsyncStorage
        if (hasCheckedStorage) {
          // Determine initialRoute based on authentication status
          const initialRoute = determineInitialRoute();
          console.log('Initial route determined:', initialRoute);
          console.log('Previous login status:', previouslyLoggedIn);
          
          // Log biometric status for debugging
          if (previouslyLoggedIn && initialRoute === 'Auth') {
            console.log('User was previously logged in, will show biometric prompt');
            console.log('Biometric support available:', isBiometricSupported);
            if (isBiometricSupported) {
              console.log('Biometric type:', biometricType);
            }
          }
          
          // Calculate how much time has elapsed
          const elapsedTime = Date.now() - startTime;
          
          // If less than minimum duration, wait the remaining time
          if (elapsedTime < MINIMUM_SPLASH_DURATION) {
            const remainingTime = MINIMUM_SPLASH_DURATION - elapsedTime;
            console.log(`Waiting additional ${remainingTime}ms to complete minimum display duration`);
            await new Promise(resolve => setTimeout(resolve, remainingTime));
          }
          
          // Fade out before navigating
          Animated.parallel([
            Animated.timing(opacity, {
              toValue: 0,
              duration: 400,
              useNativeDriver: true,
            }),
            Animated.timing(scale, {
              toValue: 0.95,
              duration: 400,
              useNativeDriver: true,
            }),
          ]).start(() => {
            setIsVisible(false);
            // Navigate to the initialRoute using reset instead of navigate
            console.log(`Navigating to ${initialRoute} from splash screen`);
            
            // Reset the navigation stack instead of navigate to avoid the error
            navigation.reset({
              index: 0,
              routes: [{ 
                name: initialRoute as never,
                // Pass parameters if navigating to Auth and user was previously logged in
                params: initialRoute === 'Auth' && previouslyLoggedIn 
                  ? { showBiometricPrompt: true } as never
                  : undefined
              }],
            });
          });
        } else {
          console.log('Auth storage not checked yet, remaining on splash screen');
        }
      } catch (error) {
        console.error('Error initializing app from splash screen:', error);
      }
    };

    initializeApp();
  }, [navigation, hasCheckedStorage, determineInitialRoute]);

  if (!isVisible) return null;

  return (
    <View style={styles.container}>
      <Animated.View 
        style={[
          styles.logoContainer, 
          { 
            opacity, 
            transform: [{ scale }]
          }
        ]}
      >
        <Text style={styles.logo}>Ryt</Text>
        <Text style={styles.logoSubtitle}>Bank</Text>
      </Animated.View>
      
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="small" color={COLORS.background} />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'center',
  },
  logo: {
    fontSize: 60,
    fontWeight: 'bold',
    color: '#FFFFFF',
    letterSpacing: 1,
  },
  logoSubtitle: {
    fontSize: 40,
    fontWeight: '500',
    color: '#FFFFFF',
    marginLeft: 4,
    opacity: 0.9,
  },
  loadingContainer: {
    position: 'absolute',
    bottom: 100,
  },
});

export default SplashScreen; 