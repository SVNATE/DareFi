/**
 * Home / Feed Screen
 */
import React, {useEffect, useCallback, useRef} from 'react';
import {
  View,
  FlatList,
  StyleSheet,
  RefreshControl,
  TouchableOpacity,
  Text,
  ActivityIndicator,
} from 'react-native';
import {useNavigation} from '@react-navigation/native';
import {NativeStackNavigationProp} from '@react-navigation/native-stack';

import {useAuthStore, useDaresStore} from '../store';
import {HomeStackParamList, Dare} from '../types';
import {COLORS} from '../constants/colors';
import {FONT_SIZES, SPACING} from '../constants/theme';
import DareCard from '../components/dare/DareCard';
import ScreenHeader from '../components/common/ScreenHeader';

type Nav = NativeStackNavigationProp<HomeStackParamList, 'Feed'>;

const HomeScreen = (): React.JSX.Element => {
  const navigation = useNavigation<Nav>();
  const {user} = useAuthStore();
  const {dares, isLoadingFeed, loadFeed, loadMoreFeed, likeDare, feedError} = useDaresStore();

  useEffect(() => {
    if (dares.length === 0) {
      loadFeed(true);
    }
  }, []);

  const handleRefresh = useCallback((): void => {
    loadFeed(true);
  }, [loadFeed]);

  const handleDarePress = useCallback(
    (dare: Dare): void => {
      navigation.navigate('DareDetails', {dareId: dare.id});
    },
    [navigation],
  );

  const renderItem = useCallback(
    ({item}: {item: Dare}) => (
      <DareCard
        dare={item}
        onPress={handleDarePress}
        onLike={likeDare}
        style={styles.card}
      />
    ),
    [handleDarePress, likeDare],
  );

  const renderFooter = (): React.JSX.Element | null => {
    if (!isLoadingFeed || dares.length === 0) {return null;}
    return (
      <View style={styles.loadingMore}>
        <ActivityIndicator color={COLORS.primary} />
      </View>
    );
  };

  const renderEmpty = (): React.JSX.Element | null => {
    if (isLoadingFeed) {
      return (
        <View style={styles.emptyState}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.emptyText}>Loading dares...</Text>
        </View>
      );
    }
    if (feedError) {
      return (
        <View style={styles.emptyState}>
          <Text style={styles.emptyIcon}>⚠️</Text>
          <Text style={styles.emptyText}>{feedError}</Text>
          <TouchableOpacity onPress={handleRefresh} style={styles.retryBtn}>
            <Text style={styles.retryText}>Retry</Text>
          </TouchableOpacity>
        </View>
      );
    }
    return (
      <View style={styles.emptyState}>
        <Text style={styles.emptyIcon}>⚡</Text>
        <Text style={styles.emptyTitle}>No dares yet!</Text>
        <Text style={styles.emptyText}>Be the first to create a dare.</Text>
      </View>
    );
  };

  return (
    <View style={styles.screen}>
      <ScreenHeader
        title="DareFi"
        subtitle="Connect. Challenge. Win."
        rightElement={
          <TouchableOpacity
            onPress={() => navigation.navigate('Notifications')}
            style={styles.notifBtn}>
            <Text style={styles.notifIcon}>🔔</Text>
          </TouchableOpacity>
        }
      />

      <FlatList
        data={dares}
        keyExtractor={item => item.id}
        renderItem={renderItem}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        onEndReached={loadMoreFeed}
        onEndReachedThreshold={0.4}
        ListFooterComponent={renderFooter}
        ListEmptyComponent={renderEmpty}
        refreshControl={
          <RefreshControl
            refreshing={isLoadingFeed && dares.length > 0}
            onRefresh={handleRefresh}
            tintColor={COLORS.primary}
            colors={[COLORS.primary]}
          />
        }
      />
    </View>
  );
};

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  listContent: {
    paddingHorizontal: SPACING.base,
    paddingBottom: SPACING['4xl'],
    flexGrow: 1,
  },
  card: {},
  loadingMore: {
    paddingVertical: SPACING.base,
    alignItems: 'center',
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING['5xl'],
    paddingHorizontal: SPACING['2xl'],
  },
  emptyIcon: {fontSize: 64, marginBottom: SPACING.base},
  emptyTitle: {
    fontSize: FONT_SIZES.xl,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: SPACING.sm,
  },
  emptyText: {
    fontSize: FONT_SIZES.base,
    color: COLORS.textMuted,
    textAlign: 'center',
    marginTop: SPACING.sm,
  },
  retryBtn: {
    marginTop: SPACING.md,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.sm,
    backgroundColor: COLORS.card,
    borderRadius: 99,
    borderWidth: 1,
    borderColor: COLORS.primary,
  },
  retryText: {
    fontWeight: '700',
    color: COLORS.primary,
    fontSize: FONT_SIZES.sm,
  },
  notifBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.card,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  notifIcon: {fontSize: 18},
});

export default HomeScreen;
