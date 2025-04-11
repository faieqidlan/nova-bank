import React from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SIZES } from '../../constants/theme';
import Button from '../common/Button';
import Card from '../common/Card';
import { useAuth } from '../../context/AuthContext';

interface BiometricEnrollmentPromptProps {
  onAccept: () => void;
  onDecline: () => void;
}

const BiometricEnrollmentPrompt: React.FC<BiometricEnrollmentPromptProps> = ({
  onAccept,
  onDecline
}) => {
  const { biometricTypeName, biometricType } = useAuth();
  
  const getBiometricIcon = () => {
    switch (biometricType) {
      case 'FaceID':
        return 'scan-outline';
      case 'TouchID':
        return 'finger-print';
      default:
        return 'lock-closed';
    }
  };
  
  return (
    <Modal
      transparent
      animationType="fade"
      visible={true}
    >
      <View style={styles.modalContainer}>
        <Card style={styles.card} shadowType="medium">
          <View style={styles.iconContainer}>
            <Ionicons name={getBiometricIcon()} size={64} color={COLORS.primary} />
          </View>
          
          <Text style={styles.title}>Enable {biometricTypeName}?</Text>
          
          <Text style={styles.description}>
            Would you like to use {biometricTypeName} for quicker login in the future?
            Your credentials will be securely stored and only accessible with your biometrics.
          </Text>
          
          <Button
            title={`Enable ${biometricTypeName}`}
            onPress={onAccept}
            style={styles.button}
          />
          
          <TouchableOpacity style={styles.skipButton} onPress={onDecline}>
            <Text style={styles.skipButtonText}>Not now</Text>
          </TouchableOpacity>
        </Card>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    padding: SIZES.padding,
  },
  card: {
    width: '100%',
    maxWidth: 400,
    padding: SIZES.padding * 1.5,
    alignItems: 'center',
  },
  iconContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: COLORS.primary + '15',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: 16,
    textAlign: 'center',
  },
  description: {
    fontSize: 16,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 24,
  },
  button: {
    width: '100%',
    marginBottom: 12,
  },
  skipButton: {
    padding: 12,
  },
  skipButtonText: {
    color: COLORS.textSecondary,
    fontSize: 16,
  },
});

export default BiometricEnrollmentPrompt; 