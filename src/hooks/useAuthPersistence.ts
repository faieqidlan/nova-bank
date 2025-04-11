import { useState, useEffect } from 'react';
import { FirebaseService } from '../services/FirebaseService';
import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * Custom hook to handle authentication persistence
 * @returns An object containing variables and functions related to auth persistence
 */
export const useAuthPersistence = () => {
  const [isFirstLaunch, setIsFirstLaunch] = useState<boolean | null>(null);
  const [hasCompletedOnboarding, setHasCompletedOnboarding] = useState<boolean>(false);
  const [previouslyLoggedIn, setPreviouslyLoggedIn] = useState<boolean>(false);
  const [hasCheckedStorage, setHasCheckedStorage] = useState<boolean>(false);

  // Check if this is the first time launching the app
  useEffect(() => {
    const checkFirstLaunch = async () => {
      try {
        const hasLaunchedBefore = await AsyncStorage.getItem('hasLaunchedBefore');
        
        if (hasLaunchedBefore === null) {
          // This is the first launch
          setIsFirstLaunch(true);
          await AsyncStorage.setItem('hasLaunchedBefore', 'true');
        } else {
          // This is not the first launch
          setIsFirstLaunch(false);
        }
        
        // Check if user has completed the onboarding flow
        const onboardingCompleted = await AsyncStorage.getItem('onboardingCompleted');
        setHasCompletedOnboarding(onboardingCompleted === 'true');
        
        // Check if user was previously logged in (but might have been logged out due to token expiry)
        const wasLoggedIn = await AsyncStorage.getItem('wasLoggedIn');
        setPreviouslyLoggedIn(wasLoggedIn === 'true');
        
        setHasCheckedStorage(true);
      } catch (error) {
        console.error('Error checking if first launch:', error);
        setIsFirstLaunch(true);
        setHasCheckedStorage(true);
      }
    };
    
    checkFirstLaunch();
  }, []);

  /**
   * Mark the onboarding flow as completed
   */
  const completeOnboarding = async () => {
    try {
      await AsyncStorage.setItem('onboardingCompleted', 'true');
      setHasCompletedOnboarding(true);
    } catch (error) {
      console.error('Error setting onboarding completed:', error);
    }
  };

  /**
   * Mark the user as logged in for future reference
   */
  const setUserLoggedIn = async () => {
    try {
      console.log('Setting user as logged in via useAuthPersistence');
      await AsyncStorage.setItem('wasLoggedIn', 'true');
      setPreviouslyLoggedIn(true);
      console.log('User logged in status set successfully');
    } catch (error) {
      console.error('Error setting user logged in status:', error);
    }
  };

  /**
   * Clear the logged in status when user explicitly logs out
   */
  const clearLoginStatus = async () => {
    try {
      await AsyncStorage.removeItem('wasLoggedIn');
      setPreviouslyLoggedIn(false);
    } catch (error) {
      console.error('Error clearing logged in status:', error);
    }
  };

  /**
   * Determine where to navigate after splash screen
   */
  const determineInitialRoute = (): 'Onboarding' | 'Main' | 'Auth' => {
    // Check if there's a current Firebase user
    const currentUser = FirebaseService.getCurrentUser();
    
    if (currentUser) {
      // User is currently authenticated with Firebase, go to main app
      return 'Main';
    }
    
    if (!hasCompletedOnboarding) {
      // User hasn't completed onboarding, show onboarding flow
      return 'Onboarding';
    }
    
    if (previouslyLoggedIn) {
      // User was previously logged in but needs to authenticate with biometrics
      return 'Auth';
    }
    
    // Default to onboarding for new users
    return 'Onboarding';
  };

  return {
    isFirstLaunch,
    hasCompletedOnboarding,
    previouslyLoggedIn,
    hasCheckedStorage,
    completeOnboarding,
    setUserLoggedIn,
    clearLoginStatus,
    determineInitialRoute
  };
}; 