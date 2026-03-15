/**
 * Main Tab + Home Stack Navigator
 */
import React from 'react';
import {View, Text, StyleSheet, Platform} from 'react-native';
import {createBottomTabNavigator} from '@react-navigation/bottom-tabs';
import {createNativeStackNavigator} from '@react-navigation/native-stack';

import {MainTabParamList, HomeStackParamList} from '../types';
import {COLORS} from '../constants/colors';
import {FONT_SIZES} from '../constants/theme';

// Screens
import HomeScreen from '../screens/HomeScreen';
import ExploreScreen from '../screens/ExploreScreen';
import CreateDareScreen from '../screens/CreateDareScreen';
import LeaderboardScreen from '../screens/LeaderboardScreen';
import ProfileScreen from '../screens/ProfileScreen';
import DareDetailsScreen from '../screens/DareDetailsScreen';
import ProofUploadScreen from '../screens/ProofUploadScreen';
import VotingScreen from '../screens/VotingScreen';
import ResultsScreen from '../screens/ResultsScreen';
import NotificationsScreen from '../screens/NotificationsScreen';
import UserProfileScreen from '../screens/UserProfileScreen';

// ─── Home Stack ───────────────────────────────────────────────────────────────

const HomeStack = createNativeStackNavigator<HomeStackParamList>();

const HomeStackNavigator = (): React.JSX.Element => (
  <HomeStack.Navigator
    screenOptions={{
      headerShown: false,
      contentStyle: {backgroundColor: COLORS.background},
    }}>
    <HomeStack.Screen name="Feed" component={HomeScreen} />
    <HomeStack.Screen name="DareDetails" component={DareDetailsScreen} />
    <HomeStack.Screen name="ProofUpload" component={ProofUploadScreen} />
    <HomeStack.Screen name="Voting" component={VotingScreen} />
    <HomeStack.Screen name="Results" component={ResultsScreen} />
    <HomeStack.Screen name="UserProfile" component={UserProfileScreen} />
    <HomeStack.Screen name="Notifications" component={NotificationsScreen} />
  </HomeStack.Navigator>
);

// ─── Tab Navigator ────────────────────────────────────────────────────────────

const Tab = createBottomTabNavigator<MainTabParamList>();

const TAB_ICONS: Record<string, {active: string; inactive: string}> = {
  Home: {active: '🏠', inactive: '🏚️'},
  Explore: {active: '🔭', inactive: '🔭'},
  CreateDare: {active: '⚡', inactive: '⚡'},
  Leaderboard: {active: '🏆', inactive: '🏆'},
  Profile: {active: '👤', inactive: '👤'},
};

const MainNavigator = (): React.JSX.Element => (
  <Tab.Navigator
    screenOptions={({route}) => ({
      headerShown: false,
      tabBarStyle: styles.tabBar,
      tabBarActiveTintColor: COLORS.primary,
      tabBarInactiveTintColor: COLORS.textMuted,
      tabBarLabelStyle: styles.tabLabel,
      tabBarIcon: ({focused}) => {
        const icons = TAB_ICONS[route.name];
        return (
          <Text style={[styles.tabIcon, focused && styles.tabIconActive]}>
            {focused ? icons.active : icons.inactive}
          </Text>
        );
      },
    })}>
    <Tab.Screen
      name="Home"
      component={HomeStackNavigator}
      options={{tabBarLabel: 'Home'}}
    />
    <Tab.Screen
      name="Explore"
      component={ExploreScreen}
      options={{tabBarLabel: 'Explore'}}
    />
    <Tab.Screen
      name="CreateDare"
      component={CreateDareScreen}
      options={{
        tabBarLabel: 'Dare',
        tabBarIcon: () => (
          <View style={styles.createButton}>
            <Text style={styles.createButtonText}>⚡</Text>
          </View>
        ),
      }}
    />
    <Tab.Screen
      name="Leaderboard"
      component={LeaderboardScreen}
      options={{tabBarLabel: 'Leaders'}}
    />
    <Tab.Screen
      name="Profile"
      component={ProfileScreen}
      options={{tabBarLabel: 'Profile'}}
    />
  </Tab.Navigator>
);

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: COLORS.surface,
    borderTopColor: COLORS.border,
    borderTopWidth: 1,
    height: Platform.OS === 'ios' ? 84 : 64,
    paddingBottom: Platform.OS === 'ios' ? 28 : 8,
    paddingTop: 8,
  },
  tabLabel: {
    fontSize: FONT_SIZES.xs,
    fontWeight: '600',
    marginTop: 2,
  },
  tabIcon: {
    fontSize: 20,
    opacity: 0.5,
  },
  tabIconActive: {
    opacity: 1,
    transform: [{scale: 1.1}],
  },
  createButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
    shadowColor: COLORS.primary,
    shadowOffset: {width: 0, height: 4},
    shadowOpacity: 0.5,
    shadowRadius: 8,
    elevation: 8,
  },
  createButtonText: {
    fontSize: 22,
  },
});

export default MainNavigator;
