import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ScrollView,
  PermissionsAndroid,
  Platform,
} from "react-native";
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '@/context/AuthContext';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '@/types/navigation';
import Icon from 'react-native-vector-icons/Ionicons';
import AppShell from '@/components/AppShell';
import Voice from '@react-native-voice/voice';

type RecordingScreenNavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  'Recording'
>;

export default function RecordingScreen() {
  const { user } = useAuth();
  const navigation = useNavigation<RecordingScreenNavigationProp>();
  const [isRecording, setIsRecording] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [status, setStatus] = useState("Ready");
  const [recognitionStarted, setRecognitionStarted] = useState(false);

  useEffect(() => {
    // Setup voice listeners
    Voice.onSpeechStart = () => {
      console.log("onSpeechStart called");
      setRecognitionStarted(true);
      setStatus("Listening...");
    };

    Voice.onSpeechPartialResults = (e: any) => {
      console.log("onSpeechPartialResults:", e);
      if (e.value && e.value.length > 0) {
        const text = Array.isArray(e.value) ? e.value[0] : String(e.value);
        if (text && text.trim()) {
          console.log("Partial transcript:", text);
          setTranscript(text);
        }
      }
    };

    Voice.onSpeechResults = (e: any) => {
      console.log("onSpeechResults called:", e);
      if (e.value && e.value.length > 0) {
        const text = Array.isArray(e.value) ? e.value[0] : String(e.value);
        console.log("Transcript received:", text);
        setTranscript(text);
        setStatus("Done");
      }
      setRecognitionStarted(false);
      setIsRecording(false);
    };

    Voice.onSpeechError = (e: any) => {
      console.log("onSpeechError:", e);
      // Ignore error if we're stopping manually (this is normal behavior)
      if (e.error?.code === '7/No match' || e.error?.message?.includes('No match')) {
        console.log("No speech detected - ignoring");
        return;
      }
      setStatus("Error: " + (e.error?.message || "Unknown error"));
      setRecognitionStarted(false);
      setIsRecording(false);
    };

    Voice.onSpeechEnd = () => {
      console.log("onSpeechEnd called");
      setRecognitionStarted(false);
      setIsRecording(false);
    };

    return () => {
      Voice.destroy().catch(() => {});
    };
  }, []);

  const requestPermission = async () => {
    if (Platform.OS === "android") {
      try {
        // Check if permission already granted
        const checkPermission = await PermissionsAndroid.check(
          PermissionsAndroid.PERMISSIONS.RECORD_AUDIO
        );
        
        if (checkPermission) {
          console.log("Permission already granted");
          return true;
        }

        // Request permission
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.RECORD_AUDIO,
          {
            title: "Microphone Permission",
            message: "Need microphone to record your voice",
            buttonPositive: "OK",
            buttonNegative: "Cancel",
          }
        );
        
        console.log("Permission result:", granted);
        return granted === PermissionsAndroid.RESULTS.GRANTED;
      } catch (err) {
        console.log("Permission error:", err);
        return false;
      }
    }
    return true;
  };

  const startRecording = async () => {
    try {
      console.log("Starting recording...");
      
      const hasPermission = await requestPermission();
      console.log("Has permission:", hasPermission);
      
      if (!hasPermission) {
        setStatus("Permission denied");
        return;
      }

      setTranscript("");
      setStatus("Recording...");
      setIsRecording(true);
      
      console.log("About to call Voice.start");
      await Voice.start("en-US");
      console.log("Voice.start completed");
      
    } catch (error: any) {
      console.log("Start error:", error);
      setIsRecording(false);
      setStatus("Error: " + (error.message || "Could not start recording"));
    }
  };

  const stopRecording = async () => {
    try {
      console.log("Stopping recording...");
      await Voice.stop();
      console.log("Voice.stop completed");
    } catch (error: any) {
      console.log("Stop error:", error);
      setIsRecording(false);
      setStatus("Error: " + (error.message || "Could not stop recording"));
    }
  };

  const handleMicPress = async () => {
    if (isRecording) {
      await stopRecording();
    } else {
      await startRecording();
    }
  };

  const clearTranscript = () => {
    setTranscript("");
    setStatus("Ready");
  };

  return (
    <AppShell showUtilities={true}>
      <SafeAreaView style={styles.safe}>
        <ScrollView
          style={styles.scrollContainer}
          contentContainerStyle={styles.contentContainer}
        >
          <View style={styles.container}>
            {/* Header */}
            <View style={styles.headerContainer}>
              <View style={styles.header}>
                <Text style={styles.title}>
                  Record Your <Text style={styles.highlight}>Voice</Text>
                </Text>
              </View>
            </View>

            {/* Status Box */}
            <View style={styles.statusBox}>
              <Text style={styles.statusText}>{status}</Text>
            </View>

            {/* Main Card */}
            <View style={styles.card}>
              {/* Mic Button */}
              <View style={styles.controls}>
                <Pressable
                  style={[
                    styles.micButton,
                    isRecording && styles.micButtonActive,
                  ]}
                  onPress={handleMicPress}
                >
                  <Icon
                    name={isRecording ? "stop" : "mic-outline"}
                    size={36}
                    color="#000"
                  />
                </Pressable>
              </View>

              {/* Instruction */}
              {!isRecording && transcript === "" && (
                <View style={styles.instruction}>
                  <Text style={styles.instructionText}>
                    Press the microphone button and start speaking.
                    {"\n"}Oscar will do the rest.
                  </Text>
                </View>
              )}
            </View>

            {/* Transcript Section */}
            {transcript !== "" && (
              <View style={styles.transcriptSection}>
                <View style={styles.transcriptHeader}>
                  <Text style={styles.transcriptLabel}>Transcript:</Text>
                  <Pressable onPress={clearTranscript}>
                    <Icon name="close-circle" size={24} color="#ef4444" />
                  </Pressable>
                </View>
                <View style={styles.transcriptBox}>
                  <Text style={styles.transcriptText}>{transcript}</Text>
                </View>
                
                {/* Action Button */}
                <Pressable
                  style={styles.formatButton}
                  onPress={() => navigation.navigate('Processing', { rawText: transcript })}
                >
                  <Icon name="sparkles" size={16} color="#000" style={{ marginRight: 8 }} />
                  <Text style={styles.formatButtonText}>Format with AI</Text>
                </Pressable>
              </View>
            )}
          </View>
        </ScrollView>
      </SafeAreaView>
    </AppShell>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
  },
  scrollContainer: {
    flex: 1,
  },
  contentContainer: {
    paddingBottom: 40,
  },
  container: {
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

  statusBox: {
    width: "100%",
    maxWidth: 420,
    backgroundColor: "rgba(34, 211, 238, 0.1)",
    borderRadius: 12,
    padding: 12,
    marginBottom: 24,
    borderLeftWidth: 4,
    borderLeftColor: "#22d3ee",
  },
  statusText: {
    fontSize: 14,
    color: "#22d3ee",
    fontWeight: "500",
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

  transcriptSection: {
    width: "100%",
    maxWidth: 420,
    marginTop: 24,
    borderRadius: 16,
    backgroundColor: "#0f172a",
    borderWidth: 1,
    borderColor: "rgba(34, 211, 238, 0.3)",
    padding: 16,
  },
  transcriptHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  transcriptLabel: {
    color: "#22d3ee",
    fontSize: 16,
    fontWeight: "600",
  },
  transcriptBox: {
    backgroundColor: "rgba(15, 23, 42, 0.5)",
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: "rgba(34, 211, 238, 0.2)",
  },
  transcriptText: {
    color: "#e5e7eb",
    fontSize: 16,
    lineHeight: 24,
  },

  formatButton: {
    marginTop: 16,
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: "#22d3ee",
    borderRadius: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  formatButtonText: {
    color: "#000",
    fontSize: 15,
    fontWeight: "600",
  },
});
