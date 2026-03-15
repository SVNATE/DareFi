/**
 * Create Username Screen
 */
import React, {useEffect, useMemo, useState} from 'react';
import {
  View,
  Text,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  useWindowDimensions,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import Svg, {Path} from 'react-native-svg';
import {NativeStackScreenProps} from '@react-navigation/native-stack';
import Toast from 'react-native-toast-message';
import {debounce} from 'lodash';

import {useAuthStore} from '../store';
import {AuthStackParamList} from '../types';
import {COLORS} from '../constants/colors';
import {FONT_SIZES, SPACING, RADIUS} from '../constants/theme';
import Button from '../components/common/Button';
import Input from '../components/common/Input';
import {checkUsername} from '../services/api';
import {shortenAddress} from '../services/starknet';

type Props = NativeStackScreenProps<AuthStackParamList, 'CreateUsername'>;

const USERNAME_RE = /^[a-zA-Z0-9_]{3,20}$/;

const SCREEN_COLORS = {
  bgStart: '#0F1724',
  bgEnd: '#2F2F3D',
  neonLime: '#D9FF00',
  neonCyan: '#21E8E4',
  limeGlass: 'rgba(217,255,0,0.14)',
  limeBorder: 'rgba(217,255,0,0.26)',
};

const CreateUsernameScreen = ({route}: Props): React.JSX.Element => {
  const {height, width} = useWindowDimensions();
  const isCompact = height < 760;

  const {walletAddress} = route.params;
  const {createUsername, isLoading} = useAuthStore();

  const [username, setUsername] = useState('');
  const [usernameAvailable, setUsernameAvailable] = useState<boolean | null>(null);
  const [checking, setChecking] = useState(false);
  const [error, setError] = useState('');

  const orbSizeA = Math.min(width * 0.68, 300);
  const orbSizeB = Math.min(width * 0.9, 360);

  const validateLocal = (value: string): string => {
    if (value.length < 3) {return 'At least 3 characters';}
    if (value.length > 20) {return 'Max 20 characters';}
    if (!USERNAME_RE.test(value)) {return 'Letters, numbers and _ only';}
    return '';
  };

  const checkAvailability = useMemo(
    () =>
      debounce(async (value: string) => {
        if (validateLocal(value)) {return;}
        setChecking(true);
        try {
          const available = await checkUsername(value);
          setUsernameAvailable(available);
        } catch {
          setUsernameAvailable(null);
        } finally {
          setChecking(false);
        }
      }, 600),
    [],
  );

  useEffect(() => {
    return () => {
      checkAvailability.cancel();
    };
  }, [checkAvailability]);

  const handleChange = (value: string): void => {
    const cleaned = value.toLowerCase().replace(/[^a-z0-9_]/g, '');
    setUsername(cleaned);
    setUsernameAvailable(null);
    const err = validateLocal(cleaned);
    setError(err);
    if (!err) {checkAvailability(cleaned);}
  };

  const handleSubmit = async (): Promise<void> => {
    const err = validateLocal(username);
    if (err) {setError(err); return;}
    if (usernameAvailable === false) {
      setError('Username already taken');
      return;
    }

    await createUsername(username);
    const state = useAuthStore.getState();
    if (state.error) {
      Toast.show({type: 'error', text1: 'Error', text2: state.error});
    }
  };

  const hint = checking
    ? 'Checking availability...'
    : usernameAvailable === true
    ? '✓ Username available!'
    : usernameAvailable === false
    ? '✗ Username taken'
    : undefined;

  const hintColor =
    checking
      ? COLORS.textMuted
      : usernameAvailable === true
      ? COLORS.success
      : COLORS.danger;

  return (
    <LinearGradient
      colors={[SCREEN_COLORS.bgStart, SCREEN_COLORS.bgEnd]}
      start={{x: 0, y: 0}}
      end={{x: 1, y: 1}}
      style={styles.container}>
      <View
        style={[
          styles.orbA,
          {
            width: orbSizeA,
            height: orbSizeA,
            borderRadius: orbSizeA / 2,
          },
        ]}
      />
      <View
        style={[
          styles.orbB,
          {
            width: orbSizeB,
            height: orbSizeB,
            borderRadius: orbSizeB / 2,
          },
        ]}
      />

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.flex}>
        <View
          style={[
            styles.frame,
            {
              paddingTop: Platform.OS === 'ios' ? SPACING['3xl'] : SPACING['2xl'],
              paddingBottom: isCompact ? SPACING.base : SPACING.xl,
              paddingHorizontal: isCompact ? SPACING.lg : SPACING.xl,
            },
          ]}>
          <View style={[styles.header, isCompact && styles.headerCompact]}>
            <LinearGradient
              colors={[SCREEN_COLORS.neonLime, '#A1C700']}
              start={{x: 0, y: 0}}
              end={{x: 1, y: 1}}
              style={[styles.logoOuter, isCompact && styles.logoOuterCompact]}>
              <View style={styles.logoInner}>
                <Svg width={isCompact ? 34 : 40} height={isCompact ? 34 : 40} viewBox="0 0 40 40">
                  <Path
                    d="M10 5C10 5 25 5 30 15C35 25 25 35 15 35H10V5Z"
                    stroke={SCREEN_COLORS.neonLime}
                    strokeWidth={6}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <Path
                    d="M10 20H20"
                    stroke={SCREEN_COLORS.neonLime}
                    strokeWidth={4}
                    strokeLinecap="round"
                  />
                </Svg>
              </View>
            </LinearGradient>

            <View style={styles.brandRow}>
              <Text style={[styles.brandPrimary, isCompact && styles.brandCompact]}>Dare</Text>
              <Text style={[styles.brandAccent, isCompact && styles.brandCompact]}>Fi</Text>
            </View>

            <Text style={[styles.title, isCompact && styles.titleCompact]}>Create Your Profile</Text>
            <Text style={[styles.subtitle, isCompact && styles.subtitleCompact]}>
              One last step! Choose a unique username for your DareFi profile.
            </Text>
          </View>

          <View style={[styles.mainCard, isCompact && styles.mainCardCompact]}>
            <View style={styles.walletBadge}>
              <Text style={styles.walletIcon}>🔗</Text>
              <Text style={styles.walletAddress}>{shortenAddress(walletAddress)}</Text>
              <View style={styles.connectedDot} />
            </View>

            <Input
              label="Username"
              placeholder="e.g. cryptoathlete"
              value={username}
              onChangeText={handleChange}
              autoCapitalize="none"
              autoCorrect={false}
              prefix="@"
              maxLength={20}
              error={error}
              containerStyle={styles.inputContainer}
            />

            {hint && !error && (
              <View style={styles.hintRow}>
                {checking && <ActivityIndicator size="small" color={COLORS.textMuted} />}
                <Text style={[styles.hint, {color: hintColor}]}>{hint}</Text>
              </View>
            )}

            <View style={styles.rules}>
              {[
                '3–20 characters',
                'Letters, numbers and underscores (_)',
                'Cannot be changed later',
              ].map(rule => (
                <View key={rule} style={styles.ruleRow}>
                  <Text style={styles.ruleDot}>•</Text>
                  <Text style={styles.ruleText}>{rule}</Text>
                </View>
              ))}
            </View>

            <Button
              title="Create Profile"
              onPress={handleSubmit}
              isLoading={isLoading}
              disabled={!!error || !username || usernameAvailable === false}
              fullWidth
              size={isCompact ? 'md' : 'lg'}
              style={styles.ctaButton}
            />
          </View>

          <View style={styles.footer}>
            <View style={styles.footerDots}>
              <View style={[styles.dot, styles.dotInactive]} />
              <View style={[styles.dot, styles.dotActive]} />
              <View style={[styles.dot, styles.dotInactive]} />
            </View>
            <Text style={styles.footerText}>Powered by Blockchain</Text>
          </View>
        </View>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    overflow: 'hidden',
  },
  flex: {
    flex: 1,
  },
  orbA: {
    position: 'absolute',
    right: -60,
    top: -50,
    backgroundColor: 'rgba(217,255,0,0.08)',
  },
  orbB: {
    position: 'absolute',
    left: -80,
    bottom: -90,
    backgroundColor: 'rgba(33,232,228,0.08)',
  },
  frame: {
    flex: 1,
    justifyContent: 'space-between',
  },
  header: {
    alignItems: 'center',
  },
  headerCompact: {
    marginTop: 0,
  },
  logoOuter: {
    width: 92,
    height: 92,
    borderRadius: 28,
    padding: 2,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.base,
    shadowColor: SCREEN_COLORS.neonLime,
    shadowOffset: {width: 0, height: 8},
    shadowOpacity: 0.34,
    shadowRadius: 24,
    elevation: 14,
  },
  logoOuterCompact: {
    width: 80,
    height: 80,
    borderRadius: 24,
  },
  logoInner: {
    flex: 1,
    width: '100%',
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: SCREEN_COLORS.limeGlass,
    borderWidth: 1,
    borderColor: SCREEN_COLORS.limeBorder,
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  brandPrimary: {
    fontSize: FONT_SIZES['4xl'],
    fontWeight: '900',
    color: COLORS.text,
    letterSpacing: -1,
  },
  brandAccent: {
    fontSize: FONT_SIZES['4xl'],
    fontWeight: '900',
    color: SCREEN_COLORS.neonLime,
    letterSpacing: -1,
  },
  brandCompact: {
    fontSize: FONT_SIZES['3xl'],
  },
  title: {
    fontSize: FONT_SIZES.xl,
    fontWeight: '800',
    color: SCREEN_COLORS.neonLime,
    textAlign: 'center',
    marginTop: SPACING.xs,
  },
  titleCompact: {
    fontSize: FONT_SIZES.lg,
  },
  subtitle: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginTop: SPACING.sm,
    lineHeight: 20,
    paddingHorizontal: SPACING.lg,
  },
  subtitleCompact: {
    fontSize: FONT_SIZES.xs,
    lineHeight: 16,
    marginTop: SPACING.xs,
  },
  mainCard: {
    backgroundColor: 'rgba(26,26,40,0.72)',
    borderRadius: RADIUS.xl,
    borderWidth: 1,
    borderColor: 'rgba(33,232,228,0.2)',
    paddingHorizontal: SPACING.base,
    paddingVertical: SPACING.base,
  },
  mainCardCompact: {
    paddingVertical: SPACING.md,
  },
  walletBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(47,47,61,0.75)',
    borderRadius: RADIUS.full,
    borderWidth: 1,
    borderColor: 'rgba(33,232,228,0.25)',
    paddingHorizontal: SPACING.md,
    paddingVertical: 6,
    alignSelf: 'center',
    marginBottom: SPACING.base,
    gap: SPACING.sm,
  },
  walletIcon: {fontSize: 16},
  walletAddress: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
    fontFamily: 'monospace',
  },
  connectedDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.success,
  },
  inputContainer: {
    marginBottom: SPACING.xs,
  },
  hintRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
    marginBottom: SPACING.xs,
  },
  hint: {
    fontSize: FONT_SIZES.sm,
    fontWeight: '600',
  },
  rules: {
    marginTop: SPACING.xs,
    gap: SPACING.xs,
  },
  ruleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
  },
  ruleDot: {
    color: COLORS.textMuted,
    fontSize: FONT_SIZES.sm,
    lineHeight: 16,
  },
  ruleText: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.textMuted,
    flex: 1,
    lineHeight: 16,
  },
  ctaButton: {
    marginTop: SPACING.md,
  },
  footer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingBottom: SPACING.xs,
  },
  footerDots: {
    flexDirection: 'row',
    gap: SPACING.xs,
    marginBottom: SPACING.xs,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  dotActive: {
    backgroundColor: SCREEN_COLORS.neonLime,
  },
  dotInactive: {
    backgroundColor: 'rgba(255,255,255,0.28)',
  },
  footerText: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.textMuted,
    letterSpacing: 2,
    textTransform: 'uppercase',
    textAlign: 'center',
    fontWeight: '600',
  },
});

export default CreateUsernameScreen;
