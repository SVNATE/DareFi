/**
 * Login Screen – Web3 wallet connection
 */
import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  useWindowDimensions,
  Platform,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import Svg, {Path} from 'react-native-svg';
import {useNavigation} from '@react-navigation/native';
import {NativeStackNavigationProp} from '@react-navigation/native-stack';
import Toast from 'react-native-toast-message';

import {useAuthStore} from '../store';
import {AuthStackParamList} from '../types';
import {COLORS} from '../constants/colors';
import {FONT_SIZES, SPACING} from '../constants/theme';
import WalletConnectButton from '../components/wallet/WalletConnectButton';

type Nav = NativeStackNavigationProp<AuthStackParamList, 'Login'>;

const LOGIN_COLORS = {
  bgStart: '#0F1724',
  bgEnd: '#2F2F3D',
  neonLime: '#D9FF00',
  neonCyan: '#21E8E4',
  limeGlass: 'rgba(217,255,0,0.14)',
  limeBorder: 'rgba(217,255,0,0.26)',
};

const LoginScreen = (): React.JSX.Element => {
  const navigation = useNavigation<Nav>();
  const {height, width} = useWindowDimensions();
  const isCompact = height < 760;
  const {connectWallet, isLoading, clearError} = useAuthStore();

  const orbSizeA = Math.min(width * 0.7, 300);
  const orbSizeB = Math.min(width * 0.9, 360);

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
      colors={[LOGIN_COLORS.bgStart, LOGIN_COLORS.bgEnd]}
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

      <View
        style={[
          styles.frame,
          {
            paddingTop: Platform.OS === 'ios' ? SPACING['3xl'] : SPACING['2xl'],
            paddingBottom: isCompact ? SPACING.base : SPACING.xl,
            paddingHorizontal: isCompact ? SPACING.lg : SPACING.xl,
          },
        ]}>
        <View style={[styles.hero, isCompact && styles.heroCompact]}>
          <LinearGradient
            colors={[LOGIN_COLORS.neonLime, '#A1C700']}
            start={{x: 0, y: 0}}
            end={{x: 1, y: 1}}
            style={[styles.logoOuter, isCompact && styles.logoOuterCompact]}>
            <View style={styles.logoInner}>
              <Svg width={isCompact ? 34 : 40} height={isCompact ? 34 : 40} viewBox="0 0 40 40">
                <Path
                  d="M10 5C10 5 25 5 30 15C35 25 25 35 15 35H10V5Z"
                  stroke={LOGIN_COLORS.neonLime}
                  strokeWidth={6}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <Path
                  d="M10 20H20"
                  stroke={LOGIN_COLORS.neonLime}
                  strokeWidth={4}
                  strokeLinecap="round"
                />
              </Svg>
            </View>
          </LinearGradient>

          <View style={styles.brandRow}>
            <Text style={[styles.brandPrimary, isCompact && styles.brandPrimaryCompact]}>Dare</Text>
            <Text style={[styles.brandAccent, isCompact && styles.brandPrimaryCompact]}>Fi</Text>
          </View>
        </View>

        <View style={[styles.main, isCompact && styles.mainCompact]}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, isCompact && styles.sectionTitleCompact]}>
              Connect Your Wallet
            </Text>
            <Text style={[styles.sectionSubtitle, isCompact && styles.sectionSubtitleCompact]}>
              Start betting on real world challenges.
            </Text>
          </View>

          <View style={styles.walletList}>
            <WalletConnectButton
              walletType="argentX"
              onPress={() => handleConnectWallet('argentX')}
              isLoading={isLoading}
              compact={isCompact}
            />
            <WalletConnectButton
              walletType="braavos"
              onPress={() => handleConnectWallet('braavos')}
              isLoading={isLoading}
              compact={isCompact}
            />
            <WalletConnectButton
              walletType="walletConnect"
              onPress={() => handleConnectWallet('walletConnect')}
              isLoading={isLoading}
              compact={isCompact}
            />
          </View>
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
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    overflow: 'hidden',
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
  hero: {
    alignItems: 'center',
    marginTop: SPACING.sm,
  },
  heroCompact: {
    marginTop: 0,
  },
  logoOuter: {
    width: 96,
    height: 96,
    borderRadius: 30,
    padding: 2,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.base,
    shadowColor: LOGIN_COLORS.neonLime,
    shadowOffset: {width: 0, height: 8},
    shadowOpacity: 0.34,
    shadowRadius: 24,
    elevation: 14,
  },
  logoOuterCompact: {
    width: 82,
    height: 82,
    borderRadius: 26,
  },
  logoInner: {
    flex: 1,
    width: '100%',
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: LOGIN_COLORS.limeGlass,
    borderWidth: 1,
    borderColor: LOGIN_COLORS.limeBorder,
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  brandPrimary: {
    fontSize: FONT_SIZES['4xl'],
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: -1,
  },
  brandAccent: {
    fontSize: FONT_SIZES['4xl'],
    fontWeight: '900',
    color: LOGIN_COLORS.neonLime,
    letterSpacing: -1,
  },
  brandPrimaryCompact: {
    fontSize: FONT_SIZES['3xl'],
  },
  main: {
    flex: 1,
    justifyContent: 'center',
  },
  mainCompact: {
    justifyContent: 'center',
  },
  sectionHeader: {
    marginBottom: SPACING.lg,
  },
  sectionTitle: {
    fontSize: FONT_SIZES['2xl'],
    fontWeight: '800',
    color: LOGIN_COLORS.neonLime,
    marginBottom: SPACING.xs,
    textAlign: 'center',
  },
  sectionTitleCompact: {
    fontSize: FONT_SIZES.xl,
  },
  sectionSubtitle: {
    fontSize: FONT_SIZES.base,
    color: COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
    paddingHorizontal: SPACING.xl,
  },
  sectionSubtitleCompact: {
    fontSize: FONT_SIZES.sm,
    lineHeight: 19,
    paddingHorizontal: SPACING.lg,
  },
  walletList: {
    gap: SPACING.sm,
  },
  footer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingBottom: SPACING.sm,
  },
  footerDots: {
    flexDirection: 'row',
    gap: SPACING.xs,
    marginBottom: SPACING.sm,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  dotActive: {
    backgroundColor: LOGIN_COLORS.neonLime,
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

export default LoginScreen;
