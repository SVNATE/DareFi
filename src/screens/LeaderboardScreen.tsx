/**
 * Leaderboard Screen
 */
import React, {useEffect, useState} from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';

import {MOCK_LEADERBOARD} from '../services/mockData';
import {LeaderboardEntry, LeaderboardTab} from '../types';
import {COLORS} from '../constants/colors';
import {FONT_SIZES, SPACING, RADIUS} from '../constants/theme';
import Avatar from '../components/common/Avatar';
import ScreenHeader from '../components/common/ScreenHeader';

const TABS: {id: LeaderboardTab; label: string; icon: string}[] = [
  {id: 'completions', label: 'Completions', icon: '✅'},
  {id: 'winnings', label: 'Winnings', icon: '💰'},
  {id: 'successRate', label: 'Win Rate', icon: '📈'},
];

const RANK_COLORS = ['#FFD700', '#C0C0C0', '#CD7F32'];

const LeaderboardScreen = (): React.JSX.Element => {
  const [activeTab, setActiveTab] = useState<LeaderboardTab>('completions');
  const [loading, setLoading] = useState(false);
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);

  useEffect(() => {
    setLoading(true);
    setTimeout(() => {
      setEntries(MOCK_LEADERBOARD);
      setLoading(false);
    }, 500);
  }, [activeTab]);

  const getMetric = (entry: LeaderboardEntry): string => {
    switch (activeTab) {
      case 'completions': return `${entry.user.daresCompleted} completed`;
      case 'winnings': return `$${entry.user.totalWinnings} USDC`;
      case 'successRate': return `${entry.user.successRate}% rate`;
    }
  };

  const renderTopThree = (): React.JSX.Element => {
    const top3 = entries.slice(0, 3);
    // Rearrange: 2nd, 1st, 3rd
    const order = [top3[1], top3[0], top3[2]].filter(Boolean);
    const heights = [100, 130, 80];
    const orderMap = [2, 1, 3];

    return (
      <View style={styles.podium}>
        {order.map((entry, i) => (
          <View key={entry?.user.id} style={styles.podiumItem}>
            <Avatar
              uri={entry?.user.avatar}
              username={entry?.user.username}
              size="lg"
              showBorder={i === 1}
            />
            <Text style={styles.podiumUsername}>@{entry?.user.username}</Text>
            <Text style={[styles.podiumRank, {color: RANK_COLORS[orderMap[i] - 1]}]}>
              {orderMap[i] === 1 ? '🥇' : orderMap[i] === 2 ? '🥈' : '🥉'}
            </Text>
            <Text style={styles.podiumMetric}>{entry ? getMetric(entry) : ''}</Text>
            <View
              style={[
                styles.podiumBase,
                {height: heights[i], backgroundColor: RANK_COLORS[orderMap[i] - 1] + '33'},
              ]}
            />
          </View>
        ))}
      </View>
    );
  };

  const renderItem = ({item}: {item: LeaderboardEntry}): React.JSX.Element => {
    if (item.rank <= 3) {return <View />;}
    return (
      <View style={styles.listItem}>
        <Text style={styles.listRank}>#{item.rank}</Text>
        <Avatar uri={item.user.avatar} username={item.user.username} size="sm" />
        <View style={styles.listInfo}>
          <Text style={styles.listName}>@{item.user.username}</Text>
          <Text style={styles.listMeta}>{item.user.reputation} XP</Text>
        </View>
        <View style={styles.listMetric}>
          <Text style={styles.listMetricValue}>{getMetric(item)}</Text>
          <Text style={styles.listSuccessRate}>{item.user.successRate}% success</Text>
        </View>
      </View>
    );
  };

  return (
    <View style={styles.screen}>
      <ScreenHeader title="Leaderboard" subtitle="Top daredevils on Starknet" />

      {/* Tabs */}
      <View style={styles.tabs}>
        {TABS.map(tab => (
          <TouchableOpacity
            key={tab.id}
            style={[styles.tab, activeTab === tab.id && styles.tabActive]}
            onPress={() => setActiveTab(tab.id)}>
            <Text style={styles.tabIcon}>{tab.icon}</Text>
            <Text style={[styles.tabLabel, activeTab === tab.id && styles.tabLabelActive]}>
              {tab.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {loading ? (
        <View style={styles.loading}>
          <ActivityIndicator size="large" color={COLORS.primary} />
        </View>
      ) : (
        <FlatList
          data={entries}
          keyExtractor={item => item.user.id}
          ListHeaderComponent={renderTopThree}
          renderItem={renderItem}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  screen: {flex: 1, backgroundColor: COLORS.background},
  tabs: {
    flexDirection: 'row',
    paddingHorizontal: SPACING.base,
    gap: SPACING.sm,
    marginBottom: SPACING.md,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: SPACING.sm,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: COLORS.border,
    gap: 2,
  },
  tabActive: {
    backgroundColor: COLORS.primaryGlow,
    borderColor: COLORS.primary,
  },
  tabIcon: {fontSize: 16},
  tabLabel: {
    fontSize: FONT_SIZES.xs,
    fontWeight: '600',
    color: COLORS.textMuted,
    textAlign: 'center',
  },
  tabLabelActive: {color: COLORS.primaryLight},
  loading: {flex: 1, alignItems: 'center', justifyContent: 'center'},
  listContent: {
    paddingHorizontal: SPACING.base,
    paddingBottom: SPACING['4xl'],
  },
  podium: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'flex-end',
    height: 220,
    marginBottom: SPACING.xl,
    gap: SPACING.sm,
  },
  podiumItem: {
    width: 100,
    alignItems: 'center',
    gap: 4,
  },
  podiumUsername: {
    fontSize: FONT_SIZES.xs,
    fontWeight: '700',
    color: COLORS.text,
    textAlign: 'center',
  },
  podiumRank: {fontSize: 24},
  podiumMetric: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.textMuted,
    textAlign: 'center',
  },
  podiumBase: {
    width: '100%',
    borderTopLeftRadius: 8,
    borderTopRightRadius: 8,
  },
  listItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
    paddingVertical: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  listRank: {
    width: 28,
    fontSize: FONT_SIZES.base,
    fontWeight: '800',
    color: COLORS.textMuted,
    textAlign: 'center',
  },
  listInfo: {flex: 1},
  listName: {fontSize: FONT_SIZES.sm, fontWeight: '700', color: COLORS.text},
  listMeta: {fontSize: FONT_SIZES.xs, color: COLORS.textMuted, marginTop: 2},
  listMetric: {alignItems: 'flex-end'},
  listMetricValue: {fontSize: FONT_SIZES.sm, fontWeight: '700', color: COLORS.primary},
  listSuccessRate: {fontSize: FONT_SIZES.xs, color: COLORS.textMuted, marginTop: 2},
});

export default LeaderboardScreen;
