import {StyleSheet, Platform} from 'react-native';
import {COLORS} from './colors';

export const FONTS = {
  regular: Platform.OS === 'ios' ? 'SF Pro Text' : 'Roboto',
  medium: Platform.OS === 'ios' ? 'SF Pro Text' : 'Roboto-Medium',
  bold: Platform.OS === 'ios' ? 'SF Pro Display' : 'Roboto-Bold',
  mono: Platform.OS === 'ios' ? 'SF Mono' : 'monospace',
};

export const FONT_SIZES = {
  xs: 10,
  sm: 12,
  md: 14,
  base: 16,
  lg: 18,
  xl: 20,
  '2xl': 24,
  '3xl': 28,
  '4xl': 32,
  '5xl': 40,
};

export const SPACING = {
  xs: 4,
  sm: 8,
  md: 12,
  base: 16,
  lg: 20,
  xl: 24,
  '2xl': 32,
  '3xl': 40,
  '4xl': 48,
  '5xl': 64,
};

export const RADIUS = {
  xs: 4,
  sm: 8,
  md: 12,
  base: 16,
  lg: 20,
  xl: 24,
  full: 9999,
};

export const SHADOWS = {
  sm: {
    shadowColor: COLORS.primary,
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },
  md: {
    shadowColor: COLORS.primary,
    shadowOffset: {width: 0, height: 4},
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 6,
  },
  lg: {
    shadowColor: COLORS.primary,
    shadowOffset: {width: 0, height: 8},
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 12,
  },
};

export const GLOBAL_STYLES = StyleSheet.create({
  flex1: {flex: 1},
  row: {flexDirection: 'row'},
  rowCenter: {flexDirection: 'row', alignItems: 'center'},
  center: {alignItems: 'center', justifyContent: 'center'},
  screen: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  scrollContent: {
    paddingHorizontal: SPACING.base,
    paddingBottom: SPACING['4xl'],
  },
  sectionTitle: {
    fontSize: FONT_SIZES.lg,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: SPACING.md,
  },
  caption: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textMuted,
  },
});
