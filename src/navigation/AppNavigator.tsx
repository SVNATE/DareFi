/**
 * Root App Navigator
 * Switches between Auth flow and Main app based on authentication state.
 */
import React, {useEffect} from 'react';
import {NavigationContainer} from '@react-navigation/native';
import {createNativeStackNavigator} from '@react-navigation/native-stack';

import {useAuthStore} from '../store';
import {RootStackParamList} from '../types';

import SplashScreen from '../screens/SplashScreen';
import AuthNavigator from './AuthNavigator';
import MainNavigator from './MainNavigator';

const Stack = createNativeStackNavigator<RootStackParamList>();

const AppNavigator = (): React.JSX.Element => {
  const {isAuthenticated, walletAddress, hydrateFromStorage} = useAuthStore();

  useEffect(() => {
    hydrateFromStorage();
  }, [hydrateFromStorage]);

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{headerShown: false, animation: 'fade'}}>
        {!walletAddress && !isAuthenticated ? (
          // Not connected at all
          <>
            <Stack.Screen name="Splash" component={SplashScreen} />
            <Stack.Screen name="Auth" component={AuthNavigator} />
          </>
        ) : !isAuthenticated ? (
          // Wallet connected but no username
          <Stack.Screen name="Auth" component={AuthNavigator} />
        ) : (
          // Fully authenticated
          <Stack.Screen name="Main" component={MainNavigator} />
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default AppNavigator;
