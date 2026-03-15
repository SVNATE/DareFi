import React from 'react';
import {View, Text, StyleSheet, ViewStyle} from 'react-native';
import {COLORS} from '../../constants/colors';
import {FONT_SIZES, RADIUS, SPACING} from '../../constants/theme';

type BadgeVariant = 'primary' | 'success' | 'danger' | 'warning' | 'neutral';

const BADGE_COLORS: Record<BadgeVariant, {bg: string; text: string}> = {
  primary: {bg: COLORS.primaryGlow, text: COLORS.primaryLight},
  success: {bg: COLORS.successGlow, text: COLORS.success},
  danger: {bg: COLORS.dangerGlow, text: COLORS.danger},
  warning: {bg: COLORS.warningGlow, text: COLORS.warning},
  neutral: {bg: COLORS.border, text: COLORS.textSecondary},
};

interface BadgeProps {
  label: string;
  variant?: BadgeVariant;
  style?: ViewStyle;
  dot?: boolean;
}

const Badge = ({
  label,
  variant = 'primary',
  style,
  dot = false,
}: BadgeProps): React.JSX.Element => {
  const colors = BADGE_COLORS[variant];

  return (
    <View style={[styles.badge, {backgroundColor: colors.bg}, style]}>
      {dot && <View style={[styles.dot, {backgroundColor: colors.text}]} />}
      <Text style={[styles.label, {color: colors.text}]}>{label}</Text>
    </View>
  );
};

// Map dare status to badge props
export function getDareStatusBadge(status: string): {label: string; variant: BadgeVariant} {
  switch (status) {
    case 'open':
      return {label: 'Open', variant: 'success'};
    case 'active':
      return {label: 'Active', variant: 'primary'};
    case 'proof_submitted':
      return {label: 'Proof Submitted', variant: 'warning'};
    case 'voting':
      return {label: 'Voting', variant: 'warning'};
    case 'completed':
      return {label: 'Completed ✓', variant: 'success'};
    case 'failed':
      return {label: 'Failed ✗', variant: 'danger'};
    case 'cancelled':
      return {label: 'Cancelled', variant: 'neutral'};
    case 'disputed':
      return {label: 'Disputed', variant: 'danger'};
    default:
      return {label: status, variant: 'neutral'};
  }
}

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.sm,
    paddingVertical: 3,
    borderRadius: RADIUS.full,
    alignSelf: 'flex-start',
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 5,
  },
  label: {
    fontSize: FONT_SIZES.xs,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
});

export default Badge;
