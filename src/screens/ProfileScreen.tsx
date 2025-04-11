import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert, SafeAreaView, Modal } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SIZES } from '../constants/theme';
import { useAuth } from '../context/AuthContext';
import Card from '../components/common/Card';
import PersonalInfoForm from '../components/profile/PersonalInfoForm';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../navigation/types';

const ProfileScreen: React.FC = () => {
  const { user, logout } = useAuth();
  const [showPersonalInfo, setShowPersonalInfo] = useState(false);
  const navigation = useNavigation<StackNavigationProp<RootStackParamList>>();

  const handleLogout = () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Logout', onPress: () => logout(), style: 'destructive' }
      ]
    );
  };

  const handleShowPersonalInfo = () => {
    setShowPersonalInfo(true);
  };

  const handlePersonalInfoClose = () => {
    setShowPersonalInfo(false);
  };

  // Simplified settings with only personal information
  const settings = [
    {
      title: 'Account',
      items: [
        { 
          label: 'Personal Information', 
          icon: 'person', 
          action: handleShowPersonalInfo 
        }
      ]
    },
    {
      title: 'Legal',
      items: [
        { 
          label: 'Terms of Service', 
          icon: 'document-text', 
          action: () => {} 
        },
        { 
          label: 'Privacy Policy', 
          icon: 'shield-checkmark', 
          action: () => {} 
        }
      ]
    }
  ];

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
        <View style={styles.profileHeader}>
          <View style={styles.avatarContainer}>
            <Text style={styles.avatarText}>
              {user?.name.charAt(0) || 'U'}
            </Text>
          </View>
          <Text style={styles.profileName}>{user?.name || 'User'}</Text>
          <Text style={styles.profileEmail}>{user?.email || 'user@example.com'}</Text>
          
          {user?.phoneNumber && (
            <Text style={styles.profileDetail}>
              <Ionicons name="call-outline" size={14} color={COLORS.textSecondary} /> {user.phoneNumber}
            </Text>
          )}
        </View>

        {settings.map((section, index) => (
          <Card key={index} style={styles.settingsCard}>
            <Text style={styles.sectionTitle}>{section.title}</Text>
            
            {section.items.map((item, itemIndex) => (
              <TouchableOpacity 
                key={itemIndex} 
                style={[
                  styles.settingItem, 
                  itemIndex === section.items.length - 1 ? { borderBottomWidth: 0 } : {}
                ]}
                onPress={item.action}
              >
                <View style={styles.settingIconContainer}>
                  <Ionicons 
                    name={item.icon as any} 
                    size={22} 
                    color={COLORS.primary} 
                  />
                </View>
                <Text style={styles.settingLabel}>
                  {item.label}
                </Text>
                <Ionicons name="chevron-forward" size={18} color={COLORS.textSecondary} />
              </TouchableOpacity>
            ))}
          </Card>
        ))}

        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <View style={styles.logoutIconContainer}>
            <Ionicons name="log-out-outline" size={24} color={COLORS.danger} />
          </View>
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>

        <Text style={styles.versionText}>Version 1.0.0</Text>
      </ScrollView>

      {/* Personal Information Modal */}
      <Modal
        visible={showPersonalInfo}
        animationType="slide"
        transparent={false}
        onRequestClose={handlePersonalInfoClose}
      >
        <SafeAreaView style={{ flex: 1, backgroundColor: COLORS.background }}>
          <View style={styles.modalHeader}>
            <TouchableOpacity style={styles.closeButton} onPress={handlePersonalInfoClose}>
              <Ionicons name="close" size={24} color={COLORS.text} />
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Edit Profile</Text>
            <View style={{ width: 40 }} />
          </View>
            
          <PersonalInfoForm onClose={handlePersonalInfoClose} />
        </SafeAreaView>
      </Modal>
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
    padding: SIZES.padding,
    paddingTop: 16,
    paddingBottom: 40,
  },
  profileHeader: {
    alignItems: 'center',
    marginBottom: 24,
  },
  avatarContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  avatarText: {
    fontSize: 32,
    fontWeight: 'bold',
    color: COLORS.card,
  },
  profileName: {
    fontSize: 24,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 4,
  },
  profileEmail: {
    fontSize: 16,
    color: COLORS.textSecondary,
    marginBottom: 4,
  },
  profileDetail: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  settingsCard: {
    marginBottom: 16,
    borderRadius: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 16,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  settingIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.primary + '10',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  settingLabel: {
    fontSize: 16,
    color: COLORS.text,
    flex: 1,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    marginTop: 24,
    marginBottom: 20,
    borderRadius: SIZES.radius,
    backgroundColor: COLORS.danger + '10',
    borderWidth: 1,
    borderColor: COLORS.danger + '20',
  },
  logoutIconContainer: {
    marginRight: 8,
  },
  logoutText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.danger,
  },
  versionText: {
    textAlign: 'center',
    fontSize: 14,
    color: COLORS.textSecondary,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    paddingHorizontal: SIZES.padding,
    paddingVertical: 16,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.text,
    textAlign: 'center',
  },
  closeButton: {
    padding: 8,
  },
});

export default ProfileScreen; 