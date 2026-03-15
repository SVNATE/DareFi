/**
 * Results Screen – shows winner, payout, transaction
 */
import React from 'react';
import {View, Text, StyleSheet, ScrollView, TouchableOpacity} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import {NativeStackScreenProps} from '@react-navigation/native-stack';

import {useDaresStore} from '../store';
import {HomeStackParamList} from '../types';
import {COLORS} from '../constants/colors';
import {FONT_SIZES, SPACING, RADIUS} from '../constants/theme';
import Avatar from '../components/common/Avatar';
import Button from '../components/common/Button';
import ScreenHeader from '../components/common/ScreenHeader';
import {shortenTxHash} from '../services/starknet';

type Props = NativeStackScreenProps<HomeStackParamList, 'Results'>;

const ResultsScreen = ({route, navigation}: Props): React.JSX.Element => {
  const {dareId} = route.params;
  const {selectedDare} = useDaresStore();

  const dare = selectedDare;
  const isWin = dare?.winner === 'success';

  if (!dare) {
    return (
      <View style={[styles.screen, {alignItems: 'center', justifyContent: 'center'}]}>
        <Text style={{color: COLORS.textMuted}}>No dare loaded.</Text>
      </View>
    );
  }

  return (
    <View style={styles.screen}>
      <ScreenHeader title="Results" showBack />

      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}>

        {/* Hero Result */}
        <LinearGradient
          colors={isWin ? COLORS.gradientSuccess : COLORS.gradientDanger}
          style={styles.resultHero}>
          <Text style={styles.resultEmoji}>{isWin ? '🏆' : '💀'}</Text>
          <Text style={styles.resultTitle}>{isWin ? 'Challenge Completed!' : 'Challenge Failed!'}</Text>
          <Text style={styles.resultSubtitle}>
            {isWin
              ? `@${dare.creator.username} crushed it!`
              : `@${dare.creator.username} didn't make it.`}
          </Text>
        </LinearGradient>

        {/* Pool Distribution */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>💰 Prize Distribution</Text>

          <View style={styles.poolCard}>
            <View style={styles.poolRow}>
              <Text style={styles.poolLabel}>Total Pool</Text>
              <Text style={styles.poolValue}>${dare.totalPool} USDC</Text>
            </View>
            <View style={styles.poolRow}>
              <Text style={styles.poolLabel}>Platform Fee (1.5%)</Text>
              <Text style={[styles.poolValue, {color: COLORS.textMuted}]}>
                -${(parseFloat(dare.totalPool) * 0.015).toFixed(2)}
              </Text>
            </View>
            <View style={[styles.poolRow, styles.poolRowTotal]}>
              <Text style={styles.poolTotalLabel}>Winner Receives</Text>
              <Text style={styles.poolTotalValue}>
                ${(parseFloat(dare.totalPool) * 0.985).toFixed(2)} USDC
              </Text>
            </View>
          </View>
        </View>

        {/* Votes Summary */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>🗳️ Vote Summary</Text>
          <View style={styles.voteRow}>
            <View style={styles.voteItem}>
              <Text style={[styles.voteCount, {color: COLORS.success}]}>{dare.votesForSuccess}</Text>
              <Text style={styles.voteLabel}>Voted Success</Text>
            </View>
            <Text style={styles.voteSeparator}>vs</Text>
            <View style={styles.voteItem}>
              <Text style={[styles.voteCount, {color: COLORS.danger}]}>{dare.votesForFail}</Text>
              <Text style={styles.voteLabel}>Voted Fail</Text>
            </View>
          </View>
        </View>

        {/* Transaction */}
        {dare.rewardTxHash && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>🔗 On-Chain Record</Text>
            <View style={styles.txCard}>
              <Text style={styles.txLabel}>Transaction Hash</Text>
              <Text style={styles.txHash}>{shortenTxHash(dare.rewardTxHash)}</Text>
              <Text style={styles.txNetwork}>Starknet Mainnet · Verified ✓</Text>
            </View>
          </View>
        )}

        {/* Participants */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>👥 Participants</Text>
          <View style={styles.participantRow}>
            <Avatar uri={dare.creator.avatar} username={dare.creator.username} size="sm" showBorder />
            <View style={{flex: 1}}>
              <Text style={styles.participantName}>@{dare.creator.username}</Text>
              <Text style={styles.participantRole}>Creator · Staked ${dare.creatorStake}</Text>
            </View>
            {isWin && <Text style={styles.participantWinner}>🏆 Won</Text>}
          </View>
          {dare.bets.map(bet => (
            <View key={bet.id} style={styles.participantRow}>
              <Avatar uri={bet.avatar} username={bet.username} size="sm" />
              <View style={{flex: 1}}>
                <Text style={styles.participantName}>@{bet.username}</Text>
                <Text style={styles.participantRole}>
                  Bet ${bet.amount} on {bet.prediction === 'success' ? 'success' : 'fail'}
                </Text>
              </View>
              {((isWin && bet.prediction === 'success') || (!isWin && bet.prediction === 'fail')) && (
                <Text style={styles.participantWinner}>💰 Won</Text>
              )}
            </View>
          ))}
        </View>

        {/* Actions */}
        <View style={styles.actions}>
          <Button
            title="🏠 Back to Home"
            onPress={() => navigation.navigate('Feed')}
            variant="primary"
            size="lg"
            fullWidth
          />
          <Button
            title="↗️ Share Results"
            onPress={() => {}}
            variant="outline"
            size="lg"
            fullWidth
          />
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  screen: {flex: 1, backgroundColor: COLORS.background},
  scroll: {paddingHorizontal: SPACING.base, paddingBottom: SPACING['4xl']},

  resultHero: {
    borderRadius: RADIUS.xl,
    padding: SPACING['3xl'],
    alignItems: 'center',
    gap: SPACING.sm,
    marginVertical: SPACING.lg,
  },
  resultEmoji: {fontSize: 72},
  resultTitle: {fontSize: FONT_SIZES['2xl'], fontWeight: '900', color: COLORS.white},
  resultSubtitle: {fontSize: FONT_SIZES.base, color: 'rgba(255,255,255,0.85)'},

  section: {marginBottom: SPACING.xl},
  sectionTitle: {fontSize: FONT_SIZES.base, fontWeight: '700', color: COLORS.text, marginBottom: SPACING.md},

  poolCard: {
    backgroundColor: COLORS.card,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: SPACING.base,
    gap: SPACING.sm,
  },
  poolRow: {flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center'},
  poolLabel: {fontSize: FONT_SIZES.sm, color: COLORS.textMuted},
  poolValue: {fontSize: FONT_SIZES.sm, fontWeight: '600', color: COLORS.text},
  poolRowTotal: {
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    paddingTop: SPACING.sm,
    marginTop: SPACING.xs,
  },
  poolTotalLabel: {fontSize: FONT_SIZES.base, fontWeight: '700', color: COLORS.text},
  poolTotalValue: {fontSize: FONT_SIZES.lg, fontWeight: '900', color: COLORS.success},

  voteRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.card,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
    overflow: 'hidden',
  },
  voteItem: {flex: 1, alignItems: 'center', padding: SPACING.lg},
  voteCount: {fontSize: FONT_SIZES['3xl'], fontWeight: '900'},
  voteLabel: {fontSize: FONT_SIZES.sm, color: COLORS.textMuted, marginTop: 4},
  voteSeparator: {fontSize: FONT_SIZES.sm, color: COLORS.textMuted, fontWeight: '600'},

  txCard: {
    backgroundColor: COLORS.card,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: SPACING.base,
    gap: SPACING.xs,
  },
  txLabel: {fontSize: FONT_SIZES.xs, color: COLORS.textMuted, textTransform: 'uppercase', letterSpacing: 1},
  txHash: {fontSize: FONT_SIZES.base, fontWeight: '700', color: COLORS.primary, fontFamily: 'monospace'},
  txNetwork: {fontSize: FONT_SIZES.xs, color: COLORS.success},

  participantRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
    paddingVertical: SPACING.sm,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  participantName: {fontSize: FONT_SIZES.sm, fontWeight: '700', color: COLORS.text},
  participantRole: {fontSize: FONT_SIZES.xs, color: COLORS.textMuted, marginTop: 2},
  participantWinner: {fontSize: FONT_SIZES.sm, fontWeight: '700'},

  actions: {gap: SPACING.md},
});

export default ResultsScreen;
