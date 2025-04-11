import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SIZES } from '../../constants/theme';
import { Transaction } from '../../types';
import { useAuth } from '../../context/AuthContext';

interface TransactionItemProps {
  transaction: Transaction;
  onPress: (transaction: Transaction) => void;
}

const TransactionItem: React.FC<TransactionItemProps> = ({ 
  transaction, 
  onPress 
}) => {
  const { isDataRevealed } = useAuth();
  const formattedDate = new Date(transaction.date).toLocaleDateString('en-US', {
    day: 'numeric',
    month: 'short',
  });

  // Handle positive amounts for credits and negative for debits
  const displayAmount = transaction.type === 'credit'
    ? `+RM${transaction.amount.toFixed(2)}`
    : `-RM${transaction.amount.toFixed(2)}`;

  const getIconName = () => {
    if (transaction.category === 'Income' || transaction.category === 'Freelance') {
      return 'cash';
    } else if (transaction.category === 'Transfer') {
      return 'swap-horizontal';
    } else if (transaction.category === 'Groceries' || transaction.category === 'Dining') {
      return 'restaurant';
    } else if (transaction.category === 'Shopping') {
      return 'cart';
    } else if (transaction.category === 'Utilities') {
      return 'flash';
    } else if (transaction.category === 'Housing') {
      return 'home';
    } else if (transaction.category === 'Entertainment') {
      return 'film';
    } else {
      return 'card';
    }
  };

  return (
    <TouchableOpacity 
      style={styles.container}
      onPress={() => onPress(transaction)}
      activeOpacity={0.7}
    >
      <View style={[
        styles.iconContainer,
        { backgroundColor: transaction.type === 'credit' ? COLORS.credit + '20' : COLORS.debit + '20' }
      ]}>
        <Ionicons 
          name={getIconName()} 
          size={22} 
          color={transaction.type === 'credit' ? COLORS.credit : COLORS.debit} 
        />
      </View>

      <View style={styles.details}>
        <Text style={styles.description} numberOfLines={1}>
          {transaction.description}
        </Text>
        <Text style={styles.merchant} numberOfLines={1}>
          {transaction.merchant} • {formattedDate}
        </Text>
      </View>

      <View style={styles.amountContainer}>
        {isDataRevealed ? (
          <Text style={[
            styles.amount,
            { color: transaction.type === 'credit' ? COLORS.credit : COLORS.debit }
          ]}>
            {displayAmount}
          </Text>
        ) : (
          <View style={styles.maskedAmount}>
            <Text style={styles.maskedText}>••••</Text>
          </View>
        )}
        <Text style={styles.status}>
          {transaction.status}
        </Text>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 12,
    marginBottom: 8,
    borderRadius: SIZES.radius,
    backgroundColor: COLORS.card,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  details: {
    flex: 1,
    justifyContent: 'center',
  },
  description: {
    fontSize: 16,
    fontWeight: '500',
    color: COLORS.text,
    marginBottom: 4,
  },
  merchant: {
    fontSize: 14,
    color: COLORS.textSecondary,
  },
  amountContainer: {
    alignItems: 'flex-end',
    marginLeft: 8,
  },
  amount: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  status: {
    fontSize: 12,
    color: COLORS.textSecondary,
    textTransform: 'capitalize',
  },
  maskedAmount: {
    backgroundColor: COLORS.maskBackground,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 8,
    marginBottom: 4,
  },
  maskedText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.maskText,
  },
});

export default TransactionItem; 