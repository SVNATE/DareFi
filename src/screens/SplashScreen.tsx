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
  Easing,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import Svg, {Path} from 'react-native-svg';
import {useNavigation} from '@react-navigation/native';
import {NativeStackNavigationProp} from '@react-navigation/native-stack';
import {FONT_SIZES, SPACING} from '../constants/theme';
import {RootStackParamList} from '../types';

type Nav = NativeStackNavigationProp<RootStackParamList, 'Splash'>;

const {width} = Dimensions.get('window');
const ORB_CYAN_SIZE = width * 0.82;
const ORB_LIME_SIZE = width * 0.96;

const SPLASH_COLORS = {
  bgStart: '#0F1724',
  bgEnd: '#2F2F3D',
  lime: '#DCFC34',
  limeDeep: '#98CE1D',
  cyan: '#21E8E4',
  cyanSoft: 'rgba(33, 232, 228, 0.16)',
  limeSoft: 'rgba(220, 252, 52, 0.13)',
  glass: 'rgba(220, 252, 52, 0.10)',
  glassBorder: 'rgba(220, 252, 52, 0.22)',
};

const SplashScreen = (): React.JSX.Element => {
  const navigation = useNavigation<Nav>();
  const introScale = useRef(new Animated.Value(0.72)).current;
  const introOpacity = useRef(new Animated.Value(0)).current;
  const floatY = useRef(new Animated.Value(0)).current;
  const orbCyanPulse = useRef(new Animated.Value(0.6)).current;
  const orbLimePulse = useRef(new Animated.Value(0.4)).current;
  const dot1 = useRef(new Animated.Value(0)).current;
  const dot2 = useRef(new Animated.Value(0)).current;
  const dot3 = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.spring(introScale, {
        toValue: 1,
        tension: 75,
        friction: 7,
        useNativeDriver: true,
      }),
      Animated.timing(introOpacity, {
        toValue: 1,
        duration: 650,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
    ]).start();

    const floatLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(floatY, {
          toValue: -10,
          duration: 1400,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(floatY, {
          toValue: 0,
          duration: 1400,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ]),
    );

    const orbCyanLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(orbCyanPulse, {
          toValue: 1,
          duration: 2200,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(orbCyanPulse, {
          toValue: 0.6,
          duration: 2200,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ]),
    );

    const orbLimeLoop = Animated.loop(
      Animated.sequence([
        Animated.delay(300),
        Animated.timing(orbLimePulse, {
          toValue: 0.92,
          duration: 2400,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(orbLimePulse, {
          toValue: 0.4,
          duration: 2400,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ]),
    );

    const createDotLoop = (value: Animated.Value, delay: number) =>
      Animated.loop(
        Animated.sequence([
          Animated.delay(delay),
          Animated.timing(value, {
            toValue: -8,
            duration: 220,
            easing: Easing.out(Easing.cubic),
            useNativeDriver: true,
          }),
          Animated.timing(value, {
            toValue: 0,
            duration: 220,
            easing: Easing.in(Easing.cubic),
            useNativeDriver: true,
          }),
          Animated.delay(360),
        ]),
      );

    const dotLoop1 = createDotLoop(dot1, 0);
    const dotLoop2 = createDotLoop(dot2, 140);
    const dotLoop3 = createDotLoop(dot3, 280);

    floatLoop.start();
    orbCyanLoop.start();
    orbLimeLoop.start();
    dotLoop1.start();
    dotLoop2.start();
    dotLoop3.start();

    const timer = setTimeout(() => {
      navigation.replace('Auth');
    }, 2500);

    return () => {
      clearTimeout(timer);
      floatLoop.stop();
      orbCyanLoop.stop();
      orbLimeLoop.stop();
      dotLoop1.stop();
      dotLoop2.stop();
      dotLoop3.stop();
    };
  }, [
    navigation,
    introScale,
    introOpacity,
    floatY,
    orbCyanPulse,
    orbLimePulse,
    dot1,
    dot2,
    dot3,
  ]);

  return (
    <LinearGradient
      colors={[SPLASH_COLORS.bgStart, SPLASH_COLORS.bgEnd]}
      start={{x: 0, y: 0}}
      end={{x: 1, y: 1}}
      style={styles.container}>
      <Animated.View
        style={[
          styles.orbCyan,
          {
            opacity: orbCyanPulse,
            transform: [
              {
                scale: orbCyanPulse.interpolate({
                  inputRange: [0.6, 1],
                  outputRange: [0.9, 1.12],
                }),
              },
            ],
          },
        ]}
      />

      <Animated.View
        style={[
          styles.orbLime,
          {
            opacity: orbLimePulse,
            transform: [
              {
                scale: orbLimePulse.interpolate({
                  inputRange: [0.4, 0.92],
                  outputRange: [0.9, 1.1],
                }),
              },
            ],
          },
        ]}
      />

      <Animated.View
        style={[
          styles.content,
          {
            opacity: introOpacity,
            transform: [{scale: introScale}, {translateY: floatY}],
          },
        ]}>
        <View style={styles.logoContainer}>
          <LinearGradient
            colors={[SPLASH_COLORS.lime, SPLASH_COLORS.limeDeep]}
            start={{x: 0, y: 0}}
            end={{x: 1, y: 1}}
            style={styles.logoOuter}>
            <View style={styles.logoInner}>
              <Svg width={60} height={60} viewBox="0 0 100 100">
                <Path
                  d="M30 20C30 20 70 20 70 50C70 80 30 80 30 80V20Z"
                  stroke={SPLASH_COLORS.lime}
                  strokeWidth={12}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <Path
                  d="M30 40H55"
                  stroke={SPLASH_COLORS.lime}
                  strokeWidth={12}
                  strokeLinecap="round"
                />
              </Svg>
            </View>
          </LinearGradient>
        </View>

        <View style={styles.titleRow}>
          <Text style={styles.appName}>Dare</Text>
          <Text style={styles.appNameAccent}>Fi</Text>
        </View>

        <Text style={styles.tagline}>
          Bet on Dares. <Text style={styles.taglineAccent}>Win Crypto.</Text>
        </Text>
      </Animated.View>

      <View style={styles.footer}>
        <View style={styles.loadingDots}>
          <Animated.View style={[styles.dot, {transform: [{translateY: dot1}]}]} />
          <Animated.View style={[styles.dot, {transform: [{translateY: dot2}]}]} />
          <Animated.View style={[styles.dot, {transform: [{translateY: dot3}]}]} />
        </View>
        <Text style={styles.poweredByText}>Powered by Blockchain</Text>
      </View>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  orbCyan: {
    position: 'absolute',
    width: ORB_CYAN_SIZE,
    height: ORB_CYAN_SIZE,
    borderRadius: ORB_CYAN_SIZE / 2,
    backgroundColor: SPLASH_COLORS.cyanSoft,
    left: width * 0.08,
    top: '42%',
  },
  orbLime: {
    position: 'absolute',
    width: ORB_LIME_SIZE,
    height: ORB_LIME_SIZE,
    borderRadius: ORB_LIME_SIZE / 2,
    backgroundColor: SPLASH_COLORS.limeSoft,
    right: -width * 0.24,
    top: '34%',
  },
  content: {
    alignItems: 'center',
    paddingHorizontal: SPACING.xl,
  },
  logoContainer: {
    marginBottom: SPACING.xl,
    shadowColor: SPLASH_COLORS.lime,
    shadowOffset: {width: 0, height: 8},
    shadowOpacity: 0.45,
    shadowRadius: 26,
    elevation: 18,
  },
  logoOuter: {
    width: 128,
    height: 128,
    borderRadius: 34,
    padding: 2,
  },
  logoInner: {
    flex: 1,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: SPLASH_COLORS.glass,
    borderWidth: 1,
    borderColor: SPLASH_COLORS.glassBorder,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
  },
  appName: {
    fontSize: 50,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: -2,
    lineHeight: 56,
  },
  appNameAccent: {
    fontSize: 50,
    fontWeight: '900',
    color: SPLASH_COLORS.lime,
    letterSpacing: -2,
    lineHeight: 56,
  },
  tagline: {
    marginTop: SPACING.sm,
    fontSize: FONT_SIZES.base,
    color: '#98A3B6',
    letterSpacing: 0.7,
    fontWeight: '600',
    textAlign: 'center',
  },
  taglineAccent: {
    color: SPLASH_COLORS.cyan,
  },
  footer: {
    position: 'absolute',
    bottom: SPACING['4xl'],
    alignItems: 'center',
    justifyContent: 'center',
    width,
  },
  loadingDots: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.md,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: SPLASH_COLORS.lime,
    marginHorizontal: 4,
  },
  poweredByText: {
    fontSize: 10,
    color: '#6F7687',
    fontWeight: '700',
    letterSpacing: 2.4,
    textTransform: 'uppercase',
  },
});

export default SplashScreen;
