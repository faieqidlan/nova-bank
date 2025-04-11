import { Transaction } from '../types';

export const mockTransactions: Transaction[] = [
  {
    id: '1',
    amount: 1250.00,
    description: 'Salary Payment',
    date: new Date(2024, 9, 28),
    type: 'credit',
    category: 'Income',
    merchant: 'Nova Bank Inc.',
    status: 'completed',
    reference: 'SAL-OCT-2024'
  },
  {
    id: '2',
    amount: 120.50,
    description: 'Grocery Shopping',
    date: new Date(2024, 9, 29),
    type: 'debit',
    category: 'Groceries',
    merchant: 'Whole Foods',
    status: 'completed',
    reference: 'POS-29102024'
  },
  {
    id: '3',
    amount: 45.99,
    description: 'Dinner',
    date: new Date(2024, 9, 30),
    type: 'debit',
    category: 'Restaurants',
    merchant: 'Tasty Burgers',
    status: 'completed',
    reference: 'POS-30102024'
  },
  {
    id: '4',
    amount: 500.00,
    description: 'Rent Payment',
    date: new Date(2024, 10, 1),
    type: 'debit',
    category: 'Housing',
    merchant: 'Property Management',
    status: 'completed',
    reference: 'RENT-NOV-2024'
  },
  {
    id: '5',
    amount: 89.99,
    description: 'Electricity Bill',
    date: new Date(2024, 10, 2),
    type: 'debit',
    category: 'Utilities',
    merchant: 'Power Co',
    status: 'completed',
    reference: 'BILL-NOV-2024'
  },
  {
    id: '6',
    amount: 200.00,
    description: 'Money from Dad',
    date: new Date(2024, 10, 3),
    type: 'credit',
    category: 'Transfer',
    merchant: 'John Smith',
    status: 'completed',
    reference: 'TRF-03112024'
  },
  {
    id: '7',
    amount: 9.99,
    description: 'Streaming Subscription',
    date: new Date(2024, 10, 4),
    type: 'debit',
    category: 'Entertainment',
    merchant: 'StreamFlix',
    status: 'completed',
    reference: 'SUB-04112024'
  },
  {
    id: '8',
    amount: 59.99,
    description: 'Phone Bill',
    date: new Date(2024, 10, 5),
    type: 'debit',
    category: 'Utilities',
    merchant: 'Mobile Provider',
    status: 'completed',
    reference: 'BILL-05112024'
  },
  {
    id: '9',
    amount: 150.00,
    description: 'Clothing Purchase',
    date: new Date(2024, 10, 6),
    type: 'debit',
    category: 'Shopping',
    merchant: 'Fashion Outlet',
    status: 'completed',
    reference: 'POS-06112024'
  },
  {
    id: '10',
    amount: 35.00,
    description: 'Gym Membership',
    date: new Date(2024, 10, 7),
    type: 'debit',
    category: 'Fitness',
    merchant: 'FitLife Gym',
    status: 'completed',
    reference: 'SUB-07112024'
  },
  {
    id: '11',
    amount: 22.50,
    description: 'Lunch with Colleagues',
    date: new Date(2024, 10, 8),
    type: 'debit',
    category: 'Restaurants',
    merchant: 'Deli Corner',
    status: 'completed',
    reference: 'POS-08112024'
  },
  {
    id: '12',
    amount: 300.00,
    description: 'Insurance Payment',
    date: new Date(2024, 10, 10),
    type: 'debit',
    category: 'Insurance',
    merchant: 'SafeGuard Insurance',
    status: 'completed',
    reference: 'INS-NOV-2024'
  },
  {
    id: '13',
    amount: 75.00,
    description: 'Gift for Mom',
    date: new Date(2024, 10, 12),
    type: 'debit',
    category: 'Gifts',
    merchant: 'Gifts & More',
    status: 'completed',
    reference: 'POS-12112024'
  },
  {
    id: '14',
    amount: 350.00,
    description: 'Side Project Payment',
    date: new Date(2024, 10, 15),
    type: 'credit',
    category: 'Freelance',
    merchant: 'Client XYZ',
    status: 'completed',
    reference: 'INV-15112024'
  },
  {
    id: '15',
    amount: 42.99,
    description: 'Online Book Purchase',
    date: new Date(2024, 10, 16),
    type: 'debit',
    category: 'Education',
    merchant: 'Online Bookstore',
    status: 'completed',
    reference: 'ORD-16112024'
  },
  {
    id: '16',
    amount: 18.50,
    description: 'Coffee Shop',
    date: new Date(2024, 10, 17),
    type: 'debit',
    category: 'Dining',
    merchant: 'Brew Haven',
    status: 'completed',
    reference: 'POS-17112024'
  },
  {
    id: '17',
    amount: 120.00,
    description: 'Car Maintenance',
    date: new Date(2024, 10, 18),
    type: 'debit',
    category: 'Auto',
    merchant: 'Quick Service Garage',
    status: 'completed',
    reference: 'SRV-18112024'
  },
  {
    id: '18',
    amount: 80.00,
    description: 'Transfer to Savings',
    date: new Date(2024, 10, 20),
    type: 'debit',
    category: 'Transfer',
    merchant: 'Self',
    status: 'completed',
    reference: 'SAV-20112024'
  },
  {
    id: '19',
    amount: 1250.00,
    description: 'Bonus Payment',
    date: new Date(2024, 10, 22),
    type: 'credit',
    category: 'Income',
    merchant: 'Nova Bank Inc.',
    status: 'completed',
    reference: 'BON-NOV-2024'
  },
  {
    id: '20',
    amount: 65.99,
    description: 'Internet Bill',
    date: new Date(2024, 10, 25),
    type: 'debit',
    category: 'Utilities',
    merchant: 'ISP Provider',
    status: 'completed',
    reference: 'BILL-25112024'
  }
];

export const getTransactions = (): Promise<Transaction[]> => {
  return new Promise((resolve) => {
    // Simulate network delay
    setTimeout(() => {
      resolve(mockTransactions);
    }, 800);
  });
};

export const getTransactionById = (id: string): Promise<Transaction | undefined> => {
  return new Promise((resolve) => {
    // Simulate network delay
    setTimeout(() => {
      const transaction = mockTransactions.find(t => t.id === id);
      resolve(transaction);
    }, 500);
  });
}; 