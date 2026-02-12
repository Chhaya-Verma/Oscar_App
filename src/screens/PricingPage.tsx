import React, { useState, useCallback } from "react";
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
import { PricingCard } from "@/components/subscription/PricingCard";
import { useSubscriptionContext } from "@/context/SubscriptionContext";
import { useAuth } from "@/context/AuthContext";
import { useRazorpayCheckout } from "@/hooks/useRazorpayCheckout";

type PricingPageNavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  "Pricing"
>;

const freeFeatures = [
  "5 recordings per month",
  "10 notes storage",
  "5 vocabulary terms",
  "Basic formatting",
  "Audio transcription",
];

const proFeatures = [
  "Unlimited recordings",
  "Unlimited notes",
  "Unlimited vocabulary",
  "Advanced formatting with AI",
  "Priority processing",
  "Export notes as PDF",
  "Custom vocabulary categories",
  "Weekly progress reports",
];

export default function PricingPage() {
  const navigation = useNavigation<PricingPageNavigationProp>();
  const { user } = useAuth();
  const { tier, status, isProUser } = useSubscriptionContext();
  const [selectedPlan, setSelectedPlan] = useState<"monthly" | "yearly">(
    "monthly"
  );
  const [isProcessing, setIsProcessing] = useState(false);

  const { initiateCheckout, isLoading: checkoutLoading } = useRazorpayCheckout({
    billingCycle: selectedPlan,
    userEmail: user?.email,
    userName: user?.user_metadata?.name || user?.email,
    onSuccess: () => {
      navigation.goBack();
    },
    onError: (error) => {
      Alert.alert("Error", error || "Failed to process payment");
    },
  });

  const handlePlanSelection = useCallback(
    async (planTier: "free" | "pro") => {
      if (!user) {
        Alert.alert("Please log in to upgrade");
        return;
      }

      if (planTier === "free") {
        // Free tier is always available
        navigation.goBack();
        return;
      }

      if (isProUser && status === "active") {
        Alert.alert("Already subscribed", "You already have a Pro subscription");
        return;
      }

      setIsProcessing(true);
      try {
        await initiateCheckout();
      } catch (error) {
        console.error("Plan selection error:", error);
        Alert.alert(
          "Error",
          error instanceof Error
            ? error.message
            : "Failed to process subscription"
        );
      } finally {
        setIsProcessing(false);
      }
    },
    [user, isProUser, status, initiateCheckout, navigation]
  );

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
      paddingHorizontal: 12,
      paddingVertical: 24,
    },
    sectionTitle: {
      fontSize: 28,
      fontWeight: "700",
      color: "#ffffff",
      marginBottom: 8,
      textAlign: "center",
      paddingHorizontal: 16,
    },
    sectionSubtitle: {
      fontSize: 14,
      color: "#94a3b8",
      textAlign: "center",
      marginBottom: 24,
      paddingHorizontal: 16,
    },
    toggleContainer: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      marginBottom: 24,
      gap: 12,
    },
    toggleOption: {
      paddingVertical: 8,
      paddingHorizontal: 16,
      borderRadius: 8,
      backgroundColor: "#1e293b",
      borderWidth: 1,
      borderColor: "#334155",
    },
    toggleOptionActive: {
      backgroundColor: "#06b6d4",
      borderColor: "#06b6d4",
    },
    toggleText: {
      fontSize: 14,
      fontWeight: "600",
      color: "#cbd5e1",
    },
    toggleTextActive: {
      color: "#ffffff",
    },
    savingsBadge: {
      paddingVertical: 4,
      paddingHorizontal: 8,
      backgroundColor: "#10b981",
      borderRadius: 4,
      marginLeft: 8,
    },
    savingsText: {
      fontSize: 12,
      fontWeight: "600",
      color: "#ffffff",
    },
    cardsContainer: {
      gap: 12,
    },
    loadingContainer: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
    },
    footerNote: {
      fontSize: 12,
      color: "#64748b",
      textAlign: "center",
      marginTop: 24,
      paddingHorizontal: 16,
    },
  });

  return (
    <AppShell showUtilities={false} hidePricingButton={true}>
      <ScrollView
        style={styles.content}
        contentContainerStyle={{ paddingBottom: 24 }}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.sectionTitle}>Choose Your Plan</Text>
        <Text style={styles.sectionSubtitle}>
          Upgrade to Pro for unlimited access to all features
        </Text>

        <View style={styles.toggleContainer}>
          <Pressable
            style={[
              styles.toggleOption,
              selectedPlan === "monthly" && styles.toggleOptionActive,
            ]}
            onPress={() => setSelectedPlan("monthly")}
          >
            <Text
              style={[
                styles.toggleText,
                selectedPlan === "monthly" && styles.toggleTextActive,
              ]}
            >
              Monthly
            </Text>
          </Pressable>

          <Pressable
            style={[
              styles.toggleOption,
              selectedPlan === "yearly" && styles.toggleOptionActive,
            ]}
            onPress={() => setSelectedPlan("yearly")}
          >
            <Text
              style={[
                styles.toggleText,
                selectedPlan === "yearly" && styles.toggleTextActive,
              ]}
            >
              Yearly
            </Text>
            <View style={styles.savingsBadge}>
              <Text style={styles.savingsText}>Save 37%</Text>
            </View>
          </Pressable>
        </View>

        <View style={styles.cardsContainer}>
          <PricingCard
            tier="free"
            price={0}
            billingCycle={selectedPlan}
            features={freeFeatures}
            currentTier={tier}
            currentStatus={status}
            onSelect={() => handlePlanSelection("free")}
            isLoading={isProcessing || checkoutLoading}
          />

          <PricingCard
            tier="pro"
            price={selectedPlan === "monthly" ? 399 : 2999}
            billingCycle={selectedPlan}
            features={proFeatures}
            highlighted
            currentTier={tier}
            currentStatus={status}
            onSelect={() => handlePlanSelection("pro")}
            isLoading={isProcessing || checkoutLoading}
          />
        </View>

        <Text style={styles.footerNote}>
          All prices in INR (₹). Cancel anytime. No questions asked.
        </Text>
      </ScrollView>

      {(isProcessing || checkoutLoading) && (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#06b6d4" />
        </View>
      )}
    </AppShell>
  );
}
