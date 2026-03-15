/**
 * Voting Screen – community votes on proof
 */
import React, {useState} from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  TouchableOpacity,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import {NativeStackScreenProps} from '@react-navigation/native-stack';
import Toast from 'react-native-toast-message';

import {useAuthStore, useDaresStore} from '../store';
import {HomeStackParamList} from '../types';
import {COLORS} from '../constants/colors';
import {FONT_SIZES, SPACING, RADIUS} from '../constants/theme';
import Button from '../components/common/Button';
import ScreenHeader from '../components/common/ScreenHeader';
import Avatar from '../components/common/Avatar';
import Countdown from '../components/common/Countdown';

type Props = NativeStackScreenProps<HomeStackParamList, 'Voting'>;

const VotingScreen = ({route, navigation}: Props): React.JSX.Element => {
  const {dareId} = route.params;
  const {user} = useAuthStore();
  const {selectedDare, vote, isVoting} = useDaresStore();

  const dare = selectedDare;
  if (!dare) {
    return (
      <View style={[styles.screen, styles.center]}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  const totalVotes = dare.votesForSuccess + dare.votesForFail;
  const successPct = totalVotes > 0 ? (dare.votesForSuccess / totalVotes) * 100 : 0;
  const failPct = 100 - successPct;

  const handleVote = async (voteOption: 'success' | 'fail'): Promise<void> => {
    if (!user) {return;}
    if (dare.userVote) {
      Toast.show({type: 'info', text1: 'Already voted!'});
      return;
    }
    const success = await vote(user.walletAddress, dareId, voteOption);
    if (success) {
      Toast.show({
        type: 'success',
        text1: '✅ Vote Submitted!',
        text2: `You voted: ${voteOption === 'success' ? 'SUCCESS' : 'FAIL'}`,
      });
    }
  };

  return (
    <View style={styles.screen}>
      <ScreenHeader
        title="Community Vote"
        subtitle="Did the creator complete this dare?"
        showBack
      />

      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}>

        {/* Dare Summary */}
        <View style={styles.dareSummary}>
          <Text style={styles.dareTitle}>{dare.title}</Text>
          <View style={styles.creatorRow}>
            <Avatar uri={dare.creator.avatar} username={dare.creator.username} size="xs" />
            <Text style={styles.creatorName}>@{dare.creator.username}</Text>
            {dare.votingEndsAt && (
              <Countdown expiresAt={dare.votingEndsAt} />
            )}
          </View>
        </View>

        {/* Proof Display */}
        {dare.proof && (
          <View style={styles.proofCard}>
            <Text style={styles.sectionTitle}>📎 Submitted Proof</Text>
            <View style={styles.proofContent}>
              <Text style={styles.proofIcon}>
                {dare.proof.type === 'video' ? '🎥' : dare.proof.type === 'photo' ? '📷' : '📍'}
              </Text>
              <View style={{flex: 1}}>
                <Text style={styles.proofTypeLabel}>{dare.proof.type.toUpperCase()}</Text>
                {dare.proof.description && (
                  <Text style={styles.proofDesc}>{dare.proof.description}</Text>
                )}
              </View>
            </View>
          </View>
        )}

        {/* Vote Tally */}
        <View style={styles.tallyCard}>
          <Text style={styles.sectionTitle}>📊 Current Votes ({totalVotes} total)</Text>

          <View style={styles.tallyRow}>
            <View style={styles.tallyItem}>
              <Text style={[styles.tallyCount, {color: COLORS.success}]}>{dare.votesForSuccess}</Text>
              <Text style={styles.tallyLabel}>Success</Text>
            </View>
            <View style={styles.tallyBarContainer}>
              <View style={styles.tallyTrack}>
                <View style={[styles.successBar, {width: `${successPct}%`}]} />
              </View>
              <View style={[styles.tallyTrack, {marginTop: 4}]}>
                <View style={[styles.failBar, {width: `${failPct}%`}]} />
              </View>
            </View>
            <View style={[styles.tallyItem, {alignItems: 'flex-end'}]}>
              <Text style={[styles.tallyCount, {color: COLORS.danger}]}>{dare.votesForFail}</Text>
              <Text style={styles.tallyLabel}>Fail</Text>
            </View>
          </View>
        </View>

        {/* Voter List */}
        {dare.votes.length > 0 && (
          <View style={styles.voterList}>
            <Text style={styles.sectionTitle}>🗳️ Recent Votes</Text>
            {dare.votes.slice(0, 5).map((v, i) => (
              <View key={`${v.userId}-${i}`} style={styles.voterRow}>
                <Avatar username={v.username} size="xs" />
                <Text style={styles.voterName}>@{v.username}</Text>
                <Text style={[styles.voterVote, {color: v.vote === 'success' ? COLORS.success : COLORS.danger}]}>
                  {v.vote === 'success' ? '✅ Success' : '❌ Fail'}
                </Text>
              </View>
            ))}
          </View>
        )}

        {/* Vote Buttons */}
        {!dare.userVote ? (
          <View style={styles.voteSection}>
            <Text style={styles.voteQuestion}>Did @{dare.creator.username} complete this challenge?</Text>
            <View style={styles.voteButtons}>
              <TouchableOpacity
                style={[styles.voteBtn, styles.voteBtnSuccess]}
                onPress={() => handleVote('success')}
                disabled={isVoting}>
                <Text style={styles.voteBtnIcon}>✅</Text>
                <Text style={styles.voteBtnLabel}>YES, SUCCEEDED</Text>
                <Text style={styles.voteBtnSub}>Award creator the pool</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.voteBtn, styles.voteBtnFail]}
                onPress={() => handleVote('fail')}
                disabled={isVoting}>
                <Text style={styles.voteBtnIcon}>❌</Text>
                <Text style={styles.voteBtnLabel}>NO, FAILED</Text>
                <Text style={styles.voteBtnSub}>Award betters who said fail</Text>
              </TouchableOpacity>
            </View>

            {isVoting && (
              <View style={styles.votingSpinner}>
                <ActivityIndicator color={COLORS.primary} />
                <Text style={styles.votingText}>Submitting vote on-chain...</Text>
              </View>
            )}

            <Text style={styles.gasFreeNote}>⛽ Voting gas is free via Starkzap</Text>
          </View>
        ) : (
          <View style={styles.votedState}>
            <Text style={styles.votedIcon}>{dare.userVote === 'success' ? '✅' : '❌'}</Text>
            <Text style={styles.votedTitle}>Vote Cast!</Text>
            <Text style={styles.votedSubtitle}>
              You voted: <Text style={{fontWeight: '800', color: dare.userVote === 'success' ? COLORS.success : COLORS.danger}}>
                {dare.userVote === 'success' ? 'SUCCESS' : 'FAIL'}
              </Text>
            </Text>
            <Text style={styles.votedNote}>
              Voting ends when the deadline passes. Majority wins.
            </Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  screen: {flex: 1, backgroundColor: COLORS.background},
  center: {alignItems: 'center', justifyContent: 'center'},
  scroll: {paddingHorizontal: SPACING.base, paddingBottom: SPACING['4xl']},

  dareSummary: {
    backgroundColor: COLORS.card,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: SPACING.base,
    marginBottom: SPACING.md,
    marginTop: SPACING.md,
  },
  dareTitle: {
    fontSize: FONT_SIZES.lg,
    fontWeight: '800',
    color: COLORS.text,
    marginBottom: SPACING.sm,
  },
  creatorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  creatorName: {fontSize: FONT_SIZES.sm, color: COLORS.textSecondary, flex: 1},

  proofCard: {
    backgroundColor: COLORS.card,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: SPACING.base,
    marginBottom: SPACING.md,
  },
  proofContent: {flexDirection: 'row', alignItems: 'flex-start', gap: SPACING.md, marginTop: SPACING.sm},
  proofIcon: {fontSize: 32},
  proofTypeLabel: {fontSize: FONT_SIZES.xs, fontWeight: '700', color: COLORS.primary, letterSpacing: 1},
  proofDesc: {fontSize: FONT_SIZES.sm, color: COLORS.textSecondary, marginTop: 4},

  sectionTitle: {
    fontSize: FONT_SIZES.base,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: SPACING.md,
  },

  tallyCard: {
    backgroundColor: COLORS.card,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: SPACING.base,
    marginBottom: SPACING.md,
  },
  tallyRow: {flexDirection: 'row', alignItems: 'center', gap: SPACING.md},
  tallyItem: {width: 56},
  tallyCount: {fontSize: FONT_SIZES['2xl'], fontWeight: '900'},
  tallyLabel: {fontSize: FONT_SIZES.xs, color: COLORS.textMuted},
  tallyBarContainer: {flex: 1},
  tallyTrack: {height: 8, backgroundColor: COLORS.border, borderRadius: 4, overflow: 'hidden'},
  successBar: {height: 8, backgroundColor: COLORS.success, borderRadius: 4},
  failBar: {height: 8, backgroundColor: COLORS.danger, borderRadius: 4},

  voterList: {
    backgroundColor: COLORS.card,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: SPACING.base,
    marginBottom: SPACING.lg,
    gap: SPACING.sm,
  },
  voterRow: {flexDirection: 'row', alignItems: 'center', gap: SPACING.sm},
  voterName: {flex: 1, fontSize: FONT_SIZES.sm, color: COLORS.text},
  voterVote: {fontSize: FONT_SIZES.sm, fontWeight: '700'},

  voteSection: {gap: SPACING.md},
  voteQuestion: {
    fontSize: FONT_SIZES.base,
    fontWeight: '700',
    color: COLORS.text,
    textAlign: 'center',
  },
  voteButtons: {gap: SPACING.md},
  voteBtn: {
    borderRadius: RADIUS.lg,
    borderWidth: 2,
    padding: SPACING.xl,
    alignItems: 'center',
    gap: SPACING.xs,
  },
  voteBtnSuccess: {
    borderColor: COLORS.success,
    backgroundColor: COLORS.successGlow,
  },
  voteBtnFail: {
    borderColor: COLORS.danger,
    backgroundColor: COLORS.dangerGlow,
  },
  voteBtnIcon: {fontSize: 40},
  voteBtnLabel: {fontSize: FONT_SIZES.lg, fontWeight: '800', color: COLORS.text},
  voteBtnSub: {fontSize: FONT_SIZES.sm, color: COLORS.textMuted},
  votingSpinner: {flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: SPACING.sm},
  votingText: {fontSize: FONT_SIZES.sm, color: COLORS.textMuted},
  gasFreeNote: {textAlign: 'center', fontSize: FONT_SIZES.xs, color: COLORS.textMuted},

  votedState: {
    backgroundColor: COLORS.card,
    borderRadius: RADIUS.xl,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: SPACING['3xl'],
    alignItems: 'center',
    gap: SPACING.sm,
  },
  votedIcon: {fontSize: 64},
  votedTitle: {fontSize: FONT_SIZES['2xl'], fontWeight: '900', color: COLORS.text},
  votedSubtitle: {fontSize: FONT_SIZES.base, color: COLORS.textSecondary},
  votedNote: {fontSize: FONT_SIZES.sm, color: COLORS.textMuted, textAlign: 'center', marginTop: SPACING.sm},
});

export default VotingScreen;
