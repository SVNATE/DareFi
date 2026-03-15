/**
 * DareCard – compact dare preview for feed/explore lists
 */
import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ViewStyle,
} from 'react-native';
import {Dare} from '../../types';
import {COLORS} from '../../constants/colors';
import {FONT_SIZES, RADIUS, SPACING} from '../../constants/theme';
import Avatar from '../common/Avatar';
import Badge, {getDareStatusBadge} from '../common/Badge';
import PoolProgressBar from '../common/PoolProgressBar';
import Countdown from '../common/Countdown';
import {DARE_CATEGORIES} from '../../constants/config';

interface DareCardProps {
  dare: Dare;
  onPress: (dare: Dare) => void;
  onLike?: (dareId: string) => void;
  style?: ViewStyle;
}

const DareCard = ({dare, onPress, onLike, style}: DareCardProps): React.JSX.Element => {
  const badge = getDareStatusBadge(dare.status);
  const totalPool = parseFloat(dare.totalPool);
  const successPool = parseFloat(dare.successPool);
  const failPool = parseFloat(dare.failPool);
  const successPercent = totalPool > 0 ? (successPool / totalPool) * 100 : 50;
  const failPercent = 100 - successPercent;

  const category = DARE_CATEGORIES.find(c => c.id === dare.category);

  return (
    <TouchableOpacity
      style={[styles.card, style]}
      onPress={() => onPress(dare)}
      activeOpacity={0.85}>
      {/* Header */}
      <View style={styles.header}>
        <Avatar
          uri={dare.creator.avatar}
          username={dare.creator.username}
          size="sm"
        />
        <View style={styles.headerInfo}>
          <Text style={styles.username}>@{dare.creator.username}</Text>
          <Text style={styles.category}>
            {category?.icon} {category?.label}
          </Text>
        </View>
        <Badge label={badge.label} variant={badge.variant} />
      </View>

      {/* Title */}
      <Text style={styles.title} numberOfLines={2}>
        {dare.title}
      </Text>

      {/* Pool Info */}
      <View style={styles.poolRow}>
        <View style={styles.poolItem}>
          <Text style={styles.poolLabel}>Pool</Text>
          <Text style={styles.poolValue}>${dare.totalPool} USDC</Text>
        </View>
        <View style={styles.poolItem}>
          <Text style={styles.poolLabel}>Staked</Text>
          <Text style={styles.poolValue}>${dare.creatorStake}</Text>
        </View>
        <View style={styles.poolItem}>
          <Text style={styles.poolLabel}>Betters</Text>
          <Text style={styles.poolValue}>{dare.betterCount}</Text>
        </View>
      </View>

      {/* Progress */}
      <PoolProgressBar
        successPercent={successPercent}
        failPercent={failPercent}
        showLabels={false}
        height={6}
      />

      {/* Footer */}
      <View style={styles.footer}>
        <Countdown expiresAt={dare.expiresAt} />
        <View style={styles.footerActions}>
          <TouchableOpacity
            onPress={() => onLike?.(dare.id)}
            style={styles.action}
            hitSlop={{top: 8, bottom: 8, left: 8, right: 8}}>
            <Text style={[styles.actionIcon, dare.isLiked && styles.liked]}>
              {dare.isLiked ? '❤️' : '🤍'}
            </Text>
            <Text style={styles.actionCount}>{dare.likeCount}</Text>
          </TouchableOpacity>
          <View style={styles.action}>
            <Text style={styles.actionIcon}>💬</Text>
            <Text style={styles.actionCount}>{dare.commentCount}</Text>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.card,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: SPACING.base,
    marginBottom: SPACING.md,
    gap: SPACING.sm,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  headerInfo: {
    flex: 1,
  },
  username: {
    fontSize: FONT_SIZES.sm,
    fontWeight: '700',
    color: COLORS.text,
  },
  category: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.textMuted,
    marginTop: 1,
  },
  title: {
    fontSize: FONT_SIZES.base,
    fontWeight: '700',
    color: COLORS.text,
    lineHeight: 22,
  },
  poolRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  poolItem: {
    alignItems: 'center',
  },
  poolLabel: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.textMuted,
    fontWeight: '500',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  poolValue: {
    fontSize: FONT_SIZES.sm,
    fontWeight: '700',
    color: COLORS.text,
    marginTop: 2,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: SPACING.xs,
  },
  footerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
  },
  action: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  actionIcon: {
    fontSize: 14,
  },
  liked: {
    transform: [{scale: 1.15}],
  },
  actionCount: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.textMuted,
    fontWeight: '600',
  },
});

export default DareCard;
