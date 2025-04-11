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
        console.log('Initial storage check:', {
          hasLaunchedBefore,
          onboardingCompleted: await AsyncStorage.getItem('onboardingCompleted'),
          wasLoggedIn: await AsyncStorage.getItem('wasLoggedIn')
        });
        
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
      console.log('Setting onboarding completed flag');
      await AsyncStorage.setItem('onboardingCompleted', 'true');
      setHasCompletedOnboarding(true);
      console.log('Onboarding completed flag set successfully');
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
    
    console.log('Navigation Debug:', {
      currentUser: !!currentUser,
      previouslyLoggedIn,
      hasCompletedOnboarding,
      isFirstLaunch
    });
    
    if (currentUser) {
      console.log('Navigating to Main - User is authenticated');
      return 'Main';
    }
    
    if (previouslyLoggedIn) {
      console.log('Navigating to Auth - User was previously logged in');
      return 'Auth';
    }
    
    if (!hasCompletedOnboarding) {
      console.log('Navigating to Onboarding - User has not completed onboarding');
      return 'Onboarding';
    }
    
    console.log('Navigating to Auth - Default route for returning users');
    return 'Auth';
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