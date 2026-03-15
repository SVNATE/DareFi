/**
 * Explore Screen — search and filter dares
 */
import React, {useState, useMemo} from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import {useNavigation} from '@react-navigation/native';
import {NativeStackNavigationProp} from '@react-navigation/native-stack';

import {MOCK_DARES} from '../services/mockData';
import {Dare, HomeStackParamList} from '../types';
import {COLORS} from '../constants/colors';
import {FONT_SIZES, SPACING, RADIUS} from '../constants/theme';
import {DARE_CATEGORIES} from '../constants/config';
import DareCard from '../components/dare/DareCard';
import ScreenHeader from '../components/common/ScreenHeader';

type Nav = NativeStackNavigationProp<HomeStackParamList>;

const STATUS_FILTERS = ['All', 'Open', 'Active', 'Voting', 'Completed'];

const ExploreScreen = (): React.JSX.Element => {
  const navigation = useNavigation<Nav>();
  const [query, setQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [selectedStatus, setSelectedStatus] = useState<string>('All');

  const categories = ['All', ...DARE_CATEGORIES.map(c => c.label)];

  const filtered = useMemo<Dare[]>(() => {
    return MOCK_DARES.filter(dare => {
      const matchesQuery =
        query.trim() === '' ||
        dare.title.toLowerCase().includes(query.toLowerCase()) ||
        dare.description.toLowerCase().includes(query.toLowerCase());

      const matchesCategory =
        selectedCategory === 'All' ||
        dare.category === DARE_CATEGORIES.find(c => c.label === selectedCategory)?.id;

      const matchesStatus =
        selectedStatus === 'All' ||
        dare.status.toLowerCase() === selectedStatus.toLowerCase();

      return matchesQuery && matchesCategory && matchesStatus;
    });
  }, [query, selectedCategory, selectedStatus]);

  return (
    <View style={styles.screen}>
      <ScreenHeader title="Explore" subtitle={`${filtered.length} dares found`} />

      {/* Search bar */}
      <View style={styles.searchRow}>
        <View style={styles.searchContainer}>
          <Text style={styles.searchIcon}>🔍</Text>
          <TextInput
            style={styles.searchInput}
            placeholder="Search dares..."
            placeholderTextColor={COLORS.textMuted}
            value={query}
            onChangeText={setQuery}
            returnKeyType="search"
          />
          {query.length > 0 && (
            <TouchableOpacity onPress={() => setQuery('')}>
              <Text style={styles.clearIcon}>✕</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Status chips */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.chipsRow}
        contentContainerStyle={styles.chipsContent}>
        {STATUS_FILTERS.map(s => (
          <TouchableOpacity
            key={s}
            style={[styles.chip, selectedStatus === s && styles.chipActive]}
            onPress={() => setSelectedStatus(s)}>
            <Text style={[styles.chipText, selectedStatus === s && styles.chipTextActive]}>
              {s}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Category chips */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.chipsRow}
        contentContainerStyle={styles.chipsContent}>
        {categories.map(c => (
          <TouchableOpacity
            key={c}
            style={[styles.chip, styles.chipCategory, selectedCategory === c && styles.chipActive]}
            onPress={() => setSelectedCategory(c)}>
            <Text style={[styles.chipText, selectedCategory === c && styles.chipTextActive]}>
              {c}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {filtered.length === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.emptyIcon}>🔍</Text>
          <Text style={styles.emptyTitle}>No dares found</Text>
          <Text style={styles.emptyText}>Try a different search or filter</Text>
        </View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={item => item.id}
          renderItem={({item}) => (
            <DareCard
              dare={item}
              onPress={() => navigation.navigate('DareDetails', {dareId: item.id})}
            />
          )}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  screen: {flex: 1, backgroundColor: COLORS.background},
  searchRow: {
    paddingHorizontal: SPACING.base,
    marginBottom: SPACING.sm,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.card,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingHorizontal: SPACING.md,
    height: 48,
    gap: SPACING.sm,
  },
  searchIcon: {fontSize: 16},
  searchInput: {
    flex: 1,
    fontSize: FONT_SIZES.base,
    color: COLORS.text,
  },
  clearIcon: {fontSize: 14, color: COLORS.textMuted, padding: 4},
  chipsRow: {maxHeight: 44, marginBottom: SPACING.xs},
  chipsContent: {
    paddingHorizontal: SPACING.base,
    gap: SPACING.xs,
    alignItems: 'center',
  },
  chip: {
    paddingHorizontal: SPACING.md,
    paddingVertical: 6,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginRight: SPACING.xs,
  },
  chipCategory: {backgroundColor: COLORS.surface},
  chipActive: {backgroundColor: COLORS.primaryGlow, borderColor: COLORS.primary},
  chipText: {fontSize: FONT_SIZES.sm, color: COLORS.textMuted, fontWeight: '600'},
  chipTextActive: {color: COLORS.primaryLight},
  listContent: {
    paddingHorizontal: SPACING.base,
    paddingBottom: SPACING['4xl'],
    paddingTop: SPACING.sm,
  },
  empty: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    paddingBottom: 100,
  },
  emptyIcon: {fontSize: 48},
  emptyTitle: {fontSize: FONT_SIZES.lg, fontWeight: '700', color: COLORS.text},
  emptyText: {fontSize: FONT_SIZES.sm, color: COLORS.textMuted},
});

export default ExploreScreen;
