/**
 * Sample React Native App
 * https://github.com/facebook/react-native
 *
 * @format
 */

import * as React from 'react';
import { StatusBar, StyleSheet, useColorScheme } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import {
  SafeAreaProvider,
} from 'react-native-safe-area-context';
import LandingPage from './src/screens/LandingPage';
import RecordingScreen from './src/screens/RecordingScreen';

const Stack = createStackNavigator<{
  Landing: undefined;
  Recording: undefined;
}>();

function App() {
  const isDarkMode = useColorScheme() === 'dark';

  return (
    <SafeAreaProvider>
      <StatusBar barStyle={isDarkMode ? 'light-content' : 'dark-content'} />
      <NavigationContainer>
        <Stack.Navigator screenOptions={{ headerShown: false }}>
          <Stack.Screen name="Landing" component={LandingPage} />
          <Stack.Screen name="Recording" component={RecordingScreen} />
        </Stack.Navigator>
      </NavigationContainer>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});

export default App;
