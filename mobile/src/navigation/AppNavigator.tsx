import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { NavigationContainer } from '@react-navigation/native';
import ChatScreen from '../screens/ChatScreen';
import DashboardScreen from '../screens/DashboardScreen';
import SettingsScreen from '../screens/SettingsScreen';

const Tab = createBottomTabNavigator();

export default function AppNavigator() {
  return (
    <NavigationContainer>
      <Tab.Navigator
        screenOptions={{
          headerShown: false,
          tabBarStyle: { backgroundColor: '#1e293b', borderTopColor: '#334155', paddingBottom: 8, paddingTop: 8, height: 60 },
          tabBarActiveTintColor: '#6366f1',
          tabBarInactiveTintColor: '#64748b',
          tabBarLabelStyle: { fontSize: 12 },
        }}
      >
        <Tab.Screen name="Chat" component={ChatScreen} options={{ tabBarIcon: () => null, tabBarLabel: '💬 Chat' }} />
        <Tab.Screen name="Dashboard" component={DashboardScreen} options={{ tabBarIcon: () => null, tabBarLabel: '📊 Dashboard' }} />
        <Tab.Screen name="Settings" component={SettingsScreen} options={{ tabBarIcon: () => null, tabBarLabel: '⚙️ Settings' }} />
      </Tab.Navigator>
    </NavigationContainer>
  );
}
