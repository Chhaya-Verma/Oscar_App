import React from "react";
import {
  View,
  Text,
  StyleSheet,
  Pressable,
} from "react-native";
import { SafeAreaView } from 'react-native-safe-area-context';

type Props = {
  isRecording?: boolean;
  recordingTime?: number;
};

export default function RecordingScreen({
  isRecording = false,
  recordingTime = 0,
}: Props) {
  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>
            Record Your <Text style={styles.highlight}>Voice</Text>
          </Text>
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
              <Text style={styles.micIcon}>
                {isRecording ? "■" : "🎤"}
              </Text>
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
    backgroundColor: "#000",
  },
  container: {
    flex: 1,
    alignItems: "center",
    paddingHorizontal: 16,
    paddingTop: 32,
  },

  header: {
    marginTop: 24,
    marginBottom: 32,
  },
  title: {
    fontSize: 32,
    fontWeight: "700",
    color: "#fff",
    textAlign: "center",
  },
  highlight: {
    color: "#22d3ee", // cyan-400
  },

  card: {
    width: "100%",
    maxWidth: 420,
    aspectRatio: 1,
    backgroundColor: "#0f172a", // slate-900
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
    backgroundColor: "#ef4444", // red when recording
  },
  micIcon: {
    fontSize: 36,
    color: "#000",
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
