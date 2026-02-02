import React from "react";
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  TouchableOpacity,
} from "react-native";
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '@/context/AuthContext';
import { useNavigation } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/Ionicons';
import AppShell from '@/components/AppShell';

type Props = {
  isRecording?: boolean;
  recordingTime?: number;
};

export default function RecordingScreen({
  isRecording = false,
  recordingTime = 0,
}: Props) {
  const { user } = useAuth();
  return (
    <AppShell showUtilities={true}>
      <SafeAreaView style={styles.safe}>
        <View style={styles.container}>
          {/* Header */}
          <View style={styles.headerContainer}>
            <View style={styles.header}>
              <Text style={styles.title}>
                Record Your <Text style={styles.highlight}>Voice</Text>
              </Text>
            </View>
          </View>

          {/* Main Card */}
          <View style={styles.card}>
            {/* Timer */}
            <View style={styles.timerContainer}>
              {isRecording && (
                <Text style={styles.timerText}>
                  {formatTime(recordingTime)}
                </Text>
              )}
            </View>

            {/* Mic Button */}
            <View style={styles.controls}>
              <Pressable
                style={[
                  styles.micButton,
                  isRecording && styles.micButtonActive,
                ]}
                onPress={() => {}}
              >
                <Icon 
                  name={isRecording ? "stop" : "mic-outline"} 
                  size={36} 
                  color="#000" 
                />
              </Pressable>
            </View>

            {/* Instruction */}
            {!isRecording && (
              <View style={styles.instruction}>
                <Text style={styles.instructionText}>
                  Press the microphone button and start speaking.
                  {"\n"}Oscar will do the rest.
                </Text>
              </View>
            )}
          </View>
        </View>
      </SafeAreaView>
    </AppShell>
  );
}

/* helper */
function formatTime(seconds: number) {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
  },
  container: {
    flex: 1,
    alignItems: "center",
    paddingHorizontal: 16,
    paddingTop: 40,
  },

  headerContainer: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 80,
    marginBottom: 16,
  },
  header: {
    flex: 1,
  },
  title: {
    fontSize: 32,
    fontWeight: "700",
    color: "#fff",
    textAlign: "center",
  },
  highlight: {
    color: "#22d3ee",
  },

  card: {
    width: "100%",
    maxWidth: 420,
    aspectRatio: 1,
    backgroundColor: "#0f172a",
    borderRadius: 24,
    padding: 24,
    borderWidth: 1,
    borderColor: "rgba(34, 211, 238, 0.3)",
    justifyContent: "space-between",
  },

  timerContainer: {
    height: 32,
    alignItems: "center",
    justifyContent: "center",
  },
  timerText: {
    color: "#22d3ee",
    fontSize: 18,
    fontWeight: "600",
  },

  controls: {
    alignItems: "center",
    justifyContent: "center",
  },
  micButton: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: "#22d3ee",
    alignItems: "center",
    justifyContent: "center",
  },
  micButtonActive: {
    backgroundColor: "#ef4444",
  },
  instruction: {
    height: 64,
    alignItems: "center",
    justifyContent: "center",
  },
  instructionText: {
    color: "#9ca3af",
    fontSize: 16,
    textAlign: "center",
    lineHeight: 22,
  },
});
