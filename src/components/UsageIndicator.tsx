import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

interface UsageIndicatorProps {
  type: 'recordings' | 'notes' | 'vocabulary';
  current: number;
  limit: number | null;
  variant?: 'compact' | 'full';
}

export function UsageIndicator({
  type,
  current,
  limit,
  variant = 'compact',
}: UsageIndicatorProps) {
  // Get label for the type
  const getTypeLabel = () => {
    switch (type) {
      case 'recordings':
        return 'Recordings this month';
      case 'notes':
        return 'Total notes';
      case 'vocabulary':
        return 'Vocabulary entries';
    }
  };

  // Unlimited (pro user)
  if (limit === null) {
    return (
      <View style={styles.container}>
        <Text style={styles.unlimitedBadgeLabel}>Unlimited</Text>
        {variant === 'full' && (
          <Text style={styles.unlimitedText}>
            {current}{' '}
            {type === 'recordings'
              ? 'recordings'
              : type === 'notes'
              ? 'notes'
              : 'vocabulary entries'}{' '}
            {type === 'recordings' ? 'this month' : 'total'}
          </Text>
        )}
      </View>
    );
  }

  const percentage = Math.min(100, (current / limit) * 100);
  const remaining = Math.max(0, limit - current);

  // Get colors based on usage
  const getColor = () => {
    if (percentage >= 100) return '#ef4444'; // red-500
    if (percentage >= 80) return '#eab308'; // yellow-500
    return '#00d9ff'; // cyan-500
  };

  const getTextColor = () => {
    if (percentage >= 100) return '#f87171'; // red-400
    if (percentage >= 80) return '#facc15'; // yellow-400
    return '#e5e7eb'; // gray-300
  };

  if (variant === 'compact') {
    return (
      <View style={styles.compactContainer}>
        <Text style={[styles.compactText, { color: getTextColor() }]}>
          {current} / {limit}
        </Text>
        <View style={styles.compactBar}>
          <View
            style={[
              styles.compactBarFill,
              { width: `${percentage}%`, backgroundColor: getColor() },
            ]}
          />
        </View>
      </View>
    );
  }

  // Full variant
  return (
    <View style={styles.fullContainer}>
      <View style={styles.fullHeader}>
        <Text style={styles.fullLabel}>{getTypeLabel()}</Text>
        <Text style={[styles.fullValue, { color: getTextColor() }]}>
          {current} / {limit}
        </Text>
      </View>
      <View style={styles.fullBar}>
        <View
          style={[
            styles.fullBarFill,
            { width: `${percentage}%`, backgroundColor: getColor() },
          ]}
        />
      </View>
      <Text style={styles.fullHelper}>
        {remaining === 0
          ? `Limit reached. Upgrade to Pro for unlimited ${type}.`
          : `${remaining} ${type} remaining`}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  compactContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  fullContainer: {
    gap: 8,
  },
  unlimitedBadgeLabel: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    fontSize: 12,
    fontWeight: '600',
    color: '#22d3ee',
    backgroundColor: 'rgba(34, 211, 238, 0.2)',
    borderRadius: 12,
    overflow: 'hidden',
  },
  unlimitedText: {
    fontSize: 14,
    color: '#9ca3af',
  },
  compactText: {
    fontSize: 14,
    fontWeight: '600',
  },
  compactBar: {
    width: 64,
    height: 6,
    backgroundColor: '#374151',
    borderRadius: 3,
    overflow: 'hidden',
  },
  compactBarFill: {
    height: '100%',
    borderRadius: 3,
  },
  fullHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  fullLabel: {
    fontSize: 14,
    color: '#9ca3af',
  },
  fullValue: {
    fontSize: 14,
    fontWeight: '600',
  },
  fullBar: {
    width: '100%',
    height: 8,
    backgroundColor: '#374151',
    borderRadius: 4,
    overflow: 'hidden',
  },
  fullBarFill: {
    height: '100%',
    borderRadius: 4,
  },
  fullHelper: {
    fontSize: 12,
    color: '#6b7280',
  },
});
