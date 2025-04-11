import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity, 
  RefreshControl,
  ActivityIndicator,
  SafeAreaView
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import { Transaction } from '../types';
import { getTransactions } from '../services/mockData';
import { COLORS, SIZES } from '../constants/theme';
import { useAuth } from '../context/AuthContext';
import { useNavigation } from '../navigation/navigationHooks';
import { BiometricsService } from '../services/BiometricsService';
import AsyncStorage from '@react-native-async-storage/async-storage';

const HomeScreen: React.FC = () => {
  const [recentTransactions, setRecentTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showBiometricPrompt, setShowBiometricPrompt] = useState(false);
  const { user, isDataRevealed, toggleDataVisibility, isBiometricSupported } = useAuth();
  const navigation = useNavigation();

  useEffect(() => {
    loadData();
    checkBiometricEnrollment();
  }, []);

  const checkBiometricEnrollment = async () => {
    try {
      // Check if biometrics is available
      if (!isBiometricSupported) {
        return;
      }
      
      // Check if we've already shown the prompt before
      const hasPromptedBiometrics = await AsyncStorage.getItem('hasPromptedBiometrics');
      if (hasPromptedBiometrics === 'true') {
        return;
      }
      
      // Check if keys already exist
      const { keysExist } = await BiometricsService.biometricKeysExist();
      if (!keysExist) {
        // Show the prompt after a short delay to ensure the screen is loaded
        setTimeout(() => {
          setShowBiometricPrompt(true);
        }, 1000);
      }
      
      // Mark that we've shown the prompt
      await AsyncStorage.setItem('hasPromptedBiometrics', 'true');
    } catch (error) {
      console.error('Error checking biometric enrollment:', error);
    }
  };

  const handleCloseBiometricPrompt = () => {
    setShowBiometricPrompt(false);
  };

  const loadData = async () => {
    try {
      setLoading(true);
      const transactions = await getTransactions();
      // Sort by date (newest first) and get most recent 5
      const sorted = [...transactions].sort((a, b) => 
        new Date(b.date).getTime() - new Date(a.date).getTime()
      ).slice(0, 5);
      
      setRecentTransactions(sorted);
    } catch (error) {
      console.error('Error loading transaction data:', error);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const handleTransactionPress = (transaction: Transaction) => {
    navigation.navigate('TransactionDetail', { 
      transactionId: transaction.id 
    });
  };

  // Calculate account balances
  const accountBalance = 2750.42; // This would come from API in real app

  const renderTransactionItem = (transaction: Transaction) => {
    const getTransactionIcon = () => {
      if (transaction.type === 'credit' && transaction.description.includes('balance')) {
        return (
          <View style={styles.iconContainer}>
            <Ionicons name="add-circle" size={24} color={COLORS.primary} />
          </View>
        );
      } else if (transaction.merchant) {
        return (
          <View style={styles.merchantLogo}>
            <Text style={styles.merchantInitial}>{transaction.merchant.charAt(0)}</Text>
          </View>
        );
      } else if (transaction.description.includes('Card')) {
        return (
          <View style={styles.iconContainer}>
            <Ionicons name="card" size={24} color={COLORS.textSecondary} />
          </View>
        );
      } else if (transaction.type === 'credit') {
        return (
          <View style={styles.iconContainer}>
            <Ionicons name="arrow-down" size={24} color={COLORS.success} />
          </View>
        );
      } else {
        return (
          <View style={styles.iconContainer}>
            <Ionicons name="arrow-up" size={24} color={COLORS.danger} />
          </View>
        );
      }
    };

    return (
      <TouchableOpacity 
        style={styles.transactionItem}
        onPress={() => handleTransactionPress(transaction)}
        activeOpacity={0.7}
      >
        {getTransactionIcon()}
        
        <View style={styles.transactionDetails}>
          <Text style={styles.transactionTitle}>
            {transaction.merchant || transaction.description}
          </Text>
          <Text style={styles.transactionSubtitle}>
            {transaction.description.includes('balance') ? 'Added' : 
             transaction.type === 'credit' ? 'Received' : 'Sent'}
          </Text>
        </View>
        
        <View style={styles.amountContainer}>
          {isDataRevealed ? (
            <Text style={[
              styles.transactionAmount,
              transaction.type === 'credit' ? styles.creditAmount : styles.debitAmount
            ]}>
              {transaction.type === 'credit' ? '+ ' : ''}{transaction.amount} MYR
            </Text>
          ) : (
            <Text style={styles.transactionAmount}>•••••</Text>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView 
        style={styles.container}
        contentContainerStyle={styles.contentContainer}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[COLORS.primary]} />
        }
      >
        {/* Welcome Section */}
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>Hello,</Text>
            <Text style={styles.userName}>{user?.name || 'User'}</Text>
          </View>
          <TouchableOpacity style={styles.notificationIcon}>
            <Ionicons name="notifications-outline" size={24} color={COLORS.text} />
          </TouchableOpacity>
        </View>

        {/* Balance Card */}
        <Card style={styles.balanceCard} shadowType="medium">
          <View style={styles.balanceHeader}>
            <Text style={styles.balanceTitle}>Account Balance</Text>
            <TouchableOpacity onPress={toggleDataVisibility}>
              <Ionicons 
                name={isDataRevealed ? "eye" : "eye-off"} 
                size={20} 
                color={isDataRevealed ? COLORS.primary : COLORS.textSecondary} 
              />
            </TouchableOpacity>
          </View>
          
          {isDataRevealed ? (
            <Text style={styles.balanceAmount}>
              RM{accountBalance.toFixed(2)}
            </Text>
          ) : (
            <View style={styles.maskedBalance}>
              <Text style={styles.maskedText}>••••••</Text>
            </View>
          )}

          <View style={styles.actionButtons}>
            <Button 
              title="Send Money" 
              onPress={() => {}} 
              variant="outline" 
              style={styles.actionButton} 
            />
            <Button 
              title="Add Money" 
              onPress={() => {}} 
              style={styles.actionButton} 
            />
          </View>
        </Card>

        {/* Recent Transactions */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Recent Transactions</Text>
          <TouchableOpacity 
            style={styles.seeAllButton} 
            onPress={() => navigation.navigate('Transactions')}
          >
            <Text style={styles.seeAllButtonText}>See All</Text>
            <Ionicons name="chevron-forward" size={16} color={COLORS.primary} />
          </TouchableOpacity>
        </View>

        <Card style={styles.transactionsCard} shadowType="small">
          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={COLORS.primary} />
            </View>
          ) : recentTransactions.length > 0 ? (
            <>
              {recentTransactions.map((transaction, index) => (
                <React.Fragment key={transaction.id}>
                  {renderTransactionItem(transaction)}
                  {index < recentTransactions.length - 1 && <View style={styles.divider} />}
                </React.Fragment>
              ))}
            </>
          ) : (
            <View style={styles.emptyState}>
              <Ionicons name="receipt-outline" size={48} color={COLORS.textSecondary} />
              <Text style={styles.emptyStateText}>No recent transactions</Text>
            </View>
          )}
        </Card>

      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  contentContainer: {
    padding: SIZES.padding * 1.2,
    paddingTop: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  greeting: {
    fontSize: 16,
    color: COLORS.textSecondary,
  },
  userName: {
    fontSize: 22,
    fontWeight: '700',
    color: COLORS.text,
  },
  notificationIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.background === '#000000' ? '#333333' : '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  balanceCard: {
    marginBottom: 24,
    borderRadius: 16,
  },
  balanceHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  balanceTitle: {
    fontSize: 16,
    color: COLORS.textSecondary,
  },
  balanceAmount: {
    fontSize: 32,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: 20,
  },
  maskedBalance: {
    paddingVertical: 0,
    marginBottom: 20,
    alignSelf: 'flex-start',
  },
  maskedText: {
    fontSize: 32,
    fontWeight: 'bold',
    color: COLORS.textSecondary,
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  actionButton: {
    flex: 1,
    marginHorizontal: 4,
    borderRadius: 8,
    paddingVertical: 10,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    marginTop: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.text,
  },
  seeAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  seeAllButtonText: {
    fontSize: 14,
    color: COLORS.primary,
    fontWeight: '500',
    marginRight: 4,
  },
  transactionsCard: {
    marginBottom: 24,
  },
  loadingContainer: {
    padding: 24,
    alignItems: 'center',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    backgroundColor: 'transparent',
  },
  emptyStateText: {
    fontSize: 16,
    color: COLORS.textSecondary,
    marginTop: 16,
  },
  divider: {
    height: 0.5,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
  },
  transactionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 0,
    marginBottom: 8,
    borderBottomWidth: 0.5,
    borderBottomColor: 'rgba(255, 255, 255, 0.05)',
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
  },
  merchantLogo: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.primary,
  },
  merchantInitial: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  transactionDetails: {
    flex: 1,
    marginLeft: 12,
  },
  transactionTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: COLORS.text,
    marginBottom: 6,
  },
  transactionSubtitle: {
    fontSize: 14,
    color: COLORS.textSecondary,
  },
  amountContainer: {
    alignItems: 'flex-end',
    marginLeft: 12,
  },
  transactionAmount: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
  },
  creditAmount: {
    color: COLORS.success,
  },
  debitAmount: {
    color: COLORS.text,
  },
  featuredCard: {
    marginBottom: 24,
  },
  featuredContent: {
    flexDirection: 'row',
  },
  featuredTextContainer: {
    flex: 1,
    padding: 16,
  },
  featuredTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 8,
  },
  featuredDescription: {
    fontSize: 16,
    color: COLORS.textSecondary,
  },
  featuredButton: {
    marginTop: 16,
  },
  featuredImageContainer: {
    width: 120,
    height: 120,
    borderRadius: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  featuredImage: {
    width: '100%',
    height: '100%',
    borderRadius: 8,
  },
});

export default HomeScreen; 