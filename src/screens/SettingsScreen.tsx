import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  TextInput,
  Alert,
  ActivityIndicator,
  SafeAreaView,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type { RootStackParamList } from "@/types/navigation";
import Icon from "react-native-vector-icons/Ionicons";
import AppShell from "@/components/AppShell";
import { useAuth } from "@/context/AuthContext";
import { useSubscription } from "@/context/SubscriptionContext";
import { VocabularyLimitModal } from "@/components/VocabularyLimitModal";
import { UsageIndicator } from "@/components/UsageIndicator";
import { vocabularyService } from "@/services/vocabulary.service";
import type { VocabularyEntry } from "@/types/vocabulary.types";
import { SUBSCRIPTION_CONFIG, ERROR_MESSAGES } from "@/constants";

type SettingsScreenNavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  "Settings"
>;

export default function SettingsScreen() {
  const navigation = useNavigation<SettingsScreenNavigationProp>();
  const { user } = useAuth();
  const {
    isProUser,
    recordingsThisMonth,
    recordingsLimit,
    notesCount,
    notesLimit,
    vocabularyCount,
    vocabularyLimit: subscriptionVocabLimit,
  } = useSubscription();

  const [activeTab, setActiveTab] = useState("vocabulary");
  const [vocabulary, setVocabulary] = useState<VocabularyEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);

  // Form state for new entry
  const [newTerm, setNewTerm] = useState("");
  const [newPronunciation, setNewPronunciation] = useState("");
  const [newContext, setNewContext] = useState("");

  // Edit state
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTerm, setEditTerm] = useState("");
  const [editPronunciation, setEditPronunciation] = useState("");
  const [editContext, setEditContext] = useState("");

  // Vocabulary limit modal state
  const [showVocabLimitModal, setShowVocabLimitModal] = useState(false);
  const [vocabLimitData, setVocabLimitData] = useState({
    currentCount: 0,
    limit: 5,
    isApproaching: false,
  });

  const vocabularyLimit = isProUser
    ? SUBSCRIPTION_CONFIG.PRO_MAX_VOCABULARY
    : SUBSCRIPTION_CONFIG.FREE_MAX_VOCABULARY;

  // Load vocabulary on mount
  useEffect(() => {
    if (user) {
      loadVocabulary();
    }
  }, [user]);

  const loadVocabulary = async () => {
    setIsLoading(true);
    const { data, error } = await vocabularyService.getVocabulary();

    if (error) {
      Alert.alert(
        "Error",
        ERROR_MESSAGES.VOCABULARY_LOAD_FAILED,
        [{ text: "OK" }]
      );
      console.error("Vocabulary load error:", error);
    } else {
      setVocabulary(data || []);
    }
    setIsLoading(false);
  };

  const handleAddEntry = async () => {
    if (!newTerm.trim()) {
      Alert.alert("Error", ERROR_MESSAGES.TERM_REQUIRED);
      return;
    }

    if (!user) {
      Alert.alert("Error", "Please log in to add vocabulary");
      return;
    }

    // Check vocabulary limit - show blocking modal only when limit is reached
    if (vocabulary.length >= vocabularyLimit) {
      setVocabLimitData({
        currentCount: vocabulary.length,
        limit: vocabularyLimit,
        isApproaching: false,
      });
      setShowVocabLimitModal(true);
      return;
    }
    setIsAdding(true);
    try {
      const { data, error } = await vocabularyService.addVocabularyEntry({
        user_id: user.id,
        term: newTerm.trim(),
        pronunciation: newPronunciation.trim() || null,
        context: newContext.trim() || null,
      });

      if (error) {
        const isDuplicate = error.message?.toLowerCase().includes("duplicate");
        Alert.alert(
          "Error",
          isDuplicate
            ? ERROR_MESSAGES.DUPLICATE_TERM
            : ERROR_MESSAGES.VOCABULARY_ADD_FAILED
        );
      } else if (data) {
        setVocabulary([data, ...vocabulary]);
        setNewTerm("");
        setNewPronunciation("");
        setNewContext("");
        Alert.alert("Success", `"${data.term}" has been added to your vocabulary.`);
      }
    } catch (err) {
      console.error("Add vocabulary error:", err);
      Alert.alert("Error", ERROR_MESSAGES.VOCABULARY_ADD_FAILED);
    } finally {
      setIsAdding(false);
    }
  };

  const handleDeleteEntry = (id: string, term: string) => {
    Alert.alert(
      "Delete Entry",
      `Are you sure you want to delete "${term}"?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            const { error } = await vocabularyService.deleteVocabularyEntry(id);

            if (error) {
              Alert.alert("Error", ERROR_MESSAGES.VOCABULARY_DELETE_FAILED);
            } else {
              setVocabulary(vocabulary.filter((v) => v.id !== id));
              Alert.alert("Success", `"${term}" has been removed.`);
            }
          },
        },
      ]
    );
  };

  const startEditing = (entry: VocabularyEntry) => {
    setEditingId(entry.id);
    setEditTerm(entry.term);
    setEditPronunciation(entry.pronunciation || "");
    setEditContext(entry.context || "");
  };

  const cancelEditing = () => {
    setEditingId(null);
    setEditTerm("");
    setEditPronunciation("");
    setEditContext("");
  };

  const handleUpdateEntry = async (id: string) => {
    if (!editTerm.trim()) {
      Alert.alert("Error", ERROR_MESSAGES.TERM_REQUIRED);
      return;
    }

    const { data, error } = await vocabularyService.updateVocabularyEntry(id, {
      term: editTerm.trim(),
      pronunciation: editPronunciation.trim() || null,
      context: editContext.trim() || null,
    });

    if (error) {
      Alert.alert("Error", ERROR_MESSAGES.VOCABULARY_UPDATE_FAILED);
    } else if (data) {
      setVocabulary(vocabulary.map((v) => (v.id === id ? data : v)));
      cancelEditing();
      Alert.alert("Success", `"${data.term}" has been updated.`);
    }
  };

  return (
    <AppShell showUtilities={true}>
      {/* Vocabulary Limit Modal */}
      <VocabularyLimitModal
        visible={showVocabLimitModal}
        currentCount={vocabLimitData.currentCount}
        limit={vocabLimitData.limit}
        isApproachingLimit={vocabLimitData.isApproaching}
        onClose={() => setShowVocabLimitModal(false)}
        onUpgradePress={() => {
          setShowVocabLimitModal(false);
          navigation.navigate("Pricing");
        }}
      />

      <SafeAreaView style={styles.container}>
        <ScrollView
          style={styles.content}
          contentContainerStyle={styles.contentContainer}
        >
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.title}>Settings</Text>
            <Text style={styles.subtitle}>
              Manage your vocabulary and preferences
            </Text>
          </View>

          {/* Tab Navigation */}
          <View style={styles.tabContainer}>
            <Pressable
              style={[
                styles.tab,
                activeTab === "vocabulary" && styles.activeTab,
              ]}
              onPress={() => setActiveTab("vocabulary")}
            >
              <Icon
                name="book-outline"
                size={16}
                color={activeTab === "vocabulary" ? "#22d3ee" : "#9ca3af"}
                style={styles.tabIcon}
              />
              <Text
                style={[
                  styles.tabText,
                  activeTab === "vocabulary" && styles.activeTabText,
                ]}
              >
                Vocabulary
              </Text>
            </Pressable>

            <Pressable
              style={[styles.tab, activeTab === "billing" && styles.activeTab]}
              onPress={() => setActiveTab("billing")}
            >
              <Icon
                name="card-outline"
                size={16}
                color={activeTab === "billing" ? "#22d3ee" : "#9ca3af"}
                style={styles.tabIcon}
              />
              <Text
                style={[
                  styles.tabText,
                  activeTab === "billing" && styles.activeTabText,
                ]}
              >
                Billing
              </Text>
            </Pressable>
          </View>

          {/* Vocabulary Tab Content */}
          {activeTab === "vocabulary" && (
            <View style={styles.tabContent}>
              <View style={styles.card}>
                <View style={styles.cardHeader}>
                  <View style={styles.cardTitleRow}>
                    <Icon
                      name="book-outline"
                      size={20}
                      color="#06b6d4"
                      style={styles.cardIcon}
                    />
                    <Text style={styles.cardTitle}>Custom Vocabulary</Text>
                  </View>
                  <Text style={styles.entryCount}>
                    {vocabulary.length}/{vocabularyLimit} entries
                  </Text>
                </View>

                <Text style={styles.cardDescription}>
                  Add names, technical terms, or abbreviations that are often
                  misrecognized. These will be used to improve speech-to-text
                  accuracy.
                </Text>

                {/* Add Form */}
                <View style={styles.form}>
                  <View style={styles.formField}>
                    <Text style={styles.fieldLabel}>Term *</Text>
                    <TextInput
                      style={styles.input}
                      placeholder="e.g., Sourav"
                      placeholderTextColor="#6b7280"
                      value={newTerm}
                      onChangeText={setNewTerm}
                      maxLength={100}
                      editable={!isAdding && !isLoading}
                    />
                  </View>

                  <View style={styles.formField}>
                    <Text style={styles.fieldLabel}>Sounds like</Text>
                    <TextInput
                      style={styles.input}
                      placeholder="e.g., Shourabh, Saurav"
                      placeholderTextColor="#6b7280"
                      value={newPronunciation}
                      onChangeText={setNewPronunciation}
                      maxLength={100}
                      editable={!isAdding && !isLoading}
                    />
                  </View>

                  <View style={styles.formField}>
                    <Text style={styles.fieldLabel}>Category</Text>
                    <TextInput
                      style={styles.input}
                      placeholder="e.g., Person, Tech Term"
                      placeholderTextColor="#6b7280"
                      value={newContext}
                      onChangeText={setNewContext}
                      maxLength={50}
                      editable={!isAdding && !isLoading}
                    />
                  </View>

                  <Pressable
                    style={[
                      styles.addButton,
                      (!newTerm.trim() || isAdding) && styles.disabledButton,
                    ]}
                    onPress={handleAddEntry}
                    disabled={!newTerm.trim() || isAdding}
                  >
                    {isAdding ? (
                      <ActivityIndicator color="#ffffff" size="small" />
                    ) : (
                      <>
                        <Icon
                          name="add"
                          size={20}
                          color="#ffffff"
                          style={styles.buttonIcon}
                        />
                        <Text style={styles.addButtonText}>Add Entry</Text>
                      </>
                    )}
                  </Pressable>
                </View>

                {/* Vocabulary List */}
                {isLoading ? (
                  <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color="#06b6d4" />
                  </View>
                ) : vocabulary.length === 0 ? (
                  <View style={styles.emptyState}>
                    <Icon
                      name="book-outline"
                      size={40}
                      color="#4b5563"
                      style={styles.emptyIcon}
                    />
                    <Text style={styles.emptyText}>No custom vocabulary yet</Text>
                    <Text style={styles.emptySubtext}>
                      Start by adding frequently used names or technical terms.
                    </Text>
                  </View>
                ) : (
                  <View style={styles.vocabularyList}>
                    {vocabulary.map((entry) => (
                      <View key={entry.id} style={styles.vocabularyItem}>
                        {editingId === entry.id ? (
                          // Edit mode
                          <View style={styles.editForm}>
                            <TextInput
                              style={styles.editInput}
                              value={editTerm}
                              onChangeText={setEditTerm}
                              placeholder="Term"
                              maxLength={100}
                            />
                            <TextInput
                              style={styles.editInput}
                              value={editPronunciation}
                              onChangeText={setEditPronunciation}
                              placeholder="Sounds like"
                              maxLength={100}
                            />
                            <TextInput
                              style={styles.editInput}
                              value={editContext}
                              onChangeText={setEditContext}
                              placeholder="Category"
                              maxLength={50}
                            />
                            <View style={styles.editButtons}>
                              <Pressable
                                style={styles.saveButton}
                                onPress={() => handleUpdateEntry(entry.id)}
                              >
                                <Icon
                                  name="checkmark"
                                  size={16}
                                  color="#ffffff"
                                />
                                <Text style={styles.editButtonText}>Save</Text>
                              </Pressable>
                              <Pressable
                                style={styles.cancelButton}
                                onPress={cancelEditing}
                              >
                                <Icon
                                  name="close"
                                  size={16}
                                  color="#9ca3af"
                                />
                                <Text style={styles.cancelButtonText}>Cancel</Text>
                              </Pressable>
                            </View>
                          </View>
                        ) : (
                          // Display mode
                          <View style={styles.entryDisplay}>
                            <View style={styles.entryContent}>
                              <View style={styles.entryHeader}>
                                <Text style={styles.entryTerm}>
                                  {entry.term}
                                </Text>
                                {entry.context && (
                                  <View style={styles.categoryBadge}>
                                    <Text style={styles.categoryText}>
                                      {entry.context}
                                    </Text>
                                  </View>
                                )}
                              </View>
                              {entry.pronunciation && (
                                <Text style={styles.entryPronunciation}>
                                  Sounds like: {entry.pronunciation}
                                </Text>
                              )}
                            </View>
                            <View style={styles.entryActions}>
                              <Pressable
                                style={styles.actionButton}
                                onPress={() => startEditing(entry)}
                              >
                                <Icon
                                  name="pencil"
                                  size={16}
                                  color="#9ca3af"
                                />
                              </Pressable>
                              <Pressable
                                style={styles.actionButton}
                                onPress={() =>
                                  handleDeleteEntry(entry.id, entry.term)
                                }
                              >
                                <Icon
                                  name="trash"
                                  size={16}
                                  color="#ef4444"
                                />
                              </Pressable>
                            </View>
                          </View>
                        )}
                      </View>
                    ))}
                  </View>
                )}
              </View>
            </View>
          )}

          {/* Billing Tab Content */}
          {activeTab === "billing" && (
            <View style={styles.tabContent}>
              {/* Current Plan Status Card */}
              <View style={styles.card}>
                <View style={styles.billingHeader}>
                  <View
                    style={[
                      styles.billingIcon,
                      isProUser && styles.proIcon,
                    ]}
                  >
                    <Icon
                      name="crown"
                      size={24}
                      color={isProUser ? "#06b6d4" : "#9ca3af"}
                    />
                  </View>
                  <View style={styles.billingInfo}>
                    <Text
                      style={[
                        styles.billingTitle,
                        isProUser && styles.proTitle,
                      ]}
                    >
                      {isProUser ? "Pro Plan" : "Free Plan"}
                    </Text>
                    <Text
                      style={[
                        styles.billingSubtitle,
                        isProUser && styles.proSubtitle,
                      ]}
                    >
                      {isProUser
                        ? "₹249/month"
                        : "No payment required"}
                    </Text>
                  </View>
                </View>

                {!isProUser && (
                  <Pressable 
                    style={styles.upgradeButton}
                    onPress={() => navigation.navigate("Pricing")}
                  >
                    <Text style={styles.upgradeButtonText}>
                      Upgrade to Pro
                    </Text>
                  </Pressable>
                )}
              </View>

              {/* Usage Section */}
              <View style={styles.card}>
                <View style={styles.cardHeader}>
                  <View style={styles.cardTitleRow}>
                    <Icon
                      name="stats-chart"
                      size={20}
                      color="#06b6d4"
                      style={styles.cardIcon}
                    />
                    <Text style={styles.cardTitle}>Usage</Text>
                  </View>
                </View>

                <View style={styles.usageContainer}>
                  <UsageIndicator
                    type="recordings"
                    current={recordingsThisMonth}
                    limit={recordingsLimit}
                    variant="full"
                  />
                </View>

                <View style={styles.usageContainer}>
                  <UsageIndicator
                    type="notes"
                    current={notesCount}
                    limit={notesLimit}
                    variant="full"
                  />
                </View>

                <View style={styles.usageContainer}>
                  <UsageIndicator
                    type="vocabulary"
                    current={vocabularyCount}
                    limit={subscriptionVocabLimit}
                    variant="full"
                  />
                </View>
              </View>

              {/* Why Upgrade Section (for free users) */}
              {!isProUser && (
                <View style={styles.card}>
                  <Text
                    style={[styles.cardTitle, { marginBottom: 16 }]}
                  >
                    Why Upgrade to Pro?
                  </Text>

                  <View style={styles.benefitsList}>
                    <View style={styles.benefitItem}>
                      <Icon
                        name="checkmark-circle"
                        size={18}
                        color="#06b6d4"
                        style={styles.benefitIcon}
                      />
                      <Text style={styles.benefitText}>
                        Unlimited recordings every month
                      </Text>
                    </View>
                    <View style={styles.benefitItem}>
                      <Icon
                        name="checkmark-circle"
                        size={18}
                        color="#06b6d4"
                        style={styles.benefitIcon}
                      />
                      <Text style={styles.benefitText}>
                        Store unlimited notes forever
                      </Text>
                    </View>
                    <View style={styles.benefitItem}>
                      <Icon
                        name="checkmark-circle"
                        size={18}
                        color="#06b6d4"
                        style={styles.benefitIcon}
                      />
                      <Text style={styles.benefitText}>
                        Unlimited vocabulary entries
                      </Text>
                    </View>
                    <View style={styles.benefitItem}>
                      <Icon
                        name="checkmark-circle"
                        size={18}
                        color="#06b6d4"
                        style={styles.benefitIcon}
                      />
                      <Text style={styles.benefitText}>
                        Priority AI processing
                      </Text>
                    </View>
                    <View style={styles.benefitItem}>
                      <Icon
                        name="checkmark-circle"
                        size={18}
                        color="#06b6d4"
                        style={styles.benefitIcon}
                      />
                      <Text style={styles.benefitText}>
                        Priority customer support
                      </Text>
                    </View>
                  </View>

                  <Pressable 
                    style={styles.upgradeButton}
                    onPress={() => navigation.navigate('Pricing')}
                  >
                    <Text style={styles.upgradeButtonText}>
                      Upgrade Now - Starting at ₹249/month
                    </Text>
                  </Pressable>
                </View>
              )}
            </View>
          )}
        </ScrollView>
      </SafeAreaView>
    </AppShell>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#020617",
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    paddingHorizontal: 16,
    paddingTop: 24,
    paddingBottom: 60,
  },
  header: {
    marginBottom: 32,
    marginTop: 5,
  },
  title: {
    fontSize: 28,
    fontWeight: "700",
    color: "#ffffff",
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: "#9ca3af",
  },
  tabContainer: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 24,
  },
  tab: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: "rgba(51, 65, 85, 0.5)",
    borderWidth: 1,
    borderColor: "rgba(34, 211, 238, 0.2)",
  },
  activeTab: {
    backgroundColor: "#06b6d4",
    borderColor: "#06b6d4",
  },
  tabIcon: {
    marginRight: 8,
  },
  tabText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#9ca3af",
  },
  activeTabText: {
    color: "#ffffff",
  },
  tabContent: {
    marginBottom: 24,
  },
  card: {
    backgroundColor: "rgba(30, 41, 59, 0.8)",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(34, 211, 238, 0.2)",
    padding: 20,
  },
  proCard: {
    backgroundColor: "rgba(30, 41, 59, 1)",
    borderColor: "rgba(6, 182, 212, 0.5)",
    borderWidth: 2,
    marginTop: 16,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  cardTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  cardIcon: {
    marginRight: 4,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#ffffff",
  },
  entryCount: {
    fontSize: 12,
    color: "#9ca3af",
  },
  cardDescription: {
    fontSize: 13,
    color: "#9ca3af",
    marginBottom: 16,
    lineHeight: 18,
  },
  form: {
    marginBottom: 24,
  },
  formField: {
    marginBottom: 12,
  },
  fieldLabel: {
    fontSize: 12,
    color: "#9ca3af",
    marginBottom: 6,
    fontWeight: "500",
  },
  input: {
    backgroundColor: "rgba(15, 23, 42, 0.7)",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "rgba(51, 65, 85, 0.5)",
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: "#ffffff",
    fontSize: 13,
  },
  addButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#06b6d4",
    borderRadius: 8,
    paddingVertical: 10,
    marginTop: 8,
  },
  disabledButton: {
    backgroundColor: "rgba(6, 182, 212, 0.5)",
    opacity: 0.5,
  },
  buttonIcon: {
    marginRight: 6,
  },
  addButtonText: {
    color: "#ffffff",
    fontSize: 13,
    fontWeight: "600",
  },
  loadingContainer: {
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 32,
  },
  emptyState: {
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 40,
    borderTopWidth: 1,
    borderTopColor: "rgba(51, 65, 85, 0.3)",
  },
  emptyIcon: {
    marginBottom: 12,
  },
  emptyText: {
    fontSize: 14,
    color: "#9ca3af",
    marginBottom: 4,
    fontWeight: "500",
  },
  emptySubtext: {
    fontSize: 12,
    color: "#6b7280",
    textAlign: "center",
  },
  vocabularyList: {
    gap: 8,
    borderTopWidth: 1,
    borderTopColor: "rgba(51, 65, 85, 0.3)",
    paddingTop: 16,
  },
  vocabularyItem: {
    backgroundColor: "rgba(15, 23, 42, 0.5)",
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: "rgba(51, 65, 85, 0.5)",
  },
  entryDisplay: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  entryContent: {
    flex: 1,
    marginRight: 12,
  },
  entryHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 4,
    flexWrap: "wrap",
  },
  entryTerm: {
    fontSize: 14,
    color: "#ffffff",
    fontWeight: "500",
  },
  categoryBadge: {
    backgroundColor: "rgba(6, 182, 212, 0.2)",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
  },
  categoryText: {
    fontSize: 11,
    color: "#06b6d4",
  },
  entryPronunciation: {
    fontSize: 12,
    color: "#9ca3af",
    marginTop: 4,
  },
  entryActions: {
    flexDirection: "row",
    gap: 4,
  },
  actionButton: {
    width: 32,
    height: 32,
    borderRadius: 6,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(51, 65, 85, 0.3)",
  },
  editForm: {
    gap: 8,
  },
  editInput: {
    backgroundColor: "rgba(15, 23, 42, 0.7)",
    borderRadius: 6,
    borderWidth: 1,
    borderColor: "rgba(51, 65, 85, 0.5)",
    paddingHorizontal: 10,
    paddingVertical: 8,
    color: "#ffffff",
    fontSize: 12,
  },
  editButtons: {
    flexDirection: "row",
    gap: 8,
  },
  saveButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#06b6d4",
    borderRadius: 6,
    paddingVertical: 8,
  },
  cancelButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(51, 65, 85, 0.3)",
    borderRadius: 6,
    paddingVertical: 8,
  },
  editButtonText: {
    color: "#ffffff",
    fontSize: 12,
    fontWeight: "600",
    marginLeft: 4,
  },
  cancelButtonText: {
    color: "#9ca3af",
    fontSize: 12,
    fontWeight: "600",
    marginLeft: 4,
  },
  billingHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(51, 65, 85, 0.3)",
  },
  billingIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: "rgba(6, 182, 212, 0.1)",
    justifyContent: "center",
    alignItems: "center",
  },
  billingInfo: {
    flex: 1,
  },
  billingTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#ffffff",
  },
  billingSubtitle: {
    fontSize: 13,
    color: "#9ca3af",
    marginTop: 2,
  },
  billingDescription: {
    fontSize: 13,
    color: "#9ca3af",
    marginBottom: 16,
    lineHeight: 18,
  },
  benefitsList: {
    gap: 12,
    marginBottom: 16,
  },
  benefitItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  benefitIcon: {
    marginRight: 4,
  },
  benefitText: {
    fontSize: 13,
    color: "#d1d5db",
    flex: 1,
  },
  upgradeButton: {
    backgroundColor: "#06b6d4",
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  upgradeButtonText: {
    color: "#ffffff",
    fontSize: 14,
    fontWeight: "600",
  },
  featuresList: {
    gap: 10,
    marginBottom: 16,
  },
  featureItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  featureIcon: {
    marginRight: 4,
  },
  featureText: {
    fontSize: 13,
    color: "#9ca3af",
    flex: 1,
  },
  proIcon: {
    backgroundColor: "rgba(6, 182, 212, 0.2)",
  },
  proTitle: {
    color: "#06b6d4",
  },
  proSubtitle: {
    color: "#06b6d4",
  },
  proDescription: {
    color: "#d1d5db",
  },
  usageContainer: {
    marginBottom: 20,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(51, 65, 85, 0.3)",
  },
});
