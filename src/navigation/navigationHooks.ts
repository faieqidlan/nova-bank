import { useNavigation as useReactNavigation, StackActions, NavigationContainerRef } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList, MainTabParamList } from './types';

// Stack navigator
export type RootStackNavigationProp = StackNavigationProp<RootStackParamList>;
export const useNavigation = () => useReactNavigation<RootStackNavigationProp>();

// Tab navigator 
export type MainTabNavigationProp = StackNavigationProp<MainTabParamList>;
export const useTabNavigation = () => useReactNavigation<MainTabNavigationProp>(); 