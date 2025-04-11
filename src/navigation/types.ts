import { Transaction } from '../types';

export type RootStackParamList = {
  Splash: undefined;
  Onboarding: undefined;
  Auth: { showBiometricPrompt?: boolean };
  Login: undefined;
  Main: undefined;
  Transactions: undefined;
  TransactionDetail: { transactionId: string };
  FaceIDTest: undefined;
};

export type MainTabParamList = {
  Home: undefined;
  Transactions: undefined;
  Profile: undefined;
}; 