/**
 * Wallet Connect Button used on Login screen.
 */
import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import {COLORS} from '../../constants/colors';
import {FONT_SIZES, RADIUS, SPACING} from '../../constants/theme';

interface WalletConnectButtonProps {
  walletType: 'argentX' | 'braavos' | 'walletConnect';
  onPress: () => void;
  isLoading?: boolean;
}

const WALLET_META: Record<
  'argentX' | 'braavos' | 'walletConnect',
  {name: string; emoji: string; description: string}
> = {
  argentX: {
    name: 'Argent X',
    emoji: '🦋',
    description: 'Popular Starknet wallet',
  },
  braavos: {
    name: 'Braavos',
    emoji: '⚔️',
    description: 'Secure Starknet wallet',
  },
  walletConnect: {
    name: 'WalletConnect',
    emoji: '🔗',
    description: 'Connect any wallet via QR',
  },
};

const WalletConnectButton = ({
  walletType,
  onPress,
  isLoading = false,
}: WalletConnectButtonProps): React.JSX.Element => {
  const meta = WALLET_META[walletType];

  return (
    <TouchableOpacity
      style={styles.container}
      onPress={onPress}
      disabled={isLoading}
      activeOpacity={0.75}>
      <View style={styles.icon}>
        <Text style={styles.emoji}>{meta.emoji}</Text>
      </View>
      <View style={styles.info}>
        <Text style={styles.name}>{meta.name}</Text>
        <Text style={styles.description}>{meta.description}</Text>
      </View>
      {isLoading ? (
        <ActivityIndicator size="small" color={COLORS.primary} />
      ) : (
        <Text style={styles.arrow}>›</Text>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.card,
    borderRadius: RADIUS.lg,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    padding: SPACING.base,
    marginBottom: SPACING.sm,
    gap: SPACING.md,
  },
  icon: {
    width: 48,
    height: 48,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.cardElevated,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emoji: {
    fontSize: 24,
  },
  info: {
    flex: 1,
  },
  name: {
    fontSize: FONT_SIZES.base,
    fontWeight: '700',
    color: COLORS.text,
  },
  description: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textMuted,
    marginTop: 2,
  },
  arrow: {
    fontSize: 24,
    color: COLORS.textMuted,
    fontWeight: '300',
  },
});

export default WalletConnectButton;
