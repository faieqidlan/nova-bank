export interface Transaction {
  id: string;
  amount: number;
  description: string;
  date: Date;
  type: 'credit' | 'debit';
  category?: string;
  merchant?: string;
  status: 'pending' | 'completed' | 'failed';
  reference?: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  isAuthenticated: boolean;
  // Optional personal details
  phoneNumber?: string;
  address?: string;
  // Firebase-related fields
  biometricPublicKey?: string;
  biometricKeyUpdatedAt?: any; // Firestore Timestamp
  createdAt?: any; // Firestore Timestamp
  lastLoginAt?: any; // Firestore Timestamp
  updatedAt?: any; // Firestore Timestamp
}

export type AuthStatus = 'idle' | 'authenticating' | 'authenticated' | 'unauthenticated' | 'error'; 