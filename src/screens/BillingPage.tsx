import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Alert,
  ActivityIndicator,
  Pressable,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type { RootStackParamList } from "@/types/navigation";
import Icon from "react-native-vector-icons/Ionicons";
import AppShell from "@/components/AppShell";
import { useSubscriptionContext } from "@/context/SubscriptionContext";
import { useAuth } from "@/context/AuthContext";
import { API_CONFIG } from "@/constants/index";
import { supabase } from "@/lib/supabase/client";
import { CancelConfirmationModal } from "@/components/subscription";

type BillingPageNavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  "Billing"
>;

export default function BillingPage() {
  const navigation = useNavigation<BillingPageNavigationProp>();
  const { user } = useAuth();
  const {
    tier,
    status,
    billingCycle,
    currentPeriodEnd,
    isProUser,
    refetch,
  } = useSubscriptionContext();
  const [isLoading, setIsLoading] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: "#000000",
    },
    header: {
      paddingHorizontal: 16,
      paddingVertical: 12,
      backgroundColor: "#1a1a1a",
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      borderBottomWidth: 1,
      borderBottomColor: "#333333",
    },
    headerTitle: {
      fontSize: 24,
      fontWeight: "700",
      color: "#ffffff",
    },
    closeButton: {
      padding: 8,
    },
    content: {
      flex: 1,
      paddingHorizontal: 16,
      paddingVertical: 24,
    },
    card: {
      backgroundColor: "#1e293b",
      borderRadius: 12,
      padding: 16,
      marginBottom: 16,
      borderWidth: 1,
      borderColor: "#334155",
    },
    cardTitle: {
      fontSize: 16,
      fontWeight: "700",
      color: "#ffffff",
      marginBottom: 12,
    },
    cardRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      paddingVertical: 8,
      borderBottomWidth: 1,
      borderBottomColor: "#334155",
    },
    cardRowLast: {
      borderBottomWidth: 0,
    },
    label: {
      fontSize: 14,
      color: "#94a3b8",
    },
    value: {
      fontSize: 14,
      fontWeight: "600",
      color: "#cbd5e1",
    },
    badge: {
      paddingHorizontal: 12,
      paddingVertical: 4,
      borderRadius: 12,
      backgroundColor: "#06b6d4",
    },
    badgeText: {
      fontSize: 12,
      fontWeight: "600",
      color: "#ffffff",
    },
    button: {
      paddingVertical: 12,
      paddingHorizontal: 16,
      borderRadius: 8,
      alignItems: "center",
      justifyContent: "center",
      marginTop: 16,
    },
    buttonPrimary: {
      backgroundColor: "#06b6d4",
    },
    buttonPrimaryText: {
      color: "#ffffff",
      fontSize: 16,
      fontWeight: "600",
    },
    buttonDanger: {
      backgroundColor: "#ef4444",
    },
    buttonDangerText: {
      color: "#ffffff",
      fontSize: 16,
      fontWeight: "600",
    },
    buttonDisabled: {
      backgroundColor: "#334155",
      opacity: 0.5,
    },
    buttonDisabledText: {
      color: "#94a3b8",
    },
    emptyStateContainer: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
      paddingHorizontal: 16,
    },
    emptyStateIcon: {
      marginBottom: 16,
    },
    emptyStateTitle: {
      fontSize: 18,
      fontWeight: "700",
      color: "#ffffff",
      marginBottom: 8,
    },
    emptyStateText: {
      fontSize: 14,
      color: "#94a3b8",
      textAlign: "center",
      marginBottom: 24,
    },
    sectionTitle: {
      fontSize: 18,
      fontWeight: "700",
      color: "#ffffff",
      marginBottom: 12,
    },
    section: {
      marginBottom: 24,
    },
  });

  if (!isProUser) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Billing</Text>
          <Icon.Button
            name="close"
            size={24}
            color="#ffffff"
            backgroundColor="transparent"
            onPress={() => navigation.goBack()}
            style={styles.closeButton}
          />
        </View>

        <View style={styles.emptyStateContainer}>
          <Icon
            name="card-outline"
            size={48}
            color="#94a3b8"
            style={styles.emptyStateIcon}
          />
          <Text style={styles.emptyStateTitle}>No Active Subscription</Text>
          <Text style={styles.emptyStateText}>
            You're currently on the free plan. Upgrade to Pro to unlock
            unlimited features.
          </Text>
          <Pressable
            style={styles.button}
            onPress={() => {
              navigation.goBack();
              // Navigate to Pricing after going back
              navigation.navigate("Pricing" as any);
            }}
          >
            <Text style={styles.buttonPrimaryText}>Upgrade to Pro</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString("en-IN", {
        year: "numeric",
        month: "long",
        day: "numeric",
      });
    } catch {
      return dateString;
    }
  };

  const handleCancelSubscription = async () => {
    setShowCancelModal(true);
  };

  const confirmCancelSubscription = async () => {
    setShowCancelModal(false);
    setIsLoading(true);

    try {
      // Get auth token
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;

      const response = await fetch(API_CONFIG.RAZORPAY_CANCEL, {
        method: "POST",
        headers: {
          ...(token && { Authorization: `Bearer ${token}` }),
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        if (response.status === 401) {
          console.error("Backend rejected token");
          throw new Error("Backend authentication failed");
        }
        throw new Error(errorData.error || "Failed to cancel subscription");
      }

      Alert.alert(
        "Subscription Cancelled",
        "Your Pro subscription has been cancelled. You'll have access until the end of your billing period."
      );

      // Refresh subscription data
      await refetch();
      navigation.goBack();
    } catch (error) {
      console.error("Cancel subscription error:", error);
      Alert.alert(
        "Error",
        error instanceof Error
          ? error.message
          : "Failed to cancel subscription"
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AppShell showUtilities={false} hidePricingButton={true}>
      <ScrollView
        style={styles.content}
        contentContainerStyle={{ paddingBottom: 24 }}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Subscription Details</Text>

          <View style={styles.card}>
            <Text style={styles.cardTitle}>Current Plan</Text>

            <View style={[styles.cardRow, styles.cardRowLast]}>
              <Text style={styles.label}>Plan Type</Text>
              <View style={styles.badge}>
                <Text style={styles.badgeText}>
                  {tier === "pro" ? "PRO" : "FREE"}
                </Text>
              </View>
            </View>

            <View style={[styles.cardRow, styles.cardRowLast]}>
              <Text style={styles.label}>Status</Text>
              <Text style={styles.value}>
                {status.charAt(0).toUpperCase() + status.slice(1)}
              </Text>
            </View>

            <View style={[styles.cardRow, styles.cardRowLast]}>
              <Text style={styles.label}>Billing Cycle</Text>
              <Text style={styles.value}>
                {billingCycle === "monthly" ? "Monthly" : "Yearly"}
              </Text>
            </View>

            {currentPeriodEnd && (
              <View style={[styles.cardRow, styles.cardRowLast]}>
                <Text style={styles.label}>Renewal Date</Text>
                <Text style={styles.value}>{formatDate(currentPeriodEnd)}</Text>
              </View>
            )}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Payment Method</Text>

          <View style={styles.card}>
            <View style={[styles.cardRow, styles.cardRowLast]}>
              <Text style={styles.label}>Email</Text>
              <Text style={styles.value}>{user?.email}</Text>
            </View>
          </View>
        </View>

        {status === "active" && (
          <Pressable
            style={[
              styles.button,
              styles.buttonDanger,
              isLoading && styles.buttonDisabled,
            ]}
            onPress={handleCancelSubscription}
            disabled={isLoading}
          >
            <Text
              style={[
                styles.buttonDangerText,
                isLoading && styles.buttonDisabledText,
              ]}
            >
              {isLoading ? "Cancelling..." : "Cancel Subscription"}
            </Text>
          </Pressable>
        )}
      </ScrollView>

      <CancelConfirmationModal
        visible={showCancelModal}
        onConfirm={confirmCancelSubscription}
        onCancel={() => setShowCancelModal(false)}
        isLoading={isLoading}
      />
    </AppShell>
  );
}
