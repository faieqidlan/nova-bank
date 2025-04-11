import { Transaction } from '../types/transaction';

// Utility function to create a timestamp for a specific date and time
const createTimestamp = (year: number, month: number, day: number, hours: number = 0, minutes: number = 0, seconds: number = 0): number => {
  return new Date(year, month, day, hours, minutes, seconds).getTime();
};

export const mockTransactions: Transaction[] = [
  {
    id: '1',
    amount: 1250.00,
    description: 'Salary Payment',
    date: createTimestamp(2024, 9, 1, 9, 0, 0),
    type: 'credit',
    category: 'Income',
    merchant: 'Nova Bank Inc.',
    status: 'completed',
    reference: 'SAL-OCT-2024'
  },
  {
    id: '2',
    amount: 500.00,
    description: 'Rent Payment',
    date: createTimestamp(2024, 9, 1, 10, 15, 0),
    type: 'debit',
    category: 'Housing',
    merchant: 'Property Management',
    status: 'completed',
    reference: 'RENT-OCT-2024'
  },
  {
    id: '3',
    amount: 89.99,
    description: 'Electricity Bill',
    date: createTimestamp(2024, 9, 3, 8, 30, 0),
    type: 'debit',
    category: 'Utilities',
    merchant: 'Power Co',
    status: 'completed',
    reference: 'BILL-OCT-2024'
  },
  {
    id: '4',
    amount: 65.99,
    description: 'Internet Bill',
    date: createTimestamp(2024, 9, 3, 8, 35, 0),
    type: 'debit',
    category: 'Utilities',
    merchant: 'ISP Provider',
    status: 'completed',
    reference: 'BILL-OCT-2024'
  },
  {
    id: '5',
    amount: 59.99,
    description: 'Phone Bill',
    date: createTimestamp(2024, 9, 5, 8, 30, 0),
    type: 'debit',
    category: 'Utilities',
    merchant: 'Mobile Provider',
    status: 'completed',
    reference: 'BILL-OCT-2024'
  },
  {
    id: '6',
    amount: 9.99,
    description: 'Streaming Subscription',
    date: createTimestamp(2024, 9, 5, 12, 0, 0),
    type: 'debit',
    category: 'Entertainment',
    merchant: 'StreamFlix',
    status: 'completed',
    reference: 'SUB-OCT-2024'
  },
  {
    id: '7',
    amount: 35.00,
    description: 'Gym Membership',
    date: createTimestamp(2024, 9, 5, 12, 5, 0),
    type: 'debit',
    category: 'Fitness',
    merchant: 'FitLife Gym',
    status: 'completed',
    reference: 'SUB-OCT-2024'
  },
  {
    id: '8',
    amount: 300.00,
    description: 'Insurance Payment',
    date: createTimestamp(2024, 9, 7, 8, 30, 0),
    type: 'debit',
    category: 'Insurance',
    merchant: 'SafeGuard Insurance',
    status: 'completed',
    reference: 'INS-OCT-2024'
  },
  {
    id: '9',
    amount: 120.50,
    description: 'Grocery Shopping',
    date: createTimestamp(2024, 9, 8, 14, 30, 0),
    type: 'debit',
    category: 'Groceries',
    merchant: 'Whole Foods',
    status: 'completed',
    reference: 'POS-08102024'
  },
  {
    id: '10',
    amount: 45.99,
    description: 'Dinner',
    date: createTimestamp(2024, 9, 8, 19, 45, 0),
    type: 'debit',
    category: 'Restaurants',
    merchant: 'Tasty Burgers',
    status: 'completed',
    reference: 'POS-08102024'
  },
  {
    id: '11',
    amount: 18.50,
    description: 'Coffee Shop',
    date: createTimestamp(2024, 9, 10, 8, 15, 0),
    type: 'debit',
    category: 'Dining',
    merchant: 'Brew Haven',
    status: 'completed',
    reference: 'POS-10102024'
  },
  {
    id: '12',
    amount: 22.50,
    description: 'Lunch with Colleagues',
    date: createTimestamp(2024, 9, 12, 12, 30, 0),
    type: 'debit',
    category: 'Restaurants',
    merchant: 'Deli Corner',
    status: 'completed',
    reference: 'POS-12102024'
  },
  {
    id: '13',
    amount: 150.00,
    description: 'Clothing Purchase',
    date: createTimestamp(2024, 9, 15, 16, 20, 0),
    type: 'debit',
    category: 'Shopping',
    merchant: 'Fashion Outlet',
    status: 'completed',
    reference: 'POS-15102024'
  },
  {
    id: '14',
    amount: 42.99,
    description: 'Online Book Purchase',
    date: createTimestamp(2024, 9, 16, 21, 15, 0),
    type: 'debit',
    category: 'Education',
    merchant: 'Online Bookstore',
    status: 'completed',
    reference: 'ORD-16102024'
  },
  {
    id: '15',
    amount: 120.00,
    description: 'Car Maintenance',
    date: createTimestamp(2024, 9, 18, 10, 0, 0),
    type: 'debit',
    category: 'Auto',
    merchant: 'Quick Service Garage',
    status: 'completed',
    reference: 'SRV-18102024'
  },
  {
    id: '16',
    amount: 80.00,
    description: 'Transfer to Savings',
    date: createTimestamp(2024, 9, 20, 15, 0, 0),
    type: 'debit',
    category: 'Transfer',
    merchant: 'Self',
    status: 'completed',
    reference: 'SAV-20102024'
  },
  {
    id: '17',
    amount: 75.00,
    description: 'Gift for Mom',
    date: createTimestamp(2024, 9, 22, 13, 45, 0),
    type: 'debit',
    category: 'Gifts',
    merchant: 'Gifts & More',
    status: 'completed',
    reference: 'POS-22102024'
  },
  {
    id: '18',
    amount: 200.00,
    description: 'Money from Dad',
    date: createTimestamp(2024, 9, 25, 11, 30, 0),
    type: 'credit',
    category: 'Transfer',
    merchant: 'John Smith',
    status: 'completed',
    reference: 'TRF-25102024'
  },
  {
    id: '19',
    amount: 350.00,
    description: 'Side Project Payment',
    date: createTimestamp(2024, 9, 28, 17, 0, 0),
    type: 'credit',
    category: 'Freelance',
    merchant: 'Client XYZ',
    status: 'completed',
    reference: 'INV-28102024'
  },
  {
    id: '20',
    amount: 1250.00,
    description: 'Bonus Payment',
    date: createTimestamp(2024, 9, 31, 9, 0, 0),
    type: 'credit',
    category: 'Income',
    merchant: 'Nova Bank Inc.',
    status: 'completed',
    reference: 'BON-OCT-2024'
  }
];

// Utility function to format date for display
export const formatTransactionDate = (timestamp: number): string => {
  const date = new Date(timestamp);
  return date.toLocaleString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true
  });
};

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