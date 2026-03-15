import React from 'react';
import {createNativeStackNavigator} from '@react-navigation/native-stack';
import {AuthStackParamList} from '../types';

import LoginScreen from '../screens/LoginScreen';
import CreateUsernameScreen from '../screens/CreateUsernameScreen';

const Stack = createNativeStackNavigator<AuthStackParamList>();

const AuthNavigator = (): React.JSX.Element => (
  <Stack.Navigator screenOptions={{headerShown: false, animation: 'slide_from_right'}}>
    <Stack.Screen name="Login" component={LoginScreen} />
    <Stack.Screen name="CreateUsername" component={CreateUsernameScreen} />
  </Stack.Navigator>
);

export default AuthNavigator;
