import React from 'react';
import {View, StyleSheet, ViewStyle} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import {COLORS} from '../../constants/colors';
import {RADIUS, SPACING} from '../../constants/theme';

interface CardProps {
  children: React.ReactNode;
  style?: ViewStyle;
  gradient?: boolean;
  elevated?: boolean;
  padding?: number;
}

const Card = ({
  children,
  style,
  gradient = false,
  elevated = false,
  padding = SPACING.base,
}: CardProps): React.JSX.Element => {
  const baseStyle: ViewStyle = {
    borderRadius: RADIUS.lg,
    padding,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: elevated ? COLORS.cardElevated : COLORS.card,
  };

  if (gradient) {
    return (
      <LinearGradient
        colors={COLORS.gradientCard}
        start={{x: 0, y: 0}}
        end={{x: 0, y: 1}}
        style={[baseStyle, styles.shadow, style]}>
        {children}
      </LinearGradient>
    );
  }

  return (
    <View style={[baseStyle, elevated && styles.shadow, style]}>
      {children}
    </View>
  );
};

const styles = StyleSheet.create({
  shadow: {
    shadowColor: COLORS.primary,
    shadowOffset: {width: 0, height: 4},
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 6,
  },
});

export default Card;
