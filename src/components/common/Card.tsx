import React, { ReactNode } from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { COLORS, SHADOWS, SIZES } from '../../constants/theme';

interface CardProps {
  children: ReactNode;
  style?: ViewStyle;
  shadowType?: 'small' | 'medium' | 'large' | 'none';
}

const Card: React.FC<CardProps> = ({ 
  children, 
  style, 
  shadowType = 'small' 
}) => {
  const getShadow = () => {
    switch (shadowType) {
      case 'small':
        return SHADOWS.small;
      case 'medium':
        return SHADOWS.medium;
      case 'large':
        return SHADOWS.large;
      case 'none':
        return {};
      default:
        return SHADOWS.small;
    }
  };

  return (
    <View style={[
      styles.card,
      getShadow(),
      style
    ]}>
      {children}
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.card,
    borderRadius: SIZES.radius,
    padding: SIZES.padding,
  },
});

export default Card; 