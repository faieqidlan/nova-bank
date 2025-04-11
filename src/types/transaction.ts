export interface Transaction {
  id: string;
  amount: number;
  description: string;
  date: number; // Unix timestamp in milliseconds
  type: 'debit' | 'credit';
  category: string;
  merchant: string;
  status: 'completed' | 'pending' | 'failed';
  reference: string;
} 