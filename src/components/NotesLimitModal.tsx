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

interface NotesLimitModalProps {
  visible: boolean;
  currentCount: number;
  limit: number;
  onClose: () => void;
  onUpgradePress: () => void;
  isApproachingLimit?: boolean; // True if near limit
}

export const NotesLimitModal: React.FC<NotesLimitModalProps> = ({
  visible,
  currentCount,
  limit,
  onClose,
  onUpgradePress,
  isApproachingLimit = false,
}) => {
  const remainingNotes = Math.max(0, limit - currentCount);
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
              {isApproachingLimit ? 'Notes Limit Nearly Full' : 'Notes Limit Reached'}
            </Text>

            {/* Current Usage Info */}
            <View style={styles.usageContainer}>
              <Text style={styles.usageText}>
                {isApproachingLimit
                  ? `You have ${remainingNotes} note${remainingNotes === 1 ? '' : 's'} left`
                  : `You've saved all ${limit} notes`}
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
                {currentCount} / {limit} notes saved
              </Text>
            </View>

            {/* Pro Features */}
            <View style={styles.featuresContainer}>
              <Text style={styles.featureTitle}>With Pro you get:</Text>

              {[
                { icon: 'document-text', text: 'Unlimited notes' },
                { icon: 'infinite', text: 'Unlimited recordings' },
                { icon: 'bookmark', text: 'Unlimited vocabulary' },
                { icon: 'cloud-done', text: 'Cloud sync & backup' },
              ].map((feature, index) => (
                <View key={index} style={styles.featureRow}>
                  <Icon
                    name={feature.icon as any}
                    size={20}
                    color="#10b981"
                    style={styles.featureIcon}
                  />
                  <Text style={styles.featureText}>{feature.text}</Text>
                </View>
              ))}
            </View>

            {/* Price */}
            <View style={styles.priceContainer}>
              <Text style={styles.priceText}>Starting at just</Text>
              <Text style={styles.priceAmount}>₹399/month</Text>
            </View>

            {/* Buttons */}
            <View style={styles.buttonContainer}>
              <Pressable
                style={styles.laterButton}
                onPress={onClose}
              >
                <Text style={styles.laterButtonText}>Maybe Later</Text>
              </Pressable>

              <Pressable
                style={styles.upgradeButton}
                onPress={onUpgradePress}
              >
                <Icon
                  name="star"
                  size={18}
                  color="#fff"
                  style={{ marginRight: 8 }}
                />
                <Text style={styles.upgradeButtonText}>Upgrade to Pro</Text>
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

  iconContainer: {
    marginBottom: 24,
  },

  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 16,
    textAlign: 'center',
  },

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
    backgroundColor: '#ef4444',
    borderRadius: 4,
  },
  usageStats: {
    fontSize: 13,
    color: '#9ca3af',
    textAlign: 'center',
  },

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

  priceContainer: {
    marginBottom: 24,
  },
  priceText: {
    fontSize: 14,
    color: '#9ca3af',
    textAlign: 'center',
    marginBottom: 4,
  },
  priceAmount: {
    fontSize: 28,
    fontWeight: '700',
    color: '#22d3ee',
    textAlign: 'center',
  },

  buttonContainer: {
    width: '100%',
    gap: 12,
  },
  laterButton: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(156, 163, 175, 0.3)',
    backgroundColor: 'rgba(156, 163, 175, 0.05)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  laterButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#9ca3af',
  },
  upgradeButton: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    backgroundColor: '#22d3ee',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  upgradeButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#000',
  },
});
