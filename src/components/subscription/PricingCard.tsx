"use client";

import React from "react";
import { TouchableOpacity, Text, View, StyleSheet } from "react-native";
import Icon from "react-native-vector-icons/Ionicons";

interface PricingCardProps {
  tier: "free" | "pro";
  price: number;
  billingCycle?: "monthly" | "yearly";
  features: string[];
  highlighted?: boolean;
  currentTier: "free" | "pro";
  currentStatus?: string;
  onSelect: () => void;
  isLoading?: boolean;
}

export function PricingCard({
  tier,
  price,
  billingCycle = "monthly",
  features,
  highlighted = false,
  currentTier,
  currentStatus = "active",
  onSelect,
  isLoading = false,
}: PricingCardProps) {
  const isCurrentPlan = currentTier === tier && currentStatus === "active";
  const isCancelled = currentTier === tier && currentStatus === "cancelled";

  const styles = StyleSheet.create({
    container: {
      borderRadius: 16,
      padding: 24,
      marginHorizontal: 12,
      marginVertical: 8,
      backgroundColor: highlighted ? "#0f172a" : "#1e293b",
      borderWidth: 2,
      borderColor: highlighted ? "#06b6d4" : "#334155",
    },
    header: {
      marginBottom: 16,
    },
    tierName: {
      fontSize: 24,
      fontWeight: "700",
      color: "#ffffff",
      marginBottom: 8,
    },
    priceContainer: {
      flexDirection: "row",
      alignItems: "baseline",
      marginBottom: 4,
    },
    price: {
      fontSize: 32,
      fontWeight: "700",
      color: highlighted ? "#06b6d4" : "#ffffff",
    },
    currency: {
      fontSize: 20,
      color: "#94a3b8",
      marginRight: 4,
    },
    period: {
      fontSize: 14,
      color: "#94a3b8",
      marginLeft: 4,
    },
    description: {
      fontSize: 14,
      color: "#cbd5e1",
      marginTop: 8,
    },
    button: {
      paddingVertical: 12,
      paddingHorizontal: 16,
      borderRadius: 8,
      marginVertical: 16,
      alignItems: "center",
      justifyContent: "center",
    },
    buttonText: {
      fontSize: 16,
      fontWeight: "600",
    },
    buttonPrimary: {
      backgroundColor: "#06b6d4",
    },
    buttonPrimaryText: {
      color: "#ffffff",
    },
    buttonSecondary: {
      backgroundColor: "#334155",
    },
    buttonSecondaryText: {
      color: "#cbd5e1",
    },
    buttonDisabled: {
      backgroundColor: "#1e293b",
      opacity: 0.5,
    },
    featuresContainer: {
      marginTop: 16,
    },
    featureItem: {
      flexDirection: "row",
      alignItems: "center",
      marginVertical: 8,
    },
    featureIcon: {
      width: 20,
      height: 20,
      marginRight: 12,
    },
    featureText: {
      fontSize: 14,
      color: "#cbd5e1",
      flex: 1,
    },
    badge: {
      paddingVertical: 4,
      paddingHorizontal: 8,
      borderRadius: 4,
      marginTop: 8,
    },
    badgeText: {
      fontSize: 12,
      fontWeight: "600",
    },
  });

  const getButtonText = () => {
    if (isCurrentPlan) return "Current Plan";
    if (isCancelled) return "Reactivate";
    if (tier === "free") return "Get Started";
    return "Upgrade to Pro";
  };

  const getButtonStyle = () => {
    if (isCurrentPlan || isCancelled) return styles.buttonSecondary;
    if (tier === "pro") return styles.buttonPrimary;
    return styles.buttonSecondary;
  };

  const getButtonTextStyle = () => {
    if (isCurrentPlan || isCancelled) return styles.buttonSecondaryText;
    if (tier === "pro") return styles.buttonPrimaryText;
    return styles.buttonSecondaryText;
  };

  return (
    <View style={[styles.container, highlighted && { borderColor: "#06b6d4" }]}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.tierName}>{tier === "free" ? "FREE" : "PRO"}</Text>

        <View style={styles.priceContainer}>
          <Text style={styles.currency}>₹</Text>
          <Text style={styles.price}>{price}</Text>
          {price > 0 && (
            <Text style={styles.period}>/{billingCycle === "monthly" ? "month" : "year"}</Text>
          )}
        </View>

        {price === 0 && (
          <Text style={styles.description}>Forever free</Text>
        )}
      </View>

      {/* Button */}
      <TouchableOpacity
        style={[styles.button, getButtonStyle()]}
        onPress={onSelect}
        disabled={isCurrentPlan || isLoading}
      >
        <Text style={[styles.buttonText, getButtonTextStyle()]}>
          {isLoading ? "Processing..." : getButtonText()}
        </Text>
      </TouchableOpacity>

      {isCurrentPlan && (
        <View style={[styles.badge, { backgroundColor: "rgba(16, 185, 129, 0.1)" }]}>
          <Text style={[styles.badgeText, { color: "#10b981" }]}>✓ Current Plan</Text>
        </View>
      )}

      {/* Features */}
      <View style={styles.featuresContainer}>
        {features.map((feature, index) => (
          <View key={index} style={styles.featureItem}>
            <Icon
              name="checkmark-circle"
              size={20}
              color="#06b6d4"
              style={styles.featureIcon}
            />
            <Text style={styles.featureText}>{feature}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}
