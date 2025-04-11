import React from 'react';
import { View, StyleSheet, SafeAreaView } from 'react-native';
import { COLORS } from '../constants/theme';
import FaceIDTest from '../components/authentication/FaceIDTest';

const FaceIDTestScreen: React.FC = () => {
  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <FaceIDTest />
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
  },
});

export default FaceIDTestScreen; 