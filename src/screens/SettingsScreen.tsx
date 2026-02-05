import React, { useState } from "react";
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

type SettingsScreenNavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  "Settings"
>;

interface VocabularyEntry {
  id: string;
  term: string;
  pronunciation?: string;
  context?: string;
}

export default function SettingsScreen() {
  const navigation = useNavigation<SettingsScreenNavigationProp>();
  const [activeTab, setActiveTab] = useState("vocabulary");
  const [vocabulary, setVocabulary] = useState<VocabularyEntry[]>([]);
  const [isLoading, setIsLoading] = useState(false);
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

  const handleAddEntry = async () => {
    if (!newTerm.trim()) {
      Alert.alert("Error", "Please enter a term");
      return;
    }

    setIsAdding(true);
    try {
      // Simulate API call
      const newEntry: VocabularyEntry = {
        id: Date.now().toString(),
        term: newTerm.trim(),
        pronunciation: newPronunciation.trim() || undefined,
        context: newContext.trim() || undefined,
      };

      setVocabulary([newEntry, ...vocabulary]);
      setNewTerm("");
      setNewPronunciation("");
      setNewContext("");

      Alert.alert(
        "Success",
        `"${newEntry.term}" has been added to your vocabulary.`
      );
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
          onPress: () => {
            setVocabulary(vocabulary.filter((v) => v.id !== id));
            Alert.alert("Success", `"${term}" has been removed.`);
          },
          style: "destructive",
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

  const handleUpdateEntry = (id: string) => {
    if (!editTerm.trim()) {
      Alert.alert("Error", "Please enter a term");
      return;
    }

    setVocabulary(
      vocabulary.map((v) =>
        v.id === id
          ? {
              ...v,
              term: editTerm.trim(),
              pronunciation: editPronunciation.trim() || undefined,
              context: editContext.trim() || undefined,
            }
          : v
      )
    );

    cancelEditing();
    Alert.alert("Success", `"${editTerm}" has been updated.`);
  };

  return (
    <AppShell showUtilities={true}>
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
                    {vocabulary.length}/50 entries
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
                      <Icon
                        name="add"
                        size={20}
                        color="#ffffff"
                        style={styles.buttonIcon}
                      />
                    )}
                    <Text style={styles.addButtonText}>
                      {isAdding ? "Adding..." : "Add Entry"}
                    </Text>
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
              {/* Free Plan Card */}
              <View style={styles.card}>
                <View style={styles.billingHeader}>
                  <View style={styles.billingIcon}>
                    <Icon
                      name="crown"
                      size={24}
                      color="#9ca3af"
                    />
                  </View>
                  <View style={styles.billingInfo}>
                    <Text style={styles.billingTitle}>Free Plan</Text>
                    <Text style={styles.billingSubtitle}>
                      Current Plan
                    </Text>
                  </View>
                </View>

                <Text style={styles.billingDescription}>
                  Get started with basic features to record and format your notes.
                </Text>

                <View style={styles.featuresList}>
                  <View style={styles.featureItem}>
                    <Icon
                      name="checkmark-circle"
                      size={18}
                      color="#9ca3af"
                      style={styles.featureIcon}
                    />
                    <Text style={styles.featureText}>
                      5 recordings per month
                    </Text>
                  </View>
                  <View style={styles.featureItem}>
                    <Icon
                      name="checkmark-circle"
                      size={18}
                      color="#9ca3af"
                      style={styles.featureIcon}
                    />
                    <Text style={styles.featureText}>
                      10 notes storage
                    </Text>
                  </View>
                  <View style={styles.featureItem}>
                    <Icon
                      name="checkmark-circle"
                      size={18}
                      color="#9ca3af"
                      style={styles.featureIcon}
                    />
                    <Text style={styles.featureText}>
                      5 vocabulary entries
                    </Text>
                  </View>
                </View>
              </View>

              {/* Pro Plan Card */}
              <View style={[styles.card, styles.proCard]}>
                <View style={styles.billingHeader}>
                  <View style={[styles.billingIcon, styles.proIcon]}>
                    <Icon
                      name="crown"
                      size={24}
                      color="#06b6d4"
                    />
                  </View>
                  <View style={styles.billingInfo}>
                    <Text style={[styles.billingTitle, styles.proTitle]}>Pro Plan</Text>
                    <Text style={[styles.billingSubtitle, styles.proSubtitle]}>
                      ₹299/month or ₹2,999/year
                    </Text>
                  </View>
                </View>

                <Text style={[styles.billingDescription, styles.proDescription]}>
                  Unlock unlimited recordings, notes, and vocabulary entries with priority support.
                </Text>

                <View style={styles.benefitsList}>
                  <View style={styles.benefitItem}>
                    <Icon
                      name="checkmark-circle"
                      size={20}
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
                      size={20}
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
                      size={20}
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
                      size={20}
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
                      size={20}
                      color="#06b6d4"
                      style={styles.benefitIcon}
                    />
                    <Text style={styles.benefitText}>
                      Priority customer support
                    </Text>
                  </View>
                </View>

                <Pressable style={styles.upgradeButton}>
                  <Text style={styles.upgradeButtonText}>
                    Upgrade to Pro
                  </Text>
                </Pressable>
              </View>
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
    marginTop: 100,
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
    backgroundColor: "rgba(6, 182, 212, 0.2)",
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
});
