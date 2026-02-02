import React, { useEffect, useRef, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Animated } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { StackNavigationProp } from '@react-navigation/stack';
import { useAuth } from '@/context/AuthContext';
import type { RootStackParamList } from '@/types/navigation';
import Icon from 'react-native-vector-icons/Ionicons';
import AppShell from '@/components/AppShell';

type LandingScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Landing'>;

const FLIP_TEXTS = [
  'Let AI refine.',
  'Let AI write.',
  'Let AI transform.',
  'Create effortlessly.'
];

const LandingPage: React.FC = () => {
  const navigation = useNavigation<LandingScreenNavigationProp>();
  const { user } = useAuth(); 
  const [fadeIndex, setFadeIndex] = useState(0);
  const fadeTextAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const interval = setInterval(() => {
      Animated.timing(fadeTextAnim, {
        toValue: 0,
        duration: 350,
        useNativeDriver: true,
      }).start(() => {
        setFadeIndex((prev) => (prev + 1) % FLIP_TEXTS.length);
        Animated.timing(fadeTextAnim, {
          toValue: 1,
          duration: 350,
          useNativeDriver: true,
        }).start();
      });
    }, 2200);
    return () => clearInterval(interval);
  }, []);

  // Handle mic button click
  const handleMicPress = () => {
    if (user) {
      // If user logged Then Recording screen
      navigation.navigate('Recording');
    } else {
      // If user logged out Then Auth screen
      navigation.navigate('Auth');
    }
  };

  return (
    <AppShell showUtilities={true}>
      <View style={styles.container}>
        {/* Main Content */}
        <View style={styles.mainContent}>
          <Text style={styles.title}>
            Bring your ideas to light.
          </Text>
          <View style={styles.accentPill}>
            <Animated.Text
              key={fadeIndex}
              style={[
                styles.accentText,
                { opacity: fadeTextAnim }
              ]}
            >
              {FLIP_TEXTS[fadeIndex]}
            </Animated.Text>
          </View>
        </View>

        {/* Start Button - */}
        <TouchableOpacity
          style={styles.startButton}
          onPress={handleMicPress}
          activeOpacity={0.85}
        >
          <Icon name="mic-outline" size={32} color="#002B36" />
        </TouchableOpacity>
      </View>
    </AppShell>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  
  mainContent: {
    alignItems: 'center',
    paddingHorizontal: 30,
  },
  title: {
    fontSize: 40,
    fontWeight: '500',
    color: '#ffffff',
    textAlign: 'center',
    lineHeight: 48,
    marginBottom: 24,
    letterSpacing: -1,
  },
  accentPill: {
    backgroundColor: '#22d3ee',
    borderRadius: 6,
    paddingHorizontal: 24,
    paddingVertical: 14,
    shadowColor: '#22d3ee',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  accentText: {
    fontSize: 20,
    fontWeight: '500',
    color: '#020617',
  },
  startButton: {
    position: 'absolute',
    bottom: 60,
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#22d3ee',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#22d3ee',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.6,
    shadowRadius: 25,
    elevation: 25,
  },
});

export default LandingPage;