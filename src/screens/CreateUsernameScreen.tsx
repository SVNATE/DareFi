/**
 * Create Username Screen
 */
import React, {useState} from 'react';
import {
  View,
  Text,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
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

const CreateUsernameScreen = ({route}: Props): React.JSX.Element => {
  const {walletAddress} = route.params;
  const {createUsername, isLoading} = useAuthStore();

  const [username, setUsername] = useState('');
  const [usernameAvailable, setUsernameAvailable] = useState<boolean | null>(null);
  const [checking, setChecking] = useState(false);
  const [error, setError] = useState('');

  const validateLocal = (value: string): string => {
    if (value.length < 3) {return 'At least 3 characters';}
    if (value.length > 20) {return 'Max 20 characters';}
    if (!USERNAME_RE.test(value)) {return 'Letters, numbers and _ only';}
    return '';
  };

  // Debounced availability check
  const checkAvailability = debounce(async (value: string) => {
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
  }, 600);

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
      colors={COLORS.gradientBackground}
      style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.flex}>
        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled">

          {/* Header */}
          <View style={styles.header}>
            <View style={styles.logoBox}>
              <Text style={styles.logoEmoji}>👤</Text>
            </View>
            <Text style={styles.title}>Create Your Profile</Text>
            <Text style={styles.subtitle}>
              One last step! Choose a unique username for your DareFi profile.
            </Text>
          </View>

          {/* Wallet Info */}
          <View style={styles.walletBadge}>
            <Text style={styles.walletIcon}>🔗</Text>
            <Text style={styles.walletAddress}>{shortenAddress(walletAddress)}</Text>
            <View style={styles.connectedDot} />
          </View>

          {/* Username Input */}
          <View style={styles.inputSection}>
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
            />
            {hint && !error && (
              <Text style={[styles.hint, {color: hintColor}]}>
                {checking && <ActivityIndicator size="small" color={COLORS.textMuted} />}
                {' '}{hint}
              </Text>
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
          </View>

          <Button
            title="Create Profile"
            onPress={handleSubmit}
            isLoading={isLoading}
            disabled={!!error || !username || usernameAvailable === false}
            fullWidth
            size="lg"
          />
        </ScrollView>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {flex: 1},
  flex: {flex: 1},
  scroll: {
    paddingHorizontal: SPACING.base,
    paddingTop: SPACING['4xl'],
    paddingBottom: SPACING['3xl'],
  },
  header: {
    alignItems: 'center',
    marginBottom: SPACING['2xl'],
  },
  logoBox: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: COLORS.cardElevated,
    borderWidth: 2,
    borderColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.md,
  },
  logoEmoji: {fontSize: 40},
  title: {
    fontSize: FONT_SIZES['2xl'],
    fontWeight: '800',
    color: COLORS.text,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginTop: SPACING.sm,
    lineHeight: 20,
  },
  walletBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.card,
    borderRadius: RADIUS.full,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingHorizontal: SPACING.base,
    paddingVertical: SPACING.sm,
    alignSelf: 'center',
    marginBottom: SPACING.xl,
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
  inputSection: {
    marginBottom: SPACING.xl,
  },
  hint: {
    fontSize: FONT_SIZES.sm,
    marginTop: -SPACING.sm,
    marginBottom: SPACING.sm,
    fontWeight: '600',
  },
  rules: {
    marginTop: SPACING.sm,
    gap: SPACING.xs,
  },
  ruleRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: SPACING.xs,
  },
  ruleDot: {color: COLORS.textMuted, fontSize: FONT_SIZES.sm},
  ruleText: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textMuted,
    flex: 1,
  },
});

export default CreateUsernameScreen;
