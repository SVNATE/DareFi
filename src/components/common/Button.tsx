import React from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ActivityIndicator,
  ViewStyle,
  TextStyle,
  View,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import {COLORS} from '../../constants/colors';
import {FONT_SIZES, RADIUS, SPACING} from '../../constants/theme';

type Variant = 'primary' | 'secondary' | 'danger' | 'success' | 'ghost' | 'outline';
type Size = 'sm' | 'md' | 'lg';

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: Variant;
  size?: Size;
  isLoading?: boolean;
  disabled?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  fullWidth?: boolean;
}

const VARIANT_CONFIGS: Record<Variant, {gradient?: string[]; bg?: string; text: string; border?: string}> = {
  primary: {gradient: COLORS.gradientPrimary, text: COLORS.white},
  secondary: {bg: COLORS.cardElevated, text: COLORS.text},
  danger: {gradient: COLORS.gradientDanger, text: COLORS.white},
  success: {gradient: COLORS.gradientSuccess, text: COLORS.white},
  ghost: {bg: COLORS.transparent, text: COLORS.primary},
  outline: {bg: COLORS.transparent, text: COLORS.primary, border: COLORS.primary},
};

const SIZE_CONFIGS: Record<Size, {height: number; fontSize: number; px: number}> = {
  sm: {height: 36, fontSize: FONT_SIZES.sm, px: SPACING.md},
  md: {height: 48, fontSize: FONT_SIZES.base, px: SPACING.lg},
  lg: {height: 56, fontSize: FONT_SIZES.lg, px: SPACING.xl},
};

const Button = ({
  title,
  onPress,
  variant = 'primary',
  size = 'md',
  isLoading = false,
  disabled = false,
  style,
  textStyle,
  leftIcon,
  rightIcon,
  fullWidth = false,
}: ButtonProps): React.JSX.Element => {
  const variantConfig = VARIANT_CONFIGS[variant];
  const sizeConfig = SIZE_CONFIGS[size];
  const isDisabled = disabled || isLoading;

  const containerStyle: ViewStyle = {
    height: sizeConfig.height,
    borderRadius: RADIUS.base,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    paddingHorizontal: sizeConfig.px,
    opacity: isDisabled ? 0.5 : 1,
    ...(fullWidth ? {width: '100%'} : {}),
    ...(variantConfig.border
      ? {borderWidth: 1.5, borderColor: variantConfig.border}
      : {}),
    ...(variantConfig.bg && !variantConfig.gradient
      ? {backgroundColor: variantConfig.bg}
      : {}),
  };

  const content = (
    <>
      {leftIcon && !isLoading && <View style={styles.iconLeft}>{leftIcon}</View>}
      {isLoading ? (
        <ActivityIndicator size="small" color={variantConfig.text} />
      ) : (
        <Text
          style={[
            styles.label,
            {fontSize: sizeConfig.fontSize, color: variantConfig.text},
            textStyle,
          ]}>
          {title}
        </Text>
      )}
      {rightIcon && !isLoading && <View style={styles.iconRight}>{rightIcon}</View>}
    </>
  );

  if (variantConfig.gradient) {
    return (
      <TouchableOpacity
        onPress={onPress}
        disabled={isDisabled}
        activeOpacity={0.8}
        style={[{borderRadius: RADIUS.base, overflow: 'hidden'}, style]}>
        <LinearGradient
          colors={variantConfig.gradient}
          start={{x: 0, y: 0}}
          end={{x: 1, y: 0}}
          style={containerStyle}>
          {content}
        </LinearGradient>
      </TouchableOpacity>
    );
  }

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={isDisabled}
      activeOpacity={0.75}
      style={[containerStyle, style]}>
      {content}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  label: {
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  iconLeft: {marginRight: SPACING.sm},
  iconRight: {marginLeft: SPACING.sm},
});

export default Button;
