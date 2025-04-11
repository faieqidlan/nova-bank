import React, { useEffect, useMemo } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, Platform, View, ActivityIndicator } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { RootStackParamList, MainTabParamList } from './types';
import { COLORS } from '../constants/theme';
import { useAuth } from '../context/AuthContext';
import { useAuthPersistence } from '../hooks/useAuthPersistence';

// Import screens
import SplashScreen from '../screens/SplashScreen';
import OnboardingScreen from '../screens/OnboardingScreen';
import AuthScreen from '../screens/AuthScreen';
import LoginScreen from '../screens/LoginScreen';
import HomeScreen from '../screens/HomeScreen';
import TransactionsScreen from '../screens/TransactionsScreen';
import ProfileScreen from '../screens/ProfileScreen';
import TransactionDetailScreen from '../screens/TransactionDetailScreen';
import FaceIDTestScreen from '../screens/FaceIDTestScreen';

const Stack = createStackNavigator<RootStackParamList>();
const Tab = createBottomTabNavigator<MainTabParamList>();

const MainTabs = () => {
  const insets = useSafeAreaInsets();
  
  const tabBarStyle = useMemo(() => ({
    ...styles.tabBar,
    height: 60 + (insets.bottom > 0 ? insets.bottom : 16),
    paddingBottom: insets.bottom > 0 ? insets.bottom : 16,
  }), [insets.bottom]);
  
  return (
    <View style={styles.container}>
      <Tab.Navigator
        screenOptions={({ route }) => ({
          headerShown: false,
          tabBarIcon: ({ focused, color, size }) => {
            let iconName: keyof typeof Ionicons.glyphMap;

            if (route.name === 'Home') {
              iconName = focused ? 'home' : 'home-outline';
            } else if (route.name === 'Transactions') {
              iconName = focused ? 'list' : 'list-outline';
            } else if (route.name === 'Profile') {
              iconName = focused ? 'person' : 'person-outline';
            } else {
              iconName = 'alert-circle';
            }

            return <Ionicons name={iconName} size={size} color={color} />;
          },
          tabBarActiveTintColor: 'white',
          tabBarInactiveTintColor: 'rgba(255, 255, 255, 0.7)',
          tabBarStyle: tabBarStyle,
          tabBarItemStyle: styles.tabBarItem,
          tabBarShowLabel: true,
          tabBarLabelStyle: styles.tabBarLabel,
          headerStyle: styles.header,
          headerTintColor: COLORS.text,
          headerTitleStyle: styles.headerTitle,
        })}
      >
        <Tab.Screen name="Home" component={HomeScreen} />
        <Tab.Screen name="Transactions" component={TransactionsScreen} />
        <Tab.Screen name="Profile" component={ProfileScreen} />
      </Tab.Navigator>
    </View>
  );
};

// Loading component to render while checking AsyncStorage
const LoadingScreen = () => (
  <View style={styles.loadingContainer}>
    <ActivityIndicator size="large" color={COLORS.primary} />
  </View>
);

const AppNavigator = () => {
  const { authStatus } = useAuth();
  const { hasCheckedStorage, previouslyLoggedIn } = useAuthPersistence();

  // Show a loading indicator while checking storage, but inside NavigationContainer
  if (!hasCheckedStorage && authStatus === 'idle') {
    return (
      <NavigationContainer>
        <LoadingScreen />
      </NavigationContainer>
    );
  }

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {/* Initial loading and splash screen */}
        {authStatus === 'idle' && (
          <Stack.Screen 
            name="Splash" 
            component={SplashScreen} 
            options={{ headerShown: false }}
          />
        )}
        
        {/* Authentication flow */}
        {authStatus !== 'authenticated' && authStatus !== 'idle' && (
          <>
            <Stack.Screen name="Splash" component={SplashScreen} />
            <Stack.Screen name="Onboarding" component={OnboardingScreen} />
            <Stack.Screen 
              name="Auth" 
              component={AuthScreen} 
              initialParams={{ showBiometricPrompt: previouslyLoggedIn }}
            />
            <Stack.Screen name="Login" component={LoginScreen} />
          </>
        )}
        
        {/* Main app screens */}
        {authStatus === 'authenticated' && (
          <>
            <Stack.Screen name="Main" component={MainTabs} />
            <Stack.Screen 
              name="TransactionDetail" 
              component={TransactionDetailScreen} 
              options={{ 
                headerShown: false,
                title: 'Transaction Details',
                headerStyle: styles.header,
                headerTintColor: COLORS.text,
                headerTitleStyle: styles.headerTitle,
              }}
            />
            <Stack.Screen 
              name="FaceIDTest" 
              component={FaceIDTestScreen} 
              options={{ 
                headerShown: false,
                title: 'Face ID Test',
                headerStyle: styles.header,
                headerTintColor: COLORS.text,
                headerTitleStyle: styles.headerTitle,
              }}
            />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    position: 'relative',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.background,
  },
  tabBar: {
    position: 'absolute',
    bottom: 20,
    left: 20,
    right: 20,
    backgroundColor: COLORS.primary,
    borderRadius: 25,
    borderTopColor: 'transparent',
    marginHorizontal: 16,
    borderTopWidth: 0,
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    paddingTop: 12,
  },
  tabBarItem: {
    paddingVertical: 8,
  },
  tabBarLabel: {
    fontWeight: '600',
    fontSize: 12,
  },
  header: {
    backgroundColor: COLORS.background,
    elevation: 0,
    shadowOpacity: 0,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  headerTitle: {
    fontWeight: '600',
    fontSize: 16,
  },
});

export default React.memo(AppNavigator); 