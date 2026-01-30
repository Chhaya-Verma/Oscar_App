import React, { useEffect, useRef, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Animated } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { StackNavigationProp } from '@react-navigation/stack';

// Define the navigation stack types
type RootStackParamList = {
  Landing: undefined;
  Recording: undefined;
};

type LandingScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Landing'>;

interface LandingPageProps {
  onNext?: () => void;
  onSettings?: () => void;
}

const FLIP_TEXTS = [
  'Let AI refine.',
  'Let AI write.',
  'Let AI transform.',
  'Create effortlessly.'
];

const LandingPage: React.FC<LandingPageProps> = ({ onNext, onSettings }) => {
  const navigation = useNavigation<LandingScreenNavigationProp>();
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

  return (
    <View style={styles.container}>
      {/* Brand Badge */}
      <View style={styles.brandBadge}>
        <View style={styles.brandRow}>
          <Text style={styles.brandMic}>🎤</Text>
          <Text style={styles.brandText}>OSCAR</Text>
        </View>
      </View>

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

      {/* Start Button */}
      <TouchableOpacity
        style={styles.startButton}
        onPress={() => navigation.navigate('Recording')}
        activeOpacity={0.85}
      >
        <Text style={styles.startIcon}>🎤</Text>
      </TouchableOpacity>

      {/* Utility Buttons */}
      <View style={styles.utilities}>
        <TouchableOpacity style={styles.utilityBtn} activeOpacity={0.8}>
          <Text style={styles.utilityIcon}>📄</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={styles.utilityBtn}
          onPress={onSettings}
          activeOpacity={0.8}
        >
          <Text style={styles.utilityIcon}>⚙️</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.utilityBtn} activeOpacity={0.8}>
          <Text style={styles.utilityIcon}>↪️</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
    alignItems: 'center',
    justifyContent: 'center',
  },
  brandBadge: {
    position: 'absolute',
    top: 60,
    left: 24,
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  brandMic: {
    fontSize: 16,
    color: '#00D9FF',
  },
  brandText: {
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: 1.5,
    color: '#ffffff',
    opacity: 0.9,
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
    backgroundColor: '#00D9FF',
    borderRadius: 6,
    paddingHorizontal: 24,
    paddingVertical: 14,
    shadowColor: '#00D9FF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  accentText: {
    fontSize: 20,
    fontWeight: '500',
    color: '#002B36',
  },
  startButton: {
    position: 'absolute',
    bottom: 60,
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#00D9FF',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#00D9FF',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.6,
    shadowRadius: 25,
    elevation: 25,
  },
  startIcon: {
    fontSize: 28,
    color: '#002B36',
  },
  utilities: {
    position: 'absolute',
    bottom: 60,
    right: 24,
    flexDirection: 'column',
    gap: 16,
  },
  utilityBtn: {
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 2,
    borderColor: '#00D9FF',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    shadowColor: '#00D9FF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 8,
  },
  utilityIcon: {
    fontSize: 20,
    color: '#00D9FF',
  },
});

export default LandingPage;