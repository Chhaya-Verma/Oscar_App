import React from 'react';
import { View, TouchableOpacity, StyleSheet, Text, Alert } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/Ionicons';
import { useAuth } from '@/context/AuthContext';

interface AppShellProps {
  children: React.ReactNode;
  showUtilities?: boolean;
}

const AppShell: React.FC<AppShellProps> = ({ children, showUtilities = true }) => {
  const navigation = useNavigation();
  const { signOut } = useAuth();

  const handleLogout = async () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', onPress: () => {}, style: 'cancel' },
        {
          text: 'Logout',
          onPress: async () => {
            await signOut();
            navigation.navigate('Landing' as never);
          },
          style: 'destructive',
        },
      ]
    );
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          onPress={() => navigation.navigate('Landing' as never)}
          style={styles.headerContent}
        >
          <View style={styles.brandRow}>
            <Icon name="mic-outline" size={24} color="#22d3ee" />
            <Text style={styles.brandText}>OSCAR</Text>
          </View>
        </TouchableOpacity>
      </View>

      {/* Main Content */}
      <View style={styles.content}>
        {children}
      </View>

      {/* Utility Buttons - Right Sidebar */}
      {showUtilities && (
        <View style={styles.utilities}>
          <TouchableOpacity 
            style={styles.utilityBtn} 
            activeOpacity={0.8}
            onPress={() => navigation.navigate('Notes' as never)}
          >
            <Icon name="document-outline" size={20} color="#22d3ee" />
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.utilityBtn}
            activeOpacity={0.8}
          >
            <Icon name="settings-outline" size={20} color="#22d3ee" />
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.utilityBtn} 
            activeOpacity={0.8}
            onPress={handleLogout}
          >
            <Icon name="log-out-outline" size={20} color="#ef4444" />
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#020617',
  },
  header: {
    position: 'absolute',
    top: 60,
    left: 24,
    zIndex: 10,
  },
  headerContent: {
    padding: 8,
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  brandText: {
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: 1.5,
    color: '#ffffff',
    opacity: 0.9,
  },
  content: {
    flex: 1,
  },
  utilities: {
    position: 'absolute',
    bottom: 60,
    right: 24,
    flexDirection: 'column',
    gap: 16,
    zIndex: 10,
  },
  utilityBtn: {
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 1.5,
    borderColor: 'rgba(34, 211, 238, 0.4)',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(15, 23, 42, 0.8)',
    shadowColor: '#22d3ee',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 5,
  },
});

export default AppShell;
