/**
 * Splash Screen – animated logo while auth state hydrates
 */
import React, {useEffect, useRef} from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  Dimensions,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import {useNavigation} from '@react-navigation/native';
import {NativeStackNavigationProp} from '@react-navigation/native-stack';
import {COLORS} from '../constants/colors';
import {FONT_SIZES, SPACING} from '../constants/theme';
import {RootStackParamList} from '../types';

type Nav = NativeStackNavigationProp<RootStackParamList, 'Splash'>;

const {width} = Dimensions.get('window');

const SplashScreen = (): React.JSX.Element => {
  const navigation = useNavigation<Nav>();
  const scale = useRef(new Animated.Value(0.6)).current;
  const opacity = useRef(new Animated.Value(0)).current;
  const glowOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.sequence([
      Animated.parallel([
        Animated.spring(scale, {
          toValue: 1,
          tension: 80,
          friction: 6,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 1,
          duration: 600,
          useNativeDriver: true,
        }),
      ]),
      Animated.timing(glowOpacity, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
    ]).start();

    const timer = setTimeout(() => {
      navigation.replace('Auth');
    }, 2500);

    return () => clearTimeout(timer);
  }, [navigation, scale, opacity, glowOpacity]);

  return (
    <LinearGradient
      colors={COLORS.gradientBackground}
      style={styles.container}>
      <Animated.View style={[styles.content, {opacity, transform: [{scale}]}]}>
        {/* Logo Glow */}
        <Animated.View style={[styles.glow, {opacity: glowOpacity}]} />

        {/* Logo */}
        <View style={styles.logoContainer}>
          <LinearGradient
            colors={COLORS.gradientPrimary}
            style={styles.logoBox}>
            <Text style={styles.logoIcon}>⚡</Text>
          </LinearGradient>
        </View>

        <Text style={styles.appName}>DareFi</Text>
        <Text style={styles.tagline}>Dare. Stake. Win.</Text>

        <View style={styles.poweredBy}>
          <Text style={styles.poweredByText}>Powered by </Text>
          <Text style={styles.poweredByBrand}>Starknet</Text>
        </View>
      </Animated.View>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    alignItems: 'center',
  },
  glow: {
    position: 'absolute',
    width: 240,
    height: 240,
    borderRadius: 120,
    backgroundColor: COLORS.primaryGlow,
    top: -60,
    transform: [{scale: 1.5}],
  },
  logoContainer: {
    marginBottom: SPACING.lg,
    shadowColor: COLORS.primary,
    shadowOffset: {width: 0, height: 8},
    shadowOpacity: 0.6,
    shadowRadius: 24,
    elevation: 16,
  },
  logoBox: {
    width: 96,
    height: 96,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoIcon: {
    fontSize: 52,
  },
  appName: {
    fontSize: FONT_SIZES['5xl'],
    fontWeight: '900',
    color: COLORS.white,
    letterSpacing: -1,
  },
  tagline: {
    fontSize: FONT_SIZES.lg,
    color: COLORS.textSecondary,
    marginTop: SPACING.xs,
    letterSpacing: 2,
    textTransform: 'uppercase',
    fontWeight: '600',
  },
  poweredBy: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: SPACING['4xl'],
  },
  poweredByText: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textMuted,
  },
  poweredByBrand: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.primaryLight,
    fontWeight: '700',
  },
});

export default SplashScreen;
