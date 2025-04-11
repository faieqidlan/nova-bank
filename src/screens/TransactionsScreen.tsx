import React, { useState, useEffect, useMemo } from 'react';
import { 
  View, 
  StyleSheet, 
  Text, 
  ActivityIndicator, 
  RefreshControl,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
  SectionList
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Transaction } from '../types';
import { getTransactions } from '../services/mockData';
import { COLORS, SIZES } from '../constants/theme';
import { useAuth } from '../context/AuthContext';
import { useNavigation } from '../navigation/navigationHooks';

type TransactionSection = {
  title: string;
  data: Transaction[];
};

const TransactionsScreen: React.FC = () => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [filteredTransactions, setFilteredTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedFilter, setSelectedFilter] = useState<string | null>(null);
  const { isDataRevealed, toggleDataVisibility } = useAuth();
  const navigation = useNavigation();

  useEffect(() => {
    loadTransactions();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [transactions, selectedFilter]);

  const loadTransactions = async () => {
    try {
      setLoading(true);
      const data = await getTransactions();
      // Sort by date (newest first)
      const sorted = [...data].sort((a, b) => 
        new Date(b.date).getTime() - new Date(a.date).getTime()
      );
      setTransactions(sorted);
      setFilteredTransactions(sorted);
    } catch (error) {
      console.error('Error loading transactions:', error);
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...transactions];
    
    // Apply category filter
    if (selectedFilter) {
      filtered = filtered.filter(t => t.category === selectedFilter);
    }
    
    setFilteredTransactions(filtered);
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadTransactions();
    setRefreshing(false);
  };

  const handleTransactionPress = (transaction: Transaction) => {
    navigation.navigate('TransactionDetail', { 
      transactionId: transaction.id 
    });
  };

  // Extract unique categories from transactions
  const categories = useMemo(() => {
    const uniqueCategories = new Set<string>();
    transactions.forEach(t => {
      if (t.category) {
        uniqueCategories.add(t.category);
      }
    });
    return Array.from(uniqueCategories);
  }, [transactions]);

  // Group transactions by date
  const transactionSections = useMemo(() => {
    const sections: TransactionSection[] = [];
    const dateMap = new Map<string, Transaction[]>();

    // Group transactions by date
    filteredTransactions.forEach(transaction => {
      const date = new Date(transaction.date);
      const dateString = date.toLocaleDateString('en-US', {
        day: 'numeric',
        month: 'short',
        year: 'numeric'
      });
      
      if (!dateMap.has(dateString)) {
        dateMap.set(dateString, []);
      }
      dateMap.get(dateString)?.push(transaction);
    });

    // Convert map to array of sections
    dateMap.forEach((transactions, date) => {
      sections.push({
        title: date,
        data: transactions
      });
    });

    // Sort sections by date (newest first)
    sections.sort((a, b) => {
      const dateA = new Date(a.data[0].date);
      const dateB = new Date(b.data[0].date);
      return dateB.getTime() - dateA.getTime();
    });

    return sections;
  }, [filteredTransactions]);

  const FilterButton = ({ label, filterName }: { label: string, filterName: string | null }) => (
    <TouchableOpacity 
      style={[
        styles.filterButton,
        selectedFilter === filterName && styles.filterButtonActive
      ]}
      onPress={() => setSelectedFilter(filterName)}
    >
      <Text style={[
        styles.filterButtonText,
        selectedFilter === filterName && styles.filterButtonTextActive
      ]}>
        {label}
      </Text>
    </TouchableOpacity>
  );

  const renderHeader = () => (
    <View style={styles.headerWrapper}>
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.filtersContainer}
      >
        <FilterButton label="All" filterName={null} />
        {categories.map(category => (
          <FilterButton key={category} label={category} filterName={category} />
        ))}
      </ScrollView>
    </View>
  );

  const renderSectionHeader = ({ section }: { section: TransactionSection }) => (
    <View style={styles.sectionHeader}>
      <Text style={styles.sectionTitle}>{section.title}</Text>
    </View>
  );

  const renderEmpty = () => (
    <View style={styles.emptyContainer}>
      <Ionicons name="receipt-outline" size={60} color={COLORS.textSecondary} />
      <Text style={styles.emptyText}>No transactions found</Text>
    </View>
  );

  const renderTransactionItem = ({ item }: { item: Transaction }) => {
    const getTransactionIcon = () => {
      if (item.type === 'credit' && item.description.includes('balance')) {
        return (
          <View style={styles.iconContainer}>
            <Ionicons name="add-circle" size={24} color={COLORS.primary} />
          </View>
        );
      } else if (item.merchant) {
        return (
          <View style={styles.merchantLogo}>
            <Text style={styles.merchantInitial}>{item.merchant.charAt(0)}</Text>
          </View>
        );
      } else if (item.description.includes('Card')) {
        return (
          <View style={styles.iconContainer}>
            <Ionicons name="card" size={24} color={COLORS.textSecondary} />
          </View>
        );
      } else if (item.type === 'credit') {
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
        onPress={() => handleTransactionPress(item)}
        activeOpacity={0.7}
      >
        {getTransactionIcon()}
        
        <View style={styles.transactionDetails}>
          <Text style={styles.transactionTitle}>
            {item.merchant || item.description}
          </Text>
          <Text style={styles.transactionSubtitle}>
            {item.description.includes('balance') ? 'Added' : 
             item.type === 'credit' ? 'Received' : 'Sent'}
          </Text>
        </View>
        
        <View style={styles.amountContainer}>
          {isDataRevealed ? (
            <Text style={[
              styles.transactionAmount,
              item.type === 'credit' ? styles.creditAmount : styles.debitAmount
            ]}>
              {item.type === 'credit' ? '+ ' : ''}RM{item.amount}
            </Text>
          ) : (
            <Text style={styles.transactionAmount}>•••••</Text>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Transactions</Text>
          
          <View style={styles.headerSpacer} />
        </View>
        
        <SectionList
          sections={transactionSections}
          keyExtractor={(item) => item.id}
          renderItem={renderTransactionItem}
          renderSectionHeader={renderSectionHeader}
          ListHeaderComponent={renderHeader}
          ListEmptyComponent={renderEmpty}
          contentContainerStyle={styles.listContainer}
          stickySectionHeadersEnabled={false}
          refreshControl={
            <RefreshControl 
              refreshing={refreshing} 
              onRefresh={onRefresh}
              colors={[COLORS.primary]}
            />
          }
        />
      </View>
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
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: COLORS.text,
  },
  headerSpacer: {
    width: 40,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.background,
  },
  headerWrapper: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 4,
  },
  filtersContainer: {
    flexDirection: 'row',
    paddingVertical: 2,
  },
  filterButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    marginRight: 10,
    borderWidth: 1,
    borderColor: COLORS.primary,
    backgroundColor: 'transparent',
  },
  filterButtonActive: {
    backgroundColor: COLORS.primary,
  },
  filterButtonText: {
    color: COLORS.primary,
    fontSize: 14,
    fontWeight: '500',
  },
  filterButtonTextActive: {
    color: '#FFFFFF',
  },
  listContainer: {
    paddingBottom: 20,
  },
  sectionHeader: {
    paddingHorizontal: 16,
    paddingVertical: 4,
    borderBottomWidth: 0.5,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
    backgroundColor: COLORS.background,
    marginTop: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
  },
  transactionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderBottomWidth: 0.5,
    borderBottomColor: 'rgba(255, 255, 255, 0.05)',
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
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
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    backgroundColor: COLORS.background,
  },
  emptyText: {
    fontSize: 16,
    color: COLORS.textSecondary,
    marginTop: 16,
  },
});

export default TransactionsScreen; 