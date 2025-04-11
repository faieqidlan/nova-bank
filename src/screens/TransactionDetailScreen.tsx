import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  ActivityIndicator,
  TouchableOpacity,
  SafeAreaView,
  Image
} from 'react-native';
import { RouteProp, useRoute, useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { RootStackParamList } from '../navigation/types';
import { Transaction } from '../types/transaction';
import { getTransactionById } from '../services/mockData';
import { COLORS, SIZES, SHADOWS } from '../constants/theme';
import { useAuth } from '../context/AuthContext';

type TransactionDetailRouteProp = RouteProp<RootStackParamList, 'TransactionDetail'>;

const TransactionDetailScreen: React.FC = () => {
  const [transaction, setTransaction] = useState<Transaction | null>(null);
  const [loading, setLoading] = useState(true);
  const { isDataRevealed, toggleDataVisibility } = useAuth();
  const route = useRoute<TransactionDetailRouteProp>();
  const navigation = useNavigation();
  const { transactionId } = route.params;

  useEffect(() => {
    loadTransactionDetails();
  }, [transactionId]);

  const loadTransactionDetails = async () => {
    try {
      setLoading(true);
      const data = await getTransactionById(transactionId);
      if (data) {
        setTransaction(data);
      }
    } catch (error) {
      console.error('Error loading transaction details:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleGoBack = () => {
    navigation.goBack();
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={handleGoBack}>
            <Ionicons name="chevron-back" size={24} color={COLORS.text} />
          </TouchableOpacity>
          <View style={styles.headerRight}>
            <TouchableOpacity onPress={toggleDataVisibility} style={styles.iconButton}>
              <Ionicons 
                name={isDataRevealed ? "eye" : "eye-off"} 
                size={24} 
                color={isDataRevealed ? COLORS.primary : COLORS.text} 
              />
            </TouchableOpacity>
            <TouchableOpacity style={styles.iconButton}>
              <Ionicons name="ellipsis-horizontal" size={24} color={COLORS.text} />
            </TouchableOpacity>
          </View>
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
        </View>
      </SafeAreaView>
    );
  }

  if (!transaction) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={handleGoBack}>
            <Ionicons name="chevron-back" size={24} color={COLORS.text} />
          </TouchableOpacity>
          <View style={styles.headerRight}>
            <TouchableOpacity onPress={toggleDataVisibility} style={styles.iconButton}>
              <Ionicons 
                name={isDataRevealed ? "eye" : "eye-off"} 
                size={24} 
                color={isDataRevealed ? COLORS.primary : COLORS.text} 
              />
            </TouchableOpacity>
            <TouchableOpacity style={styles.iconButton}>
              <Ionicons name="ellipsis-horizontal" size={24} color={COLORS.text} />
            </TouchableOpacity>
          </View>
        </View>
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle-outline" size={60} color={COLORS.danger} />
          <Text style={styles.errorText}>
            Transaction not found or failed to load.
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString('en-US', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  };

  const formatTime = (timestamp: number) => {
    return new Date(timestamp).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatFullDateTime = (timestamp: number) => {
    return `${formatDate(timestamp)} at ${formatTime(timestamp)}`;
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView 
        style={styles.container}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        {/* Header with back button and icons */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={handleGoBack}>
            <Ionicons name="chevron-back" size={24} color={COLORS.text} />
          </TouchableOpacity>
          <View style={styles.headerRight}>
            <TouchableOpacity onPress={toggleDataVisibility} style={styles.iconButton}>
              <Ionicons 
                name={isDataRevealed ? "eye" : "eye-off"} 
                size={24} 
                color={isDataRevealed ? COLORS.primary : COLORS.text} 
              />
            </TouchableOpacity>
            <TouchableOpacity style={styles.iconButton}>
              <Ionicons name="ellipsis-horizontal" size={24} color={COLORS.text} />
            </TouchableOpacity>
          </View>
        </View>
        
        {/* Amount and merchant section */}
        <View style={styles.amountSection}>
          <View style={styles.amountContainer}>
            {isDataRevealed ? (
              <Text style={styles.amount}>
                {transaction.type === 'credit' ? '+' : '-'}RM{transaction.amount.toFixed(2)}
              </Text>
            ) : (
              <Text style={styles.amount}>••••••</Text>
            )}
            <Text style={styles.merchantName}>{transaction.merchant || transaction.description}</Text>
          </View>
          
          {transaction.category && (
            <View style={styles.categoryPill}>
              <Ionicons name="pricetag-outline" size={16} color={COLORS.text} />
              <Text style={styles.categoryText}>{transaction.category}</Text>
            </View>
          )}
        </View>
        
        {/* Transaction details section */}
        <View style={styles.detailsSection}>
          <Text style={styles.sectionTitle}>Transaction details</Text>
          
          <DetailRow 
            label="Date" 
            value={formatFullDateTime(transaction.date)}
          />
          
          <DetailRow 
            label="Description" 
            value={transaction.description}
          />
          
          {transaction.merchant && (
            <DetailRow 
              label="Merchant" 
              value={transaction.merchant}
            />
          )}
          
          <DetailRow 
            label="Status" 
            value={transaction.status.charAt(0).toUpperCase() + transaction.status.slice(1)}
            valueColor={
              transaction.status === 'completed' 
                ? COLORS.success 
                : transaction.status === 'pending' 
                  ? COLORS.warning 
                  : COLORS.danger
            }
          />
          
          {transaction.reference && (
            <DetailRow 
              label="Reference" 
              value={transaction.reference}
            />
          )}
        </View>
        
        {/* Payment section */}
        <View style={styles.detailsSection}>
          <Text style={styles.sectionTitle}>Payment</Text>
          
          <DetailRow 
            label="Type" 
            value={transaction.type.charAt(0).toUpperCase() + transaction.type.slice(1)}
            valueColor={transaction.type === 'credit' ? COLORS.success : COLORS.danger}
          />
          
          <DetailRow 
            label="Amount" 
            value={`RM${transaction.amount.toFixed(2)}`}
          />
        </View>
        
        {/* Transaction reference */}
        <View style={styles.referenceSection}>
          <Text style={styles.referenceText}>Transaction ID: {transaction.id}</Text>
          {transaction.reference && (
            <Text style={styles.referenceText}>Reference: {transaction.reference}</Text>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

interface DetailRowProps {
  label: string;
  value: string;
  valueColor?: string;
  rightElement?: React.ReactNode;
}

const DetailRow: React.FC<DetailRowProps> = ({ 
  label, 
  value, 
  valueColor = COLORS.text,
  rightElement
}) => (
  <View style={styles.detailRow}>
    <Text style={styles.detailLabel}>{label}</Text>
    <View style={styles.detailValueContainer}>
      {rightElement}
      <Text style={[styles.detailValue, { color: valueColor }]}>{value}</Text>
    </View>
  </View>
);

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
    paddingBottom: SIZES.padding * 4,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.background === '#000000' ? '#333333' : '#f0f0f0',
  },
  iconButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.background,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
    backgroundColor: COLORS.background,
  },
  errorText: {
    fontSize: 16,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginTop: 8,
  },
  amountSection: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  amountContainer: {
    alignItems: 'center',
  },
  amount: {
    fontSize: 40,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: 4,
  },
  merchantName: {
    fontSize: 20,
    fontWeight: 'semibold',
    color: COLORS.primary,
    marginBottom: 16,
  },
  categoryPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    marginTop: 8,
  },
  categoryText: {
    fontSize: 14,
    color: COLORS.text,
    marginLeft: 6,
  },
  detailsSection: {
    marginTop: 24,
    backgroundColor: COLORS.background === '#000000' ? '#1a1a1a' : '#f8f8f8',
    borderRadius: 12,
    marginHorizontal: 16,
    overflow: 'hidden',
    paddingTop: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: 16,
    paddingHorizontal: 16,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  detailLabel: {
    fontSize: 16,
    color: COLORS.text,
  },
  detailValueContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  detailValue: {
    fontSize: 16,
    fontWeight: '400',
    color: COLORS.text,
    textAlign: 'right',
  },
  referenceSection: {
    marginTop: 32,
    marginHorizontal: 16,
    alignItems: 'center',
  },
  referenceText: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginBottom: 8,
  }
});

export default TransactionDetailScreen; 