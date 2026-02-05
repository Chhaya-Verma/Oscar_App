import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { useAuth } from '../context/AuthContext';
import { ActivityIndicator, View, StyleSheet } from 'react-native';
import LandingPage from '@/screens/LandingPage';
import AuthScreen from '@/screens/AuthScreen';
import RecordingScreen from '@/screens/RecordingScreen';
import ProcessingScreen from '@/screens/ProcessingScreen';
import ResultScreen from '@/screens/ResultScreen';
import NotesScreen from '@/screens/NotesScreen';
import NoteDetailScreen from '@/screens/NoteDetailScreen';
import SettingsScreen from '@/screens/SettingsScreen';
import type { RootStackParamList } from '@/types/navigation';

const Stack = createStackNavigator<RootStackParamList>();

export default function RootNavigator() {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#00D9FF" />
      </View>
    );
  }

  return (
    <Stack.Navigator 
      id="root"
      screenOptions={{ headerShown: false }}
      initialRouteName={user ? "Landing" : "Auth"}
    >
      <Stack.Screen name="Landing" component={LandingPage} />
      <Stack.Screen name="Auth" component={AuthScreen} />
      <Stack.Screen name="Recording" component={RecordingScreen} />
      <Stack.Screen name="Processing" component={ProcessingScreen} />
      <Stack.Screen name="Result" component={ResultScreen} />
      <Stack.Screen name="Notes" component={NotesScreen} />
      <Stack.Screen name="NoteDetail" component={NoteDetailScreen} />
      <Stack.Screen name="Settings" component={SettingsScreen} />
    </Stack.Navigator>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#000000',
  },
});