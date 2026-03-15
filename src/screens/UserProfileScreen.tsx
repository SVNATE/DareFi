/**
 * UserProfile Screen — another user's public profile
 */
import React, {useEffect, useState, useCallback} from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import {useRoute, RouteProp, useNavigation} from '@react-navigation/native';
import {NativeStackNavigationProp} from '@react-navigation/native-stack';
import Toast from 'react-native-toast-message';

import {User, Dare, HomeStackParamList} from '../types';
import {MOCK_USERS, MOCK_DARES} from '../services/mockData';
import {followUser, unfollowUser} from '../services/api';
import {useAuthStore} from '../store/authStore';
import {COLORS} from '../constants/colors';
import {FONT_SIZES, SPACING, RADIUS} from '../constants/theme';
import Avatar from '../components/common/Avatar';
import Badge from '../components/common/Badge';
import DareCard from '../components/dare/DareCard';
import ScreenHeader from '../components/common/ScreenHeader';
import {shortenAddress} from '../services/starknet';

type RouteProps = RouteProp<HomeStackParamList, 'UserProfile'>;
type Nav = NativeStackNavigationProp<HomeStackParamList>;

const UserProfileScreen = (): React.JSX.Element => {
  const route = useRoute<RouteProps>();
  const navigation = useNavigation<Nav>();
  const {userId} = route.params;
  const {user: currentUser} = useAuthStore();

  const [profileUser, setProfileUser] = useState<User | null>(null);
  const [userDares, setUserDares] = useState<Dare[]>([]);
  const [isFollowing, setIsFollowing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [followLoading, setFollowLoading] = useState(false);

  useEffect(() => {
    setLoading(true);
    setTimeout(() => {
      const found = MOCK_USERS.find(u => u.id === userId) ?? MOCK_USERS[0];
      setProfileUser(found);
      setUserDares(MOCK_DARES.filter(d => d.creator.id === userId));
      setIsFollowing(currentUser?.isFollowing ?? false);
      setLoading(false);
    }, 400);
  }, [userId, currentUser]);

  const handleFollow = useCallback(async () => {
    if (!profileUser) {return;}
    setFollowLoading(true);
    try {
      if (isFollowing) {
        await unfollowUser(profileUser.id);
        setIsFollowing(false);
        Toast.show({type: 'info', text1: `Unfollowed @${profileUser.username}`});
      } else {
        await followUser(profileUser.id);
        setIsFollowing(true);
        Toast.show({type: 'success', text1: `Following @${profileUser.username}`});
      }
    } catch {
      Toast.show({type: 'error', text1: 'Action failed. Try again.'});
    } finally {
      setFollowLoading(false);
    }
  }, [profileUser, isFollowing]);

  const stats = profileUser ? [
    {label: 'Dares', value: String(profileUser.daresCreated), icon: '🎯'},
    {label: 'Wins', value: String(profileUser.daresCompleted), icon: '✅'},
    {label: 'Win Rate', value: `${profileUser.successRate}%`, icon: '🏆'},
    {label: 'Earnings', value: `$${profileUser.totalWinnings}`, icon: '💰'},
  ] : [];

  if (loading) {
    return (
      <View style={styles.screen}>
        <ScreenHeader title="Profile" />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
        </View>
      </View>
    );
  }

  const isOwnProfile = currentUser?.id === userId;

  const ListHeader = (): React.JSX.Element => (
    <>
      {/* Hero */}
      <LinearGradient
        colors={[COLORS.primaryGlow, 'transparent']}
        style={styles.hero}>
        <Avatar uri={profileUser?.avatar} username={profileUser?.username} size="xl" />
        <Text style={styles.username}>@{profileUser?.username}</Text>
        <Text style={styles.reputation}>⭐ {profileUser?.reputation} XP</Text>
        {profileUser?.walletAddress && (
          <View style={styles.addressBadge}>
            <Text style={styles.addressText}>{shortenAddress(profileUser.walletAddress)}</Text>
          </View>
        )}

        {/* Follow button */}
        {!isOwnProfile && (
          <TouchableOpacity
            style={[styles.followButton, isFollowing && styles.followingButton]}
            onPress={handleFollow}
            disabled={followLoading}>
            {followLoading ? (
              <ActivityIndicator size="small" color={isFollowing ? COLORS.primary : COLORS.text} />
            ) : (
              <Text style={[styles.followText, isFollowing && styles.followingText]}>
                {isFollowing ? 'Following' : 'Follow'}
              </Text>
            )}
          </TouchableOpacity>
        )}
      </LinearGradient>

      {/* Stats */}
      <View style={styles.statsGrid}>
        {stats.map(s => (
          <View key={s.label} style={styles.statCard}>
            <Text style={styles.statIcon}>{s.icon}</Text>
            <Text style={styles.statValue}>{s.value}</Text>
            <Text style={styles.statLabel}>{s.label}</Text>
          </View>
        ))}
      </View>

      {/* Follower counts */}
      <View style={styles.followCounts}>
        <View style={styles.followCount}>
          <Text style={styles.followCountValue}>{profileUser?.followersCount ?? 0}</Text>
          <Text style={styles.followCountLabel}>Followers</Text>
        </View>
        <View style={styles.followCountDivider} />
        <View style={styles.followCount}>
          <Text style={styles.followCountValue}>{profileUser?.followingCount ?? 0}</Text>
          <Text style={styles.followCountLabel}>Following</Text>
        </View>
      </View>

      {/* Bio */}
      {profileUser?.bio && (
        <View style={styles.bioCard}>
          <Text style={styles.bioText}>{profileUser.bio}</Text>
        </View>
      )}

      <Text style={styles.daresSectionTitle}>
        {userDares.length > 0 ? `${userDares.length} Dares` : 'No Dares Yet'}
      </Text>
    </>
  );

  return (
    <View style={styles.screen}>
      <ScreenHeader title="Profile" />
      <FlatList
        data={userDares}
        keyExtractor={item => item.id}
        ListHeaderComponent={ListHeader}
        renderItem={({item}) => (
          <DareCard
            dare={item}
            onPress={() => navigation.navigate('DareDetails', {dareId: item.id})}
          />
        )}
        ListEmptyComponent={
          <View style={styles.emptyDares}>
            <Text style={styles.emptyIcon}>🎯</Text>
            <Text style={styles.emptyText}>No dares created yet</Text>
          </View>
        }
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  screen: {flex: 1, backgroundColor: COLORS.background},
  loadingContainer: {flex: 1, alignItems: 'center', justifyContent: 'center'},
  hero: {
    alignItems: 'center',
    paddingVertical: SPACING['2xl'],
    paddingHorizontal: SPACING.base,
    gap: SPACING.sm,
  },
  username: {
    fontSize: FONT_SIZES['2xl'],
    fontWeight: '800',
    color: COLORS.text,
    marginTop: SPACING.sm,
  },
  reputation: {fontSize: FONT_SIZES.sm, color: COLORS.textMuted},
  addressBadge: {
    backgroundColor: COLORS.card,
    borderRadius: RADIUS.md,
    paddingHorizontal: SPACING.md,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginTop: SPACING.xs,
  },
  addressText: {fontSize: FONT_SIZES.sm, color: COLORS.textSecondary, fontFamily: 'Courier'},
  followButton: {
    marginTop: SPACING.sm,
    paddingHorizontal: SPACING.xl,
    paddingVertical: SPACING.sm,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.primary,
    minWidth: 120,
    alignItems: 'center',
  },
  followingButton: {
    backgroundColor: 'transparent',
    borderWidth: 1.5,
    borderColor: COLORS.primary,
  },
  followText: {fontSize: FONT_SIZES.base, fontWeight: '700', color: COLORS.text},
  followingText: {color: COLORS.primary},
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: SPACING.base,
    gap: SPACING.sm,
    marginVertical: SPACING.md,
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
  followCounts: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: SPACING.xl,
    marginBottom: SPACING.md,
    paddingVertical: SPACING.md,
    marginHorizontal: SPACING.base,
    backgroundColor: COLORS.card,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  followCount: {alignItems: 'center', gap: 4},
  followCountValue: {fontSize: FONT_SIZES.xl, fontWeight: '800', color: COLORS.text},
  followCountLabel: {fontSize: FONT_SIZES.xs, color: COLORS.textMuted},
  followCountDivider: {width: 1, height: 32, backgroundColor: COLORS.border},
  bioCard: {
    marginHorizontal: SPACING.base,
    backgroundColor: COLORS.card,
    borderRadius: RADIUS.lg,
    padding: SPACING.base,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: SPACING.md,
  },
  bioText: {fontSize: FONT_SIZES.sm, color: COLORS.textSecondary, lineHeight: 22},
  daresSectionTitle: {
    fontSize: FONT_SIZES.base,
    fontWeight: '700',
    color: COLORS.text,
    paddingHorizontal: SPACING.base,
    marginBottom: SPACING.sm,
  },
  listContent: {paddingBottom: SPACING['4xl']},
  emptyDares: {
    paddingVertical: SPACING['2xl'],
    alignItems: 'center',
    gap: 12,
  },
  emptyIcon: {fontSize: 40},
  emptyText: {fontSize: FONT_SIZES.base, color: COLORS.textMuted},
});

export default UserProfileScreen;
