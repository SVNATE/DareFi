/**
 * Dare Details Screen
 * Shows full dare info, participants, proof, join/vote/proof actions
 */
import React, {useEffect, useState, useCallback} from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Modal,
  TextInput,
  Alert,
} from 'react-native';
import {NativeStackScreenProps} from '@react-navigation/native-stack';
import LinearGradient from 'react-native-linear-gradient';
import Toast from 'react-native-toast-message';

import {useAuthStore, useDaresStore} from '../store';
import {HomeStackParamList} from '../types';
import {COLORS} from '../constants/colors';
import {FONT_SIZES, SPACING, RADIUS} from '../constants/theme';
import Avatar from '../components/common/Avatar';
import Badge, {getDareStatusBadge} from '../components/common/Badge';
import PoolProgressBar from '../components/common/PoolProgressBar';
import Countdown from '../components/common/Countdown';
import Button from '../components/common/Button';
import ScreenHeader from '../components/common/ScreenHeader';
import {DARE_CATEGORIES, APP_CONFIG} from '../constants/config';
import {formatDistanceToNow} from 'date-fns';

type Props = NativeStackScreenProps<HomeStackParamList, 'DareDetails'>;

const DareDetailsScreen = ({route, navigation}: Props): React.JSX.Element => {
  const {dareId} = route.params;
  const {user} = useAuthStore();
  const {selectedDare, isLoadingDare, loadDare, joinBet, vote, isJoining, isVoting, actionError, clearActionError, likeDare} =
    useDaresStore();

  const [showBetModal, setShowBetModal] = useState(false);
  const [betAmount, setBetAmount] = useState('');
  const [betPrediction, setBetPrediction] = useState<'success' | 'fail'>('fail');

  useEffect(() => {
    loadDare(dareId);
  }, [dareId]);

  useEffect(() => {
    if (actionError) {
      Toast.show({type: 'error', text1: 'Error', text2: actionError});
      clearActionError();
    }
  }, [actionError]);

  const handleJoinBet = useCallback(async (): Promise<void> => {
    if (!user || !selectedDare) {return;}
    const amount = parseFloat(betAmount);
    if (isNaN(amount) || amount < APP_CONFIG.minStakeUSDC) {
      Toast.show({type: 'error', text1: 'Invalid amount', text2: `Minimum bet is $${APP_CONFIG.minStakeUSDC}`});
      return;
    }

    setShowBetModal(false);
    const success = await joinBet(user.walletAddress, {
      dareId,
      prediction: betPrediction,
      betAmount: betAmount,
    });
    if (success) {
      Toast.show({type: 'success', text1: '🎯 Bet Placed!', text2: `You bet $${betAmount} on ${betPrediction === 'success' ? 'success' : 'fail'}`});
    }
  }, [user, selectedDare, betAmount, betPrediction, dareId, joinBet]);

  const handleVote = useCallback(async (voteOption: 'success' | 'fail'): Promise<void> => {
    if (!user || !selectedDare) {return;}
    if (selectedDare.userVote) {
      Toast.show({type: 'info', text1: 'Already voted'});
      return;
    }
    const success = await vote(user.walletAddress, dareId, voteOption);
    if (success) {
      Toast.show({type: 'success', text1: '✅ Vote Submitted!', text2: `You voted: ${voteOption}`});
    }
  }, [user, selectedDare, dareId, vote]);

  if (isLoadingDare || !selectedDare) {
    return (
      <View style={[styles.screen, styles.center]}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={styles.loadingText}>Loading dare...</Text>
      </View>
    );
  }

  const dare = selectedDare;
  const statusBadge = getDareStatusBadge(dare.status);
  const category = DARE_CATEGORIES.find(c => c.id === dare.category);
  const totalPool = parseFloat(dare.totalPool);
  const successPercent = totalPool > 0 ? (parseFloat(dare.successPool) / totalPool) * 100 : 50;
  const failPercent = 100 - successPercent;

  const isCreator = user?.id === dare.creator.id;
  const hasUserBet = !!dare.userBet;
  const canJoin = dare.status === 'open' && !isCreator && !hasUserBet;
  const canSubmitProof = isCreator && (dare.status === 'open' || dare.status === 'active') && !dare.proof;
  const canVote = (dare.status === 'proof_submitted' || dare.status === 'voting') && !dare.userVote;

  return (
    <View style={styles.screen}>
      <ScreenHeader title="Dare Details" showBack />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scroll}>

        {/* Status + Category */}
        <View style={styles.headerRow}>
          <Badge label={statusBadge.label} variant={statusBadge.variant} dot />
          {category && (
            <Text style={styles.category}>{category.icon} {category.label}</Text>
          )}
        </View>

        {/* Title */}
        <Text style={styles.title}>{dare.title}</Text>
        <Text style={styles.description}>{dare.description}</Text>

        {/* Creator */}
        <View style={styles.creatorRow}>
          <Avatar uri={dare.creator.avatar} username={dare.creator.username} size="sm" />
          <View style={styles.creatorInfo}>
            <Text style={styles.creatorName}>@{dare.creator.username}</Text>
            <Text style={styles.creatorMeta}>
              {formatDistanceToNow(new Date(dare.createdAt), {addSuffix: true})}
            </Text>
          </View>
          <Countdown expiresAt={dare.expiresAt} />
        </View>

        {/* Pool Stats */}
        <LinearGradient
          colors={['#1E1E32', '#12121C']}
          style={styles.poolCard}>
          <Text style={styles.poolTitle}>💰 Prize Pool</Text>
          <Text style={styles.poolAmount}>${dare.totalPool} USDC</Text>

          <View style={styles.poolBreakdown}>
            <View style={styles.poolItem}>
              <Text style={styles.poolLabel}>Creator Stake</Text>
              <Text style={[styles.poolValue, {color: COLORS.primary}]}>${dare.creatorStake}</Text>
            </View>
            <View style={styles.poolItem}>
              <Text style={styles.poolLabel}>Bet Pool</Text>
              <Text style={[styles.poolValue, {color: COLORS.pool}]}>
                ${(parseFloat(dare.totalPool) - parseFloat(dare.creatorStake)).toFixed(2)}
              </Text>
            </View>
            <View style={styles.poolItem}>
              <Text style={styles.poolLabel}>Betters</Text>
              <Text style={styles.poolValue}>{dare.betterCount}</Text>
            </View>
          </View>

          <PoolProgressBar
            successPercent={successPercent}
            failPercent={failPercent}
            successLabel={`${successPercent.toFixed(0)}% WIN ($${dare.successPool})`}
            failLabel={`${failPercent.toFixed(0)}% FAIL ($${dare.failPool})`}
          />
        </LinearGradient>

        {/* Proof Type */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>📋 Challenge Details</Text>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Proof Required</Text>
            <Text style={styles.detailValue}>{dare.proofType.toUpperCase()}</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Deadline</Text>
            <Text style={styles.detailValue}>
              {new Date(dare.expiresAt).toLocaleString()}
            </Text>
          </View>
          {dare.votingEndsAt && (
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Voting Ends</Text>
              <Text style={styles.detailValue}>
                {new Date(dare.votingEndsAt).toLocaleString()}
              </Text>
            </View>
          )}
        </View>

        {/* Submitted Proof */}
        {dare.proof && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>📎 Submitted Proof</Text>
            <View style={styles.proofBox}>
              <Text style={styles.proofIcon}>
                {dare.proof.type === 'video' ? '🎥' : dare.proof.type === 'photo' ? '📷' : '📍'}
              </Text>
              <View style={styles.proofInfo}>
                <Text style={styles.proofType}>{dare.proof.type.toUpperCase()}</Text>
                {dare.proof.description && (
                  <Text style={styles.proofDesc}>{dare.proof.description}</Text>
                )}
                <Text style={styles.proofTime}>
                  {formatDistanceToNow(new Date(dare.proof.submittedAt), {addSuffix: true})}
                </Text>
              </View>
            </View>
          </View>
        )}

        {/* Voting */}
        {(dare.status === 'proof_submitted' || dare.status === 'voting' || dare.status === 'completed' || dare.status === 'failed') && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>🗳️ Community Vote</Text>
            <View style={styles.voteStats}>
              <View style={styles.voteItem}>
                <Text style={[styles.voteCount, {color: COLORS.success}]}>{dare.votesForSuccess}</Text>
                <Text style={styles.voteLabel}>✅ Success</Text>
              </View>
              <View style={styles.voteDivider} />
              <View style={styles.voteItem}>
                <Text style={[styles.voteCount, {color: COLORS.danger}]}>{dare.votesForFail}</Text>
                <Text style={styles.voteLabel}>❌ Fail</Text>
              </View>
            </View>

            {canVote && !dare.userVote && (
              <View style={styles.voteButtons}>
                <Button
                  title="Vote SUCCESS"
                  onPress={() => handleVote('success')}
                  variant="success"
                  isLoading={isVoting}
                  style={styles.voteBtn}
                />
                <Button
                  title="Vote FAIL"
                  onPress={() => handleVote('fail')}
                  variant="danger"
                  isLoading={isVoting}
                  style={styles.voteBtn}
                />
              </View>
            )}

            {dare.userVote && (
              <View style={styles.votedBadge}>
                <Text style={styles.votedText}>
                  You voted: {dare.userVote === 'success' ? '✅ SUCCESS' : '❌ FAIL'}
                </Text>
              </View>
            )}
          </View>
        )}

        {/* Result */}
        {dare.winner && (
          <LinearGradient
            colors={dare.winner === 'success' ? COLORS.gradientSuccess : COLORS.gradientDanger}
            style={styles.resultCard}>
            <Text style={styles.resultIcon}>{dare.winner === 'success' ? '🏆' : '💀'}</Text>
            <Text style={styles.resultTitle}>
              {dare.winner === 'success' ? 'Creator Won!' : 'Creator Failed!'}
            </Text>
            <Text style={styles.resultPool}>Pool: ${dare.totalPool} USDC distributed</Text>
            {dare.rewardTxHash && (
              <TouchableOpacity onPress={() => navigation.navigate('Results', {dareId})}>
                <Text style={styles.resultTx}>View Transaction →</Text>
              </TouchableOpacity>
            )}
          </LinearGradient>
        )}

        {/* Action Buttons */}
        <View style={styles.actions}>
          {canJoin && (
            <Button
              title="🎯 Join Bet"
              onPress={() => setShowBetModal(true)}
              variant="primary"
              size="lg"
              fullWidth
            />
          )}
          {canSubmitProof && (
            <Button
              title="📎 Submit Proof"
              onPress={() => navigation.navigate('ProofUpload', {dareId})}
              variant="success"
              size="lg"
              fullWidth
            />
          )}
          {hasUserBet && !dare.winner && (
            <View style={styles.betPlacedBadge}>
              <Text style={styles.betPlacedText}>
                ✅ Bet placed: ${dare.userBet?.amount} on {dare.userBet?.prediction === 'success' ? 'SUCCESS' : 'FAIL'}
              </Text>
            </View>
          )}

          {/* Social */}
          <View style={styles.socialRow}>
            <TouchableOpacity onPress={() => likeDare(dareId)} style={styles.socialBtn}>
              <Text style={styles.socialIcon}>{dare.isLiked ? '❤️' : '🤍'}</Text>
              <Text style={styles.socialCount}>{dare.likeCount}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.socialBtn}>
              <Text style={styles.socialIcon}>💬</Text>
              <Text style={styles.socialCount}>{dare.commentCount}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.socialBtn}>
              <Text style={styles.socialIcon}>↗️</Text>
              <Text style={styles.socialCount}>Share</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>

      {/* Join Bet Modal */}
      <Modal
        visible={showBetModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowBetModal(false)}>
        <TouchableOpacity
          style={styles.overlay}
          activeOpacity={1}
          onPress={() => setShowBetModal(false)}
        />
        <View style={styles.betSheet}>
          <Text style={styles.betSheetTitle}>Place Your Bet</Text>

          {/* Prediction Select */}
          <View style={styles.predictionRow}>
            <TouchableOpacity
              style={[styles.predictionBtn, betPrediction === 'success' && styles.predictionBtnActive, betPrediction === 'success' && {borderColor: COLORS.success}]}
              onPress={() => setBetPrediction('success')}>
              <Text style={styles.predictionIcon}>✅</Text>
              <Text style={styles.predictionLabel}>Will Succeed</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.predictionBtn, betPrediction === 'fail' && styles.predictionBtnActive, betPrediction === 'fail' && {borderColor: COLORS.danger}]}
              onPress={() => setBetPrediction('fail')}>
              <Text style={styles.predictionIcon}>❌</Text>
              <Text style={styles.predictionLabel}>Will Fail</Text>
            </TouchableOpacity>
          </View>

          {/* Amount */}
          <Text style={styles.betLabel}>Bet Amount (USDC)</Text>
          <View style={styles.betInputRow}>
            <Text style={styles.betDollar}>$</Text>
            <TextInput
              style={styles.betInput}
              value={betAmount}
              onChangeText={setBetAmount}
              keyboardType="decimal-pad"
              placeholder="10.00"
              placeholderTextColor={COLORS.textMuted}
              selectionColor={COLORS.primary}
            />
            <Text style={styles.betToken}>USDC</Text>
          </View>

          {/* Quick amounts */}
          <View style={styles.quickAmounts}>
            {['5', '10', '25', '50'].map(a => (
              <TouchableOpacity
                key={a}
                style={[styles.quickBtn, betAmount === a && styles.quickBtnActive]}
                onPress={() => setBetAmount(a)}>
                <Text style={[styles.quickBtnText, betAmount === a && styles.quickBtnTextActive]}>
                  ${a}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <Button
            title={`Place $${betAmount || '0'} Bet (Gasless)`}
            onPress={handleJoinBet}
            isLoading={isJoining}
            fullWidth
            size="lg"
            style={styles.placeBetBtn}
          />
          <Text style={styles.gasFreeNote}>⛽ Gas is sponsored by DareFi Paymaster</Text>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  screen: {flex: 1, backgroundColor: COLORS.background},
  center: {alignItems: 'center', justifyContent: 'center'},
  scroll: {paddingHorizontal: SPACING.base, paddingBottom: SPACING['4xl']},
  loadingText: {color: COLORS.textMuted, marginTop: SPACING.md, fontSize: FONT_SIZES.base},

  headerRow: {flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: SPACING.sm},
  category: {fontSize: FONT_SIZES.sm, color: COLORS.textMuted, fontWeight: '500'},

  title: {fontSize: FONT_SIZES['2xl'], fontWeight: '800', color: COLORS.text, lineHeight: 32, marginBottom: SPACING.sm},
  description: {fontSize: FONT_SIZES.base, color: COLORS.textSecondary, lineHeight: 24, marginBottom: SPACING.lg},

  creatorRow: {flexDirection: 'row', alignItems: 'center', gap: SPACING.sm, marginBottom: SPACING.lg},
  creatorInfo: {flex: 1},
  creatorName: {fontSize: FONT_SIZES.sm, fontWeight: '700', color: COLORS.text},
  creatorMeta: {fontSize: FONT_SIZES.xs, color: COLORS.textMuted, marginTop: 2},

  poolCard: {
    borderRadius: RADIUS.lg,
    padding: SPACING.lg,
    marginBottom: SPACING.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
    gap: SPACING.md,
  },
  poolTitle: {fontSize: FONT_SIZES.sm, fontWeight: '700', color: COLORS.textMuted, textTransform: 'uppercase', letterSpacing: 1},
  poolAmount: {fontSize: FONT_SIZES['4xl'], fontWeight: '900', color: COLORS.text},
  poolBreakdown: {flexDirection: 'row', justifyContent: 'space-between'},
  poolItem: {alignItems: 'center'},
  poolLabel: {fontSize: FONT_SIZES.xs, color: COLORS.textMuted, textTransform: 'uppercase', letterSpacing: 0.5},
  poolValue: {fontSize: FONT_SIZES.base, fontWeight: '700', color: COLORS.text, marginTop: 4},

  section: {marginBottom: SPACING.lg},
  sectionTitle: {fontSize: FONT_SIZES.base, fontWeight: '700', color: COLORS.text, marginBottom: SPACING.md},

  detailRow: {flexDirection: 'row', justifyContent: 'space-between', paddingVertical: SPACING.sm, borderBottomWidth: 1, borderBottomColor: COLORS.border},
  detailLabel: {fontSize: FONT_SIZES.sm, color: COLORS.textMuted},
  detailValue: {fontSize: FONT_SIZES.sm, fontWeight: '600', color: COLORS.text},

  proofBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: COLORS.card,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: SPACING.base,
    gap: SPACING.md,
  },
  proofIcon: {fontSize: 32},
  proofInfo: {flex: 1},
  proofType: {fontSize: FONT_SIZES.xs, fontWeight: '700', color: COLORS.primary, letterSpacing: 1},
  proofDesc: {fontSize: FONT_SIZES.sm, color: COLORS.textSecondary, marginTop: 4},
  proofTime: {fontSize: FONT_SIZES.xs, color: COLORS.textMuted, marginTop: 4},

  voteStats: {
    flexDirection: 'row',
    backgroundColor: COLORS.card,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: SPACING.md,
    overflow: 'hidden',
  },
  voteItem: {flex: 1, alignItems: 'center', padding: SPACING.base},
  voteCount: {fontSize: FONT_SIZES['3xl'], fontWeight: '900'},
  voteLabel: {fontSize: FONT_SIZES.sm, color: COLORS.textMuted, marginTop: 4},
  voteDivider: {width: 1, backgroundColor: COLORS.border},
  voteButtons: {flexDirection: 'row', gap: SPACING.sm},
  voteBtn: {flex: 1},
  votedBadge: {
    backgroundColor: COLORS.successGlow,
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    alignItems: 'center',
  },
  votedText: {fontSize: FONT_SIZES.sm, fontWeight: '700', color: COLORS.success},

  resultCard: {
    borderRadius: RADIUS.lg,
    padding: SPACING.xl,
    alignItems: 'center',
    marginBottom: SPACING.lg,
    gap: SPACING.sm,
  },
  resultIcon: {fontSize: 48},
  resultTitle: {fontSize: FONT_SIZES['2xl'], fontWeight: '900', color: COLORS.white},
  resultPool: {fontSize: FONT_SIZES.base, color: 'rgba(255,255,255,0.8)'},
  resultTx: {fontSize: FONT_SIZES.sm, color: COLORS.white, textDecorationLine: 'underline', marginTop: SPACING.xs},

  actions: {gap: SPACING.md, marginBottom: SPACING['2xl']},
  betPlacedBadge: {
    backgroundColor: COLORS.successGlow,
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.success,
  },
  betPlacedText: {fontSize: FONT_SIZES.sm, fontWeight: '700', color: COLORS.success},

  socialRow: {flexDirection: 'row', justifyContent: 'space-around'},
  socialBtn: {flexDirection: 'row', alignItems: 'center', gap: SPACING.xs, padding: SPACING.sm},
  socialIcon: {fontSize: 20},
  socialCount: {fontSize: FONT_SIZES.sm, color: COLORS.textMuted, fontWeight: '600'},

  overlay: {flex: 1, backgroundColor: COLORS.overlay},
  betSheet: {
    backgroundColor: COLORS.surface,
    borderTopLeftRadius: RADIUS.xl,
    borderTopRightRadius: RADIUS.xl,
    padding: SPACING.xl,
    borderTopWidth: 1,
    borderColor: COLORS.border,
    gap: SPACING.md,
  },
  betSheetTitle: {fontSize: FONT_SIZES.xl, fontWeight: '800', color: COLORS.text},
  predictionRow: {flexDirection: 'row', gap: SPACING.md},
  predictionBtn: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: SPACING.md,
    borderRadius: RADIUS.md,
    borderWidth: 2,
    borderColor: COLORS.border,
    backgroundColor: COLORS.card,
    gap: SPACING.xs,
  },
  predictionBtnActive: {backgroundColor: 'rgba(255,255,255,0.05)'},
  predictionIcon: {fontSize: 24},
  predictionLabel: {fontSize: FONT_SIZES.sm, color: COLORS.text, fontWeight: '600'},
  betLabel: {fontSize: FONT_SIZES.sm, fontWeight: '600', color: COLORS.textMuted, textTransform: 'uppercase', letterSpacing: 0.8},
  betInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.card,
    borderRadius: RADIUS.md,
    borderWidth: 1.5,
    borderColor: COLORS.primary,
    paddingHorizontal: SPACING.md,
    height: 56,
  },
  betDollar: {fontSize: FONT_SIZES.xl, color: COLORS.textMuted, marginRight: SPACING.xs},
  betInput: {flex: 1, fontSize: FONT_SIZES.xl, color: COLORS.text, fontWeight: '700'},
  betToken: {fontSize: FONT_SIZES.sm, color: COLORS.textMuted, fontWeight: '600'},
  quickAmounts: {flexDirection: 'row', gap: SPACING.sm},
  quickBtn: {
    flex: 1,
    paddingVertical: SPACING.sm,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: 'center',
  },
  quickBtnActive: {borderColor: COLORS.primary, backgroundColor: COLORS.primaryGlow},
  quickBtnText: {fontSize: FONT_SIZES.sm, color: COLORS.textSecondary, fontWeight: '700'},
  quickBtnTextActive: {color: COLORS.primaryLight},
  placeBetBtn: {marginTop: SPACING.sm},
  gasFreeNote: {textAlign: 'center', fontSize: FONT_SIZES.xs, color: COLORS.textMuted},
});

export default DareDetailsScreen;
