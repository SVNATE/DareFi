/**
 * Profile Screen — current user's profile, stats, transactions, staking
 */
import React, {useEffect, useCallback} from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Clipboard,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import {useNavigation} from '@react-navigation/native';

import {useAuthStore} from '../store/authStore';
import {useWalletStore} from '../store/walletStore';
import {COLORS} from '../constants/colors';
import {FONT_SIZES, SPACING, RADIUS} from '../constants/theme';
import Avatar from '../components/common/Avatar';
import ScreenHeader from '../components/common/ScreenHeader';
import {shortenAddress} from '../services/starknet';

const ProfileScreen = (): React.JSX.Element => {
  const navigation = useNavigation();
  const {user, walletAddress, logout} = useAuthStore();
  const {balance, transactions, stakingPosition, fetchBalance, fetchTransactions, fetchStakingPosition} = useWalletStore();

  useEffect(() => {
    if (walletAddress) {
      fetchBalance(walletAddress);
      fetchTransactions(walletAddress);
      fetchStakingPosition(walletAddress);
    }
  }, [walletAddress, fetchBalance, fetchTransactions, fetchStakingPosition]);

  const handleLogout = useCallback(() => {
    Alert.alert('Disconnect Wallet', 'Are you sure you want to disconnect?', [
      {text: 'Cancel', style: 'cancel'},
      {text: 'Disconnect', style: 'destructive', onPress: logout},
    ]);
  }, [logout]);

  const copyAddress = useCallback(() => {
    if (walletAddress) {
      Clipboard.setString(walletAddress);
      Alert.alert('Copied', 'Wallet address copied to clipboard');
    }
  }, [walletAddress]);

  const stats = [
    {label: 'Dares Created', value: String(user?.daresCreated ?? 0), icon: '🎯'},
    {label: 'Completed', value: String(user?.daresCompleted ?? 0), icon: '✅'},
    {label: 'Win Rate', value: `${user?.successRate ?? 0}%`, icon: '🏆'},
    {label: 'Earnings', value: `$${user?.totalWinnings ?? 0}`, icon: '💰'},
  ];

  return (
    <View style={styles.screen}>
      <ScreenHeader title="Profile" />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scroll}>

        {/* Hero */}
        <LinearGradient
          colors={[COLORS.primaryGlow, 'transparent']}
          style={styles.hero}>
          <Avatar uri={user?.avatar} username={user?.username} size="xl" />
          <Text style={styles.username}>@{user?.username ?? 'Anonymous'}</Text>
          <Text style={styles.reputation}>⭐ {user?.reputation ?? 0} XP</Text>
          <TouchableOpacity style={styles.addressBadge} onPress={copyAddress}>
            <Text style={styles.addressText}>{shortenAddress(walletAddress ?? '')}</Text>
            <Text style={styles.copyIcon}> 📋</Text>
          </TouchableOpacity>
        </LinearGradient>

        {/* Stats grid */}
        <View style={styles.statsGrid}>
          {stats.map(stat => (
            <View key={stat.label} style={styles.statCard}>
              <Text style={styles.statIcon}>{stat.icon}</Text>
              <Text style={styles.statValue}>{stat.value}</Text>
              <Text style={styles.statLabel}>{stat.label}</Text>
            </View>
          ))}
        </View>

        {/* Balances */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Wallet</Text>
          <View style={styles.balanceRow}>
            <Text style={styles.balanceLabel}>USDC Balance</Text>
            <Text style={styles.balanceValue}>${balance?.usdc ?? '0.00'}</Text>
          </View>
          {stakingPosition && parseFloat(stakingPosition.stakedAmount) > 0 && (
            <View style={styles.balanceRow}>
              <Text style={styles.balanceLabel}>Staked (Yield)</Text>
              <View style={styles.balanceRight}>
                <Text style={styles.balanceValue}>${stakingPosition.stakedAmount}</Text>
                <Text style={styles.yieldBadge}>+{stakingPosition.apy}% APY</Text>
              </View>
            </View>
          )}
        </View>

        {/* Transactions */}
        {transactions.length > 0 && (
          <View style={styles.sectionCard}>
            <Text style={styles.sectionTitle}>Recent Activity</Text>
            {transactions.slice(0, 5).map(tx => (
              <View key={tx.id} style={styles.txRow}>
                <View style={styles.txLeft}>
                  <Text style={styles.txIcon}>
                    {tx.type === 'deposit' ? '⬇️' : tx.type === 'withdrawal' ? '⬆️' : tx.type === 'win' ? '🏆' : tx.type === 'stake' ? '🔒' : '💸'}
                  </Text>
                  <View>
                    <Text style={styles.txType}>{tx.type.charAt(0).toUpperCase() + tx.type.slice(1)}</Text>
                    <Text style={styles.txDate}>{new Date(tx.timestamp).toLocaleDateString()}</Text>
                  </View>
                </View>
                <Text style={[
                  styles.txAmount,
                  {color: ['win', 'deposit'].includes(tx.type) ? COLORS.success : COLORS.danger},
                ]}>
                  {['win', 'deposit'].includes(tx.type) ? '+' : '-'}${tx.amount}
                </Text>
              </View>
            ))}
          </View>
        )}

        {/* Bio */}
        {user?.bio && (
          <View style={styles.sectionCard}>
            <Text style={styles.sectionTitle}>Bio</Text>
            <Text style={styles.bioText}>{user.bio}</Text>
          </View>
        )}

        {/* Logout */}
        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Text style={styles.logoutText}>Disconnect Wallet</Text>
        </TouchableOpacity>

        <Text style={styles.version}>DareFi v1.0.0 · Built on Starknet</Text>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  screen: {flex: 1, backgroundColor: COLORS.background},
  scroll: {paddingBottom: SPACING['4xl']},
  hero: {
    alignItems: 'center',
    paddingVertical: SPACING['2xl'],
    paddingHorizontal: SPACING.base,
    gap: SPACING.sm,
    marginBottom: SPACING.md,
  },
  username: {
    fontSize: FONT_SIZES['2xl'],
    fontWeight: '800',
    color: COLORS.text,
    marginTop: SPACING.sm,
  },
  reputation: {fontSize: FONT_SIZES.sm, color: COLORS.textMuted},
  addressBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.card,
    borderRadius: RADIUS.md,
    paddingHorizontal: SPACING.md,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginTop: SPACING.xs,
  },
  addressText: {fontSize: FONT_SIZES.sm, color: COLORS.textSecondary, fontFamily: 'Courier'},
  copyIcon: {fontSize: 14},
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: SPACING.base,
    gap: SPACING.sm,
    marginBottom: SPACING.md,
  },
  statCard: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: COLORS.card,
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
    gap: 4,
  },
  statIcon: {fontSize: 24},
  statValue: {fontSize: FONT_SIZES.xl, fontWeight: '800', color: COLORS.text},
  statLabel: {fontSize: FONT_SIZES.xs, color: COLORS.textMuted, textAlign: 'center'},
  sectionCard: {
    marginHorizontal: SPACING.base,
    backgroundColor: COLORS.card,
    borderRadius: RADIUS.lg,
    padding: SPACING.base,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: SPACING.md,
  },
  sectionTitle: {
    fontSize: FONT_SIZES.base,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: SPACING.sm,
  },
  balanceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: SPACING.xs,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  balanceLabel: {fontSize: FONT_SIZES.sm, color: COLORS.textSecondary},
  balanceRight: {alignItems: 'flex-end'},
  balanceValue: {fontSize: FONT_SIZES.base, fontWeight: '700', color: COLORS.text},
  yieldBadge: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.success,
    fontWeight: '600',
    marginTop: 2,
  },
  txRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: SPACING.sm,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  txLeft: {flexDirection: 'row', alignItems: 'center', gap: SPACING.md},
  txIcon: {fontSize: 20},
  txType: {fontSize: FONT_SIZES.sm, fontWeight: '600', color: COLORS.text},
  txDate: {fontSize: FONT_SIZES.xs, color: COLORS.textMuted, marginTop: 2},
  txAmount: {fontSize: FONT_SIZES.base, fontWeight: '700'},
  bioText: {fontSize: FONT_SIZES.sm, color: COLORS.textSecondary, lineHeight: 22},
  logoutButton: {
    marginHorizontal: SPACING.base,
    borderRadius: RADIUS.md,
    paddingVertical: SPACING.md,
    alignItems: 'center',
    backgroundColor: COLORS.dangerGlow,
    borderWidth: 1,
    borderColor: COLORS.danger,
    marginBottom: SPACING.md,
  },
  logoutText: {
    fontSize: FONT_SIZES.base,
    fontWeight: '700',
    color: COLORS.danger,
  },
  version: {
    textAlign: 'center',
    fontSize: FONT_SIZES.xs,
    color: COLORS.textMuted + '80',
    marginBottom: SPACING.md,
  },
});

export default ProfileScreen;
