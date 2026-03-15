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
  compact?: boolean;
}

const WALLET_META: Record<
  'argentX' | 'braavos' | 'walletConnect',
  {name: string; mark: string; accent: string; accentBg: string}
> = {
  argentX: {
    name: 'ArgentX wallet',
    mark: 'AX',
    accent: '#FF8444',
    accentBg: 'rgba(255,132,68,0.16)',
  },
  braavos: {
    name: 'Braavos wallet',
    mark: 'BR',
    accent: '#3B82F6',
    accentBg: 'rgba(59,130,246,0.16)',
  },
  walletConnect: {
    name: 'WalletConnect',
    mark: 'WC',
    accent: '#3396FF',
    accentBg: 'rgba(51,150,255,0.16)',
  },
};

const WalletConnectButton = ({
  walletType,
  onPress,
  isLoading = false,
  compact = false,
}: WalletConnectButtonProps): React.JSX.Element => {
  const meta = WALLET_META[walletType];
  const containerStyle = [styles.container, compact && styles.containerCompact];
  const iconStyle = [styles.icon, {backgroundColor: meta.accentBg}];
  const markStyle = [styles.mark, {color: meta.accent}];
  const nameStyle = [styles.name, compact && styles.nameCompact];

  return (
    <TouchableOpacity
      style={containerStyle}
      onPress={onPress}
      disabled={isLoading}
      activeOpacity={0.88}>
      <View style={styles.left}>
        <View style={iconStyle}>
          <Text style={markStyle}>{meta.mark}</Text>
        </View>
        <Text style={nameStyle}>{meta.name}</Text>
      </View>

      {isLoading ? (
        <ActivityIndicator size="small" color="#21E8E4" />
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
    justifyContent: 'space-between',
    backgroundColor: 'rgba(47,47,61,0.72)',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: 'rgba(33,232,228,0.24)',
    paddingHorizontal: SPACING.base,
    paddingVertical: SPACING.md,
    marginBottom: SPACING.sm,
  },
  containerCompact: {
    paddingVertical: SPACING.sm,
  },
  left: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: SPACING.md,
  },
  icon: {
    width: 40,
    height: 40,
    borderRadius: RADIUS.md,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  mark: {
    fontSize: FONT_SIZES.sm,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  name: {
    fontSize: FONT_SIZES.base,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  nameCompact: {
    fontSize: FONT_SIZES.md,
  },
  arrow: {
    fontSize: 26,
    color: '#7F8AA3',
    fontWeight: '400',
    lineHeight: 26,
  },
});

export default WalletConnectButton;
