import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  Pressable,
  ScrollView,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';

interface VocabularyLimitModalProps {
  visible: boolean;
  currentCount: number;
  limit: number;
  onClose: () => void;
  onUpgradePress: () => void;
  isApproachingLimit?: boolean; // True if near limit
}

export const VocabularyLimitModal: React.FC<VocabularyLimitModalProps> = ({
  visible,
  currentCount,
  limit,
  onClose,
  onUpgradePress,
  isApproachingLimit = false,
}) => {
  const remainingEntries = Math.max(0, limit - currentCount);
  const percentageUsed = Math.round((currentCount / limit) * 100);

  return (
    <Modal
      visible={visible}
      animationType="fade"
      transparent={true}
      onRequestClose={onClose}
    >
      {/* Backdrop */}
      <Pressable style={styles.backdrop} onPress={onClose} />

      {/* Modal Content */}
      <View style={styles.centeredView}>
        <View style={styles.modalView}>
          <ScrollView
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            {/* Icon */}
            <View style={styles.iconContainer}>
              {isApproachingLimit ? (
                <Icon name="warning" size={64} color="#f59e0b" />
              ) : (
                <Icon name="lock-closed" size={64} color="#ef4444" />
              )}
            </View>

            {/* Title */}
            <Text style={styles.title}>
              {isApproachingLimit ? 'Vocabulary Limit Nearly Full' : 'Vocabulary Limit Reached'}
            </Text>

            {/* Current Usage Info */}
            <View style={styles.usageContainer}>
              <Text style={styles.usageText}>
                {isApproachingLimit
                  ? `You have ${remainingEntries} ${remainingEntries === 1 ? 'entry' : 'entries'} left`
                  : `You've saved all ${limit} vocabulary entries`}
              </Text>

              {/* Progress Bar */}
              <View style={styles.progressBarContainer}>
                <View
                  style={[
                    styles.progressBar,
                    {
                      width: `${Math.min(percentageUsed, 100)}%`,
                      backgroundColor: isApproachingLimit ? '#f59e0b' : '#ef4444',
                    },
                  ]}
                />
              </View>

              {/* Usage Stats */}
              <Text style={styles.usageStats}>
                {currentCount} / {limit} vocabulary entries
              </Text>
            </View>

            {/* Pro Features */}
            <View style={styles.featuresContainer}>
              <Text style={styles.featureTitle}>With Pro you get:</Text>

              {[
                { icon: 'bookmark', text: 'Unlimited vocabulary entries' },
                { icon: 'document-text', text: 'Unlimited notes' },
                { icon: 'infinite', text: 'Unlimited recordings' },
                { icon: 'flash', text: 'Priority AI processing' },
              ].map((feature, index) => (
                <View key={index} style={styles.featureRow}>
                  <Icon
                    name={feature.icon}
                    size={18}
                    color="#22d3ee"
                    style={styles.featureIcon}
                  />
                  <Text style={styles.featureText}>{feature.text}</Text>
                </View>
              ))}
            </View>

            {/* Description */}
            <Text style={styles.description}>
              {isApproachingLimit
                ? 'You\'re getting close to your vocabulary limit. Consider upgrading to Pro for unlimited entries.'
                : 'Reach unlimited vocabulary entries with a Pro subscription.'}
            </Text>

            {/* Buttons */}
            <View style={styles.buttonContainer}>
              <Pressable
                style={[styles.button, styles.secondaryButton]}
                onPress={onClose}
              >
                <Text style={styles.secondaryButtonText}>
                  {isApproachingLimit ? 'Continue' : 'Close'}
                </Text>
              </Pressable>

              <Pressable
                style={[styles.button, styles.primaryButton]}
                onPress={onUpgradePress}
              >
                <Icon
                  name="star"
                  size={16}
                  color="#000"
                  style={styles.upgradeIcon}
                />
                <Text style={styles.primaryButtonText}>Upgrade to Pro</Text>
              </Pressable>
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
  },
  centeredView: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  modalView: {
    width: '100%',
    maxWidth: 400,
    backgroundColor: '#0f172a',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(34, 211, 238, 0.2)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 10,
    overflow: 'hidden',
  },
  scrollContent: {
    padding: 24,
    alignItems: 'center',
  },

  // Icon
  iconContainer: {
    marginBottom: 24,
  },

  // Title
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 16,
    textAlign: 'center',
  },

  // Usage Container
  usageContainer: {
    width: '100%',
    marginBottom: 24,
  },
  usageText: {
    fontSize: 15,
    color: '#d1d5db',
    textAlign: 'center',
    marginBottom: 16,
    lineHeight: 22,
  },
  progressBarContainer: {
    width: '100%',
    height: 8,
    backgroundColor: 'rgba(34, 211, 238, 0.1)',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 12,
  },
  progressBar: {
    height: '100%',
    borderRadius: 4,
  },
  usageStats: {
    fontSize: 13,
    color: '#9ca3af',
    textAlign: 'center',
  },

  // Features Container
  featuresContainer: {
    width: '100%',
    backgroundColor: 'rgba(34, 211, 238, 0.05)',
    borderRadius: 16,
    padding: 16,
    marginBottom: 24,
  },
  featureTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#22d3ee',
    marginBottom: 12,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  featureIcon: {
    marginRight: 12,
  },
  featureText: {
    fontSize: 14,
    color: '#e5e7eb',
    flex: 1,
  },

  // Description
  description: {
    fontSize: 14,
    color: '#d1d5db',
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 20,
  },

  // Buttons
  buttonContainer: {
    width: '100%',
    gap: 12,
  },
  button: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryButton: {
    backgroundColor: '#22d3ee',
  },
  primaryButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#000',
  },
  upgradeIcon: {
    marginRight: 8,
  },
  secondaryButton: {
    backgroundColor: 'rgba(156, 163, 175, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(156, 163, 175, 0.3)',
  },
  secondaryButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#9ca3af',
  },
});
