/**
 * Notifications Screen
 */
import React, {useState} from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import {useNavigation} from '@react-navigation/native';
import {NativeStackNavigationProp} from '@react-navigation/native-stack';

import {HomeStackParamList} from '../types';
import {COLORS} from '../constants/colors';
import {FONT_SIZES, SPACING, RADIUS} from '../constants/theme';
import ScreenHeader from '../components/common/ScreenHeader';

type Nav = NativeStackNavigationProp<HomeStackParamList>;

interface Notification {
  id: string;
  type: 'dare_joined' | 'proof_submitted' | 'voting_started' | 'result_declared' | 'bet_won' | 'followed';
  title: string;
  body: string;
  dareId?: string;
  timestamp: string;
  read: boolean;
}

const MOCK_NOTIFICATIONS: Notification[] = [
  {
    id: 'n1',
    type: 'result_declared',
    title: 'You won! 🎉',
    body: 'Your dare "Run 5km under 25 mins" was completed. You earned $47.50 USDC.',
    dareId: 'd1',
    timestamp: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
    read: false,
  },
  {
    id: 'n2',
    type: 'voting_started',
    title: 'Voting has started',
    body: '"100 pushups nonstop" is now in voting phase. Your vote counts!',
    dareId: 'd2',
    timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    read: false,
  },
  {
    id: 'n3',
    type: 'dare_joined',
    title: 'New bet placed',
    body: '@StarkDare joined your dare for $25 USDC, predicting you WILL succeed.',
    dareId: 'd1',
    timestamp: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
    read: true,
  },
  {
    id: 'n4',
    type: 'proof_submitted',
    title: 'Proof submitted',
    body: '@FitnessDegen submitted proof for "30-day vegan challenge". Vote now!',
    dareId: 'd3',
    timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
    read: true,
  },
  {
    id: 'n5',
    type: 'followed',
    title: 'New follower',
    body: '@CryptoAthlete started following you.',
    timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    read: true,
  },
  {
    id: 'n6',
    type: 'bet_won',
    title: 'Bet payout received',
    body: 'You bet correctly on "100 pushups nonstop". Received $18.75 USDC.',
    dareId: 'd2',
    timestamp: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
    read: true,
  },
];

const TYPE_META: Record<Notification['type'], {icon: string; accent: string}> = {
  dare_joined: {icon: '🔥', accent: COLORS.primary},
  proof_submitted: {icon: '📹', accent: COLORS.warning},
  voting_started: {icon: '🗳️', accent: COLORS.primaryLight},
  result_declared: {icon: '🏆', accent: COLORS.success},
  bet_won: {icon: '💰', accent: COLORS.success},
  followed: {icon: '👤', accent: COLORS.primary},
};

const timeAgo = (iso: string): string => {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  const hours = Math.floor(mins / 60);
  const days = Math.floor(hours / 24);
  if (days > 0) {return `${days}d ago`;}
  if (hours > 0) {return `${hours}h ago`;}
  return `${mins}m ago`;
};

const NotificationsScreen = (): React.JSX.Element => {
  const navigation = useNavigation<Nav>();
  const [notifications, setNotifications] = useState<Notification[]>(MOCK_NOTIFICATIONS);

  const unreadCount = notifications.filter(n => !n.read).length;

  const markAllRead = (): void => {
    setNotifications(prev => prev.map(n => ({...n, read: true})));
  };

  const handlePress = (notification: Notification): void => {
    setNotifications(prev =>
      prev.map(n => n.id === notification.id ? {...n, read: true} : n),
    );
    if (notification.dareId) {
      navigation.navigate('DareDetails', {dareId: notification.dareId});
    }
  };

  const renderItem = ({item}: {item: Notification}): React.JSX.Element => {
    const meta = TYPE_META[item.type];
    return (
      <TouchableOpacity
        style={[styles.item, !item.read && styles.itemUnread]}
        onPress={() => handlePress(item)}
        activeOpacity={0.8}>
        <View style={[styles.iconBadge, {backgroundColor: meta.accent + '22', borderColor: meta.accent + '44'}]}>
          <Text style={styles.icon}>{meta.icon}</Text>
        </View>
        <View style={styles.content}>
          <View style={styles.titleRow}>
            <Text style={[styles.title, !item.read && styles.titleUnread]}>{item.title}</Text>
            {!item.read && <View style={[styles.dot, {backgroundColor: meta.accent}]} />}
          </View>
          <Text style={styles.body} numberOfLines={2}>{item.body}</Text>
          <Text style={styles.time}>{timeAgo(item.timestamp)}</Text>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.screen}>
      <ScreenHeader
        title="Notifications"
        subtitle={unreadCount > 0 ? `${unreadCount} unread` : 'All caught up'}
        rightElement={
          unreadCount > 0 ? (
            <TouchableOpacity onPress={markAllRead}>
              <Text style={styles.markAllRead}>Mark all read</Text>
            </TouchableOpacity>
          ) : undefined
        }
      />

      {notifications.length === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.emptyIcon}>🔔</Text>
          <Text style={styles.emptyTitle}>No notifications yet</Text>
          <Text style={styles.emptyText}>When someone bets on your dare, you'll see it here</Text>
        </View>
      ) : (
        <FlatList
          data={notifications}
          keyExtractor={item => item.id}
          renderItem={renderItem}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          ItemSeparatorComponent={() => <View style={styles.separator} />}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  screen: {flex: 1, backgroundColor: COLORS.background},
  markAllRead: {fontSize: FONT_SIZES.sm, color: COLORS.primary, fontWeight: '600'},
  listContent: {
    paddingVertical: SPACING.sm,
    paddingBottom: SPACING['4xl'],
  },
  item: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingHorizontal: SPACING.base,
    paddingVertical: SPACING.md,
    gap: SPACING.md,
  },
  itemUnread: {backgroundColor: COLORS.surface},
  iconBadge: {
    width: 48,
    height: 48,
    borderRadius: RADIUS.md,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    flexShrink: 0,
  },
  icon: {fontSize: 22},
  content: {flex: 1, gap: 4},
  titleRow: {flexDirection: 'row', alignItems: 'center', gap: 8},
  title: {
    fontSize: FONT_SIZES.sm,
    fontWeight: '600',
    color: COLORS.textSecondary,
    flex: 1,
  },
  titleUnread: {color: COLORS.text, fontWeight: '700'},
  dot: {width: 8, height: 8, borderRadius: 4, flexShrink: 0},
  body: {fontSize: FONT_SIZES.sm, color: COLORS.textMuted, lineHeight: 20},
  time: {fontSize: FONT_SIZES.xs, color: COLORS.textMuted, marginTop: 2},
  separator: {height: 1, backgroundColor: COLORS.border},
  empty: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    paddingBottom: 100,
  },
  emptyIcon: {fontSize: 48},
  emptyTitle: {fontSize: FONT_SIZES.lg, fontWeight: '700', color: COLORS.text},
  emptyText: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textMuted,
    textAlign: 'center',
    paddingHorizontal: SPACING.xl,
  },
});

export default NotificationsScreen;
