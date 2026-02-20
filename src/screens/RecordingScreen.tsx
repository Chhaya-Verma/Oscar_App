import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ScrollView,
  PermissionsAndroid,
  Platform,
  Alert,
} from "react-native";
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '@/context/AuthContext';
import { useSubscription } from '@/context/SubscriptionContext';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '@/types/navigation';
import Icon from 'react-native-vector-icons/Ionicons';
import AppShell from '@/components/AppShell';
import { RecordingLimitModal } from '@/components/RecordingLimitModal';
import { canUserRecord } from '@/services/usage.service';
// import Voice from '@react-native-voice/voice';
import {
  loadModel as voskLoadModel,
  unload as voskUnload,
  start as voskStart,
  stop as voskStop,
  onPartialResult as voskOnPartialResult,
  onFinalResult as voskOnFinalResult,
  onResult as voskOnResult,
  onError as voskOnError,
  onTimeout as voskOnTimeout,
} from 'react-native-vosk';
 

type RecordingScreenNavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  'Recording'
>;

export default function RecordingScreen() {
  const { user } = useAuth();
  const { isProUser } = useSubscription();
  const navigation = useNavigation<RecordingScreenNavigationProp>();
  const [isRecording, setIsRecording] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [status, setStatus] = useState("Ready");
  const segmentsRef = useRef<string[]>([]);
  const partialRef = useRef<string>("");
  const [useVosk, setUseVosk] = useState(true);
  const [voskReady, setVoskReady] = useState(false);
  const VOSK_MODEL_NAME = 'model-en-en';
  
  // Recording limit modal state
  const [showLimitModal, setShowLimitModal] = useState(false);
  const [limitData, setLimitData] = useState({
    currentCount: 0,
    limit: 5,
    isApproaching: false,
  });
  
//   const vosk = new Vosk();

// const path = 'some/path/to/model/directory';

// vosk
//   .loadModel(path)
//   .then(() => {
//     const options = {
//       grammar: ['left', 'right', '[unk]'],
//     };

//     vosk
//       .start(options)
//       .then(() => {
//         console.log('Recognizer successfuly started');
//       })
//       .catch((e) => {
//         console.log('Error: ' + e);
//       });

//     const resultEvent = vosk.onResult((res) => {
//       console.log('A onResult event has been caught: ' + res);
//     });

//     // Don't forget to call resultEvent.remove(); to delete the listener
//   })
//   .catch((e) => {
//     console.error(e);
//   });

  useEffect(() => {
    let mounted = true;
    const initVosk = async () => {
      console.log("Initializing VOSK model");
      console.log(VOSK_MODEL_NAME);
      try {
        await voskLoadModel(VOSK_MODEL_NAME);
        if (!mounted) return;
        setVoskReady(true);
      } catch (e)  {
        console.error("Failed to load VOSK model " + e);
        if (!mounted) return;
        setVoskReady(false);
        setUseVosk(false);
      } 
    };
    initVosk();
    return () => {
      mounted = false;
      try { voskUnload(); } catch {}
    };
  }, []);

  // useEffect(() => {
  //   // Setup voice listeners
  //   Voice.onSpeechStart = () => {
  //     setRecognitionStarted(true);
  //     setStatus("Listening...");
  //   };

  //   Voice.onSpeechPartialResults = (e: any) => {
  //     if (e.value && e.value.length > 0) {
  //       const text = Array.isArray(e.value) ? e.value[0] : String(e.value);
  //       if (text && text.trim()) {
  //         setTranscript(text);
  //       }
  //     }
  //   };

  //   Voice.onSpeechResults = (e: any) => {
  //     if (e.value && e.value.length > 0) {
  //       const text = Array.isArray(e.value) ? e.value[0] : String(e.value);
  //       setTranscript(text);
  //       setStatus("Done");
  //     }
  //     setRecognitionStarted(false);
  //     setIsRecording(false);
  //   };

  //   Voice.onSpeechError = (e: any) => {
  //     // Ignore error if we're stopping manually (this is normal behavior)
  //     if (e.error?.code === '7/No match' || e.error?.message?.includes('No match')) {
  //       return;
  //     }
  //     setStatus("Error: " + (e.error?.message || "Unknown error"));
  //     setRecognitionStarted(false);
  //     setIsRecording(false);
  //   };

  //   Voice.onSpeechEnd = () => {
  //     setRecognitionStarted(false);
  //     setIsRecording(false);
  //   };

  //   return () => {
  //     Voice.destroy().catch(() => {});
  //   };
  // }, []);

  useEffect(() => {
    console.log("useVosk: " + useVosk);
    if (!useVosk) return;
    const extractText = (res: any): string => {
      try {
        if (typeof res === 'string') {
          // Try to parse JSON string first, then fall back to raw text
          try {
            const obj = JSON.parse(res);
            const t = (obj?.text ?? obj?.partial ?? '').toString().trim();
            if (t) return t;
          } catch {
            // not JSON, use as-is
            return res.trim?.() || String(res);
          }
        }
        if (res && typeof res === 'object') {
          const t = (res.text ?? res.partial ?? '').toString().trim();
          if (t) return t;
        }
        return '';
      } catch {
        return '';
      }
    };
    const subs: Array<{ remove: () => void }> = [];
    const joinSegments = () => segmentsRef.current.join(" ").trim();
    const updateTranscript = (partial?: string) => {
      const base = joinSegments();
      const tail = (partial && partial.trim()) ? ` ${partial.trim()}` : "";
      setTranscript((base + tail).trim());
    };
    const s1 = voskOnPartialResult((res) => {
      const text = extractText(res);
      partialRef.current = text || "";
      updateTranscript(partialRef.current);
    });
    subs.push(s1);
    const s2 = voskOnResult((res) => {
      const text = extractText(res).trim();
      if (!text) return;
      const last = segmentsRef.current[segmentsRef.current.length - 1];
      if (last !== text) {
        segmentsRef.current = [...segmentsRef.current, text];
      }
      partialRef.current = "";
      updateTranscript();
    });
    subs.push(s2);
    const s3 = voskOnFinalResult((res) => {
      const text = extractText(res);
      if (text && text.trim()) {
        const t = text.trim();
        const last = segmentsRef.current[segmentsRef.current.length - 1];
        if (last !== t) {
          segmentsRef.current = [...segmentsRef.current, t];
        }
      }
      partialRef.current = "";
      updateTranscript();
      setStatus("Done");
      setIsRecording(false);
    });
    subs.push(s3);
    const s4 = voskOnError((err) => {
      console.log("Error: " + String(err));
      setStatus("Error: " + String(err));
      
      setIsRecording(false);
    });
    subs.push(s4);
    const s5 = voskOnTimeout(() => {
      console.log("Timeout");
      setStatus("Timeout");
      
      setIsRecording(false);
    });
    subs.push(s5);
    console.log(subs, "Subscriptions", );
    return () => {
      subs.forEach(s => {
        try { s.remove(); } catch {}
      });
    };
  }, [useVosk]);

  const requestPermission = async () => {
    if (Platform.OS === "android") {
      try {
        // Check if permission already granted
        const checkPermission = await PermissionsAndroid.check(
          PermissionsAndroid.PERMISSIONS.RECORD_AUDIO
        );
        
        if (checkPermission) {
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
        
        return granted === PermissionsAndroid.RESULTS.GRANTED;
      } catch {
        return false;
      }
    }
    return true;
  };

  const startRecording = async () => {
    try {
      console.log("Starting recording...");
      
      if (!user) {
        Alert.alert('Please log in to record');
        return;
      }

      // Check if user can record
      const subscriptionPlan = 'pro';
      const { canRecord, currentCount, limit, error: usageError } = await canUserRecord(
        subscriptionPlan,
        user.id
      );

      if (usageError) {
        Alert.alert('Error', 'Could not check recording limit');
        return;
      }

      // Block if limit reached - show blocking modal only
      if (!canRecord) {
        setLimitData({
          currentCount,
          limit: limit || 5,
          isApproaching: false,
        });
        setShowLimitModal(true);
        return;
      }

      
      const hasPermission = await requestPermission();
      
      if (!hasPermission) {
        setStatus("Permission denied");
        return;
      }

      setTranscript("");
      setStatus("Recording...");
      setIsRecording(true);
      console.log(useVosk, voskReady);
      if (useVosk && voskReady) {
        // Use free-form recognition (no grammar). Grammar makes recognition strict and can suppress results.
        const options = { timeout: 150000 };
        await voskStart();
        console.log("Vosk started with options", options);
        setStatus("Listening...");
        
      } else {
        // await Voice.start("en-US");
        console.log("Voice started");
      }
    } catch (error: any) {
      setIsRecording(false);
      setStatus("Error: " + (error.message || "Could not start recording"));
    }
  };

  const stopRecording = async () => {
    try {
      if (useVosk && voskReady) {
        await voskStop();
        console.log("Vosk stopped")
        setIsRecording(false);

      } else {
        // await Voice.stop();
        console.log("Voice stopped");
      }
    } catch (error: any) {
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
  console.log(transcript, "Transcript");

  return (
    <AppShell showUtilities={true}>
      {/* Recording Limit Modal */}
      <RecordingLimitModal
        visible={showLimitModal}
        currentCount={limitData.currentCount}
        limit={limitData.limit}
        isApproachingLimit={limitData.isApproaching}
        onClose={() => setShowLimitModal(false)}
        onUpgradePress={() => {
          setShowLimitModal(false);
          // Navigate to Pricing screen for upgrade
          navigation.navigate('Pricing');
        }}
      />

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
    marginTop: 30,
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
