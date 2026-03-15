/**
 * Login Screen – Web3 wallet connection
 */
import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import {useNavigation} from '@react-navigation/native';
import {NativeStackNavigationProp} from '@react-navigation/native-stack';
import Toast from 'react-native-toast-message';

import {useAuthStore} from '../store';
import {AuthStackParamList} from '../types';
import {COLORS} from '../constants/colors';
import {FONT_SIZES, SPACING, RADIUS} from '../constants/theme';
import WalletConnectButton from '../components/wallet/WalletConnectButton';

type Nav = NativeStackNavigationProp<AuthStackParamList, 'Login'>;

const LoginScreen = (): React.JSX.Element => {
  const navigation = useNavigation<Nav>();
  const {connectWallet, isLoading, walletAddress, error, clearError} = useAuthStore();

  const handleConnectWallet = async (
    walletType: 'argentX' | 'braavos' | 'walletConnect',
  ): Promise<void> => {
    clearError();
    await connectWallet(walletType);

    // If walletAddress set but not authenticated, user needs a username
    const state = useAuthStore.getState();
    if (state.walletAddress && !state.isAuthenticated) {
      navigation.navigate('CreateUsername', {walletAddress: state.walletAddress});
    } else if (state.error) {
      Toast.show({type: 'error', text1: 'Connection Failed', text2: state.error});
    }
  };

  return (
    <LinearGradient
      colors={COLORS.gradientBackground}
      style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.flex}>
        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}>

          {/* Hero */}
          <View style={styles.hero}>
            <LinearGradient
              colors={COLORS.gradientPrimary}
              style={styles.logoBox}>
              <Text style={styles.logoIcon}>⚡</Text>
            </LinearGradient>
            <Text style={styles.heroTitle}>DareFi</Text>
            <Text style={styles.heroSubtitle}>
              Create dares. Stake crypto.{'\n'}Win big. On Starknet.
            </Text>
          </View>

          {/* Stats */}
          <View style={styles.statsRow}>
            {[
              {label: 'Active Dares', value: '1.2K'},
              {label: 'Total Pool', value: '$84K'},
              {label: 'Winners', value: '930'},
            ].map(s => (
              <View key={s.label} style={styles.stat}>
                <Text style={styles.statValue}>{s.value}</Text>
                <Text style={styles.statLabel}>{s.label}</Text>
              </View>
            ))}
          </View>

          {/* Wallet Options */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Connect Your Wallet</Text>
            <Text style={styles.sectionSubtitle}>
              Sign in securely with your Starknet wallet.{'\n'}No gas required for transactions.
            </Text>

            <WalletConnectButton
              walletType="argentX"
              onPress={() => handleConnectWallet('argentX')}
              isLoading={isLoading}
            />
            <WalletConnectButton
              walletType="braavos"
              onPress={() => handleConnectWallet('braavos')}
              isLoading={isLoading}
            />
            <WalletConnectButton
              walletType="walletConnect"
              onPress={() => handleConnectWallet('walletConnect')}
              isLoading={isLoading}
            />
          </View>

          {/* Features */}
          <View style={styles.features}>
            {[
              {icon: '⛽', text: 'Gasless transactions via Starkzap'},
              {icon: '🔒', text: 'Funds secured in smart contract escrow'},
              {icon: '💰', text: 'Earn yield on locked funds'},
            ].map(f => (
              <View key={f.text} style={styles.featureRow}>
                <Text style={styles.featureIcon}>{f.icon}</Text>
                <Text style={styles.featureText}>{f.text}</Text>
              </View>
            ))}
          </View>

          <Text style={styles.tos}>
            By connecting you agree to our Terms of Service and Privacy Policy.
          </Text>
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
  hero: {
    alignItems: 'center',
    marginBottom: SPACING['2xl'],
  },
  logoBox: {
    width: 80,
    height: 80,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.md,
    shadowColor: COLORS.primary,
    shadowOffset: {width: 0, height: 8},
    shadowOpacity: 0.5,
    shadowRadius: 16,
    elevation: 12,
  },
  logoIcon: {fontSize: 44},
  heroTitle: {
    fontSize: FONT_SIZES['4xl'],
    fontWeight: '900',
    color: COLORS.text,
    letterSpacing: -0.5,
  },
  heroSubtitle: {
    fontSize: FONT_SIZES.base,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginTop: SPACING.sm,
    lineHeight: 24,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: COLORS.card,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: SPACING.base,
    marginBottom: SPACING.xl,
  },
  stat: {alignItems: 'center'},
  statValue: {
    fontSize: FONT_SIZES.xl,
    fontWeight: '800',
    color: COLORS.primaryLight,
  },
  statLabel: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.textMuted,
    marginTop: 2,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  section: {
    marginBottom: SPACING.xl,
  },
  sectionTitle: {
    fontSize: FONT_SIZES.xl,
    fontWeight: '800',
    color: COLORS.text,
    marginBottom: SPACING.xs,
  },
  sectionSubtitle: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textMuted,
    marginBottom: SPACING.lg,
    lineHeight: 20,
  },
  features: {
    gap: SPACING.sm,
    marginBottom: SPACING.xl,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  featureIcon: {fontSize: 18},
  featureText: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
    flex: 1,
  },
  tos: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.textMuted,
    textAlign: 'center',
    lineHeight: 18,
  },
});

export default LoginScreen;
