import React, {useState} from 'react';
import {
  View,
  TextInput,
  Text,
  StyleSheet,
  ViewStyle,
  TextStyle,
  TouchableOpacity,
  TextInputProps,
} from 'react-native';
import {COLORS} from '../../constants/colors';
import {FONT_SIZES, RADIUS, SPACING} from '../../constants/theme';

interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
  hint?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  containerStyle?: ViewStyle;
  inputStyle?: TextStyle;
  prefix?: string;
  suffix?: string;
}

const Input = ({
  label,
  error,
  hint,
  leftIcon,
  rightIcon,
  containerStyle,
  inputStyle,
  prefix,
  suffix,
  ...rest
}: InputProps): React.JSX.Element => {
  const [focused, setFocused] = useState(false);

  return (
    <View style={[styles.container, containerStyle]}>
      {label && <Text style={styles.label}>{label}</Text>}
      <View
        style={[
          styles.inputRow,
          focused && styles.inputRowFocused,
          !!error && styles.inputRowError,
        ]}>
        {leftIcon && <View style={styles.leftIcon}>{leftIcon}</View>}
        {prefix && <Text style={styles.prefix}>{prefix}</Text>}
        <TextInput
          style={[styles.input, inputStyle]}
          placeholderTextColor={COLORS.textMuted}
          selectionColor={COLORS.primary}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          {...rest}
        />
        {suffix && <Text style={styles.suffix}>{suffix}</Text>}
        {rightIcon && <View style={styles.rightIcon}>{rightIcon}</View>}
      </View>
      {error ? (
        <Text style={styles.error}>{error}</Text>
      ) : hint ? (
        <Text style={styles.hint}>{hint}</Text>
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: SPACING.base,
  },
  label: {
    fontSize: FONT_SIZES.sm,
    fontWeight: '600',
    color: COLORS.textSecondary,
    marginBottom: SPACING.xs,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.card,
    borderRadius: RADIUS.md,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    paddingHorizontal: SPACING.md,
    minHeight: 52,
  },
  inputRowFocused: {
    borderColor: COLORS.primary,
    backgroundColor: COLORS.cardElevated,
    shadowColor: COLORS.primary,
    shadowOffset: {width: 0, height: 0},
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  inputRowError: {
    borderColor: COLORS.danger,
  },
  input: {
    flex: 1,
    fontSize: FONT_SIZES.base,
    color: COLORS.text,
    paddingVertical: SPACING.md,
  },
  leftIcon: {marginRight: SPACING.sm},
  rightIcon: {marginLeft: SPACING.sm},
  prefix: {
    fontSize: FONT_SIZES.base,
    color: COLORS.textMuted,
    marginRight: SPACING.xs,
    fontWeight: '600',
  },
  suffix: {
    fontSize: FONT_SIZES.base,
    color: COLORS.textMuted,
    marginLeft: SPACING.xs,
    fontWeight: '600',
  },
  error: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.danger,
    marginTop: SPACING.xs,
  },
  hint: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textMuted,
    marginTop: SPACING.xs,
  },
});

export default Input;
