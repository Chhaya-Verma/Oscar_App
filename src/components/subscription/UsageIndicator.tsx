import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { useSubscriptionContext } from "@/context/SubscriptionContext";

export function UsageIndicator() {
  const {
    isProUser,
    tier,
    recordingsThisMonth,
    recordingsLimit,
    remainingRecordings,
    isLoading,
  } = useSubscriptionContext();

  if (isLoading) {
    return null;
  }

  const styles = StyleSheet.create({
    container: {
      paddingHorizontal: 16,
      paddingVertical: 12,
      backgroundColor: "#1e293b",
      borderRadius: 8,
      marginBottom: 12,
    },
    header: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: 8,
    },
    title: {
      fontSize: 14,
      fontWeight: "600",
      color: "#cbd5e1",
    },
    badge: {
      paddingHorizontal: 8,
      paddingVertical: 4,
      backgroundColor: isProUser ? "#06b6d4" : "#334155",
      borderRadius: 4,
    },
    badgeText: {
      fontSize: 12,
      fontWeight: "600",
      color: isProUser ? "#ffffff" : "#cbd5e1",
    },
    usageText: {
      fontSize: 13,
      color: "#94a3b8",
      marginBottom: 4,
    },
    barContainer: {
      height: 6,
      backgroundColor: "#0f172a",
      borderRadius: 3,
      overflow: "hidden",
    },
    barFill: {
      height: "100%",
      backgroundColor: isProUser ? "#06b6d4" : "#10b981",
      borderRadius: 3,
    },
    footerText: {
      fontSize: 12,
      color: "#64748b",
      marginTop: 6,
    },
  });

  if (isProUser) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Recordings This Month</Text>
          <View style={styles.badge}>
            <Text style={styles.badgeText}>PRO</Text>
          </View>
        </View>
        <Text style={styles.usageText}>
          Unlimited recordings • No limits
        </Text>
        <View style={styles.barContainer}>
          <View style={[styles.barFill, { width: "100%" }]} />
        </View>
      </View>
    );
  }

  const percentage = recordingsLimit
    ? (recordingsThisMonth / recordingsLimit) * 100
    : 0;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Recordings This Month</Text>
        <View style={styles.badge}>
          <Text style={styles.badgeText}>FREE</Text>
        </View>
      </View>
      <Text style={styles.usageText}>
        {recordingsThisMonth} of {recordingsLimit} used
      </Text>
      <View style={styles.barContainer}>
        <View style={[styles.barFill, { width: `${percentage}%` }]} />
      </View>
      {remainingRecordings !== null && (
        <Text style={styles.footerText}>
          {remainingRecordings} recording{remainingRecordings !== 1 ? "s" : ""}{" "}
          remaining
        </Text>
      )}
    </View>
  );
}
