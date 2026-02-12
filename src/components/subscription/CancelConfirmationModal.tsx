import React from "react";
import {
  Modal,
  View,
  Text,
  StyleSheet,
  Pressable,
  Alert,
} from "react-native";
import Icon from "react-native-vector-icons/Ionicons";

interface CancelConfirmationModalProps {
  visible: boolean;
  onConfirm: () => void | Promise<void>;
  onCancel: () => void;
  isLoading?: boolean;
}

export function CancelConfirmationModal({
  visible,
  onConfirm,
  onCancel,
  isLoading = false,
}: CancelConfirmationModalProps) {
  const styles = StyleSheet.create({
    overlay: {
      flex: 1,
      backgroundColor: "rgba(0, 0, 0, 0.7)",
      justifyContent: "center",
      alignItems: "center",
      paddingHorizontal: 16,
    },
    modal: {
      backgroundColor: "#1e293b",
      borderRadius: 16,
      padding: 24,
      width: "100%",
      maxWidth: 400,
      borderWidth: 1,
      borderColor: "#334155",
    },
    iconContainer: {
      width: 56,
      height: 56,
      borderRadius: 28,
      backgroundColor: "#fca5a5",
      justifyContent: "center",
      alignItems: "center",
      alignSelf: "center",
      marginBottom: 16,
    },
    title: {
      fontSize: 20,
      fontWeight: "700",
      color: "#ffffff",
      textAlign: "center",
      marginBottom: 8,
    },
    description: {
      fontSize: 14,
      color: "#cbd5e1",
      textAlign: "center",
      marginBottom: 16,
      lineHeight: 20,
    },
    warningText: {
      fontSize: 13,
      color: "#fca5a5",
      backgroundColor: "#7f1d1d",
      paddingHorizontal: 12,
      paddingVertical: 8,
      borderRadius: 6,
      marginBottom: 20,
      overflow: "hidden",
    },
    buttonContainer: {
      flexDirection: "row",
      gap: 12,
    },
    button: {
      flex: 1,
      paddingVertical: 12,
      paddingHorizontal: 16,
      borderRadius: 8,
      alignItems: "center",
      justifyContent: "center",
    },
    buttonCancel: {
      backgroundColor: "#334155",
      borderWidth: 1,
      borderColor: "#475569",
    },
    buttonCancelText: {
      color: "#cbd5e1",
      fontSize: 16,
      fontWeight: "600",
    },
    buttonConfirm: {
      backgroundColor: "#ef4444",
    },
    buttonConfirmText: {
      color: "#ffffff",
      fontSize: 16,
      fontWeight: "600",
    },
    buttonDisabled: {
      opacity: 0.5,
    },
  });

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onCancel}
    >
      <View style={styles.overlay}>
        <View style={styles.modal}>
          <View style={styles.iconContainer}>
            <Icon name="alert-circle" size={32} color="#dc2626" />
          </View>

          <Text style={styles.title}>Cancel Subscription?</Text>

          <Text style={styles.description}>
            You'll lose access to Pro features at the end of your current
            billing period. You can reactivate anytime.
          </Text>

          <Text style={styles.warningText}>
            ⚠️ This action cannot be undone immediately. Your access continues
            until your billing cycle ends.
          </Text>

          <View style={styles.buttonContainer}>
            <Pressable
              style={[styles.button, styles.buttonCancel]}
              onPress={onCancel}
              disabled={isLoading}
            >
              <Text style={styles.buttonCancelText}>Keep Subscription</Text>
            </Pressable>

            <Pressable
              style={[
                styles.button,
                styles.buttonConfirm,
                isLoading && styles.buttonDisabled,
              ]}
              onPress={onConfirm}
              disabled={isLoading}
            >
              <Text style={styles.buttonConfirmText}>
                {isLoading ? "Cancelling..." : "Cancel Now"}
              </Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}
