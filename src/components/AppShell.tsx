import React from 'react';
import { View, TouchableOpacity, StyleSheet, Text, Alert } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/Ionicons';
import { useAuth } from '@/context/AuthContext';
import { useSubscriptionContext } from '@/context/SubscriptionContext';

interface AppShellProps {
  children: React.ReactNode;
  showUtilities?: boolean;
  hidePricingButton?: boolean;
}

const AppShell: React.FC<AppShellProps> = ({ children, showUtilities = true, hidePricingButton = false }) => {
  const navigation = useNavigation<any>();
  const { signOut } = useAuth();
  const { isProUser, status } = useSubscriptionContext();

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
        <View style={styles.headerContent}>
          <TouchableOpacity 
            onPress={() => navigation.navigate('Landing' as never)}
          >
            <View style={styles.brandRow}>
              <Icon name="mic-outline" size={24} color="#22d3ee" />
              <Text style={styles.brandText}>OSCAR</Text>
            </View>
          </TouchableOpacity>
          
          {isProUser && status === "active" && (
            <View style={styles.proBadge}>
              <Icon name="crown" size={12} color="#ffffff" />
              <Text style={styles.proBadgeText}>PRO</Text>
            </View>
          )}
        </View>
        
        {!hidePricingButton && (
          <TouchableOpacity
            style={styles.pricingBtn}
            onPress={() => {
              const route = isProUser && status === "active" ? "Billing" : "Pricing";
              navigation.navigate(route as any);
            }}
          >
            <Icon name="card-outline" size={20} color="#22d3ee" />
          </TouchableOpacity>
        )}
      </View>

      {/* Main Content */}
      <View style={styles.content}>
        {children}
      </View>

      {/* Utility Buttons - Bottom Navigation */}
      {showUtilities && (
        <View style={styles.bottomNav}>
          <TouchableOpacity 
            style={styles.navBtn} 
            activeOpacity={0.8}
            onPress={() => navigation.navigate('Landing' as never)}
          >
            <Icon name="home-outline" size={24} color="#22d3ee" />
            <Text style={styles.navBtnText}>Home</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.navBtn} 
            activeOpacity={0.8}
            onPress={() => navigation.navigate('Notes' as never)}
          >
            <Icon name="document-outline" size={24} color="#22d3ee" />
            <Text style={styles.navBtnText}>Notes</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.navBtn}
            activeOpacity={0.8}
            onPress={() => navigation.navigate('Settings' as never)}
          >
            <Icon name="settings-outline" size={24} color="#22d3ee" />
            <Text style={styles.navBtnText}>Settings</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.navBtn} 
            activeOpacity={0.8}
            onPress={handleLogout}
          >
            <Icon name="log-out-outline" size={24} color="#ef4444" />
            <Text style={[styles.navBtnText, styles.logoutText]}>Logout</Text>
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
    paddingTop: 40,
    paddingBottom: 12,
    paddingHorizontal: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(34, 211, 238, 0.1)',
    zIndex: 10,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
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
  proBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    backgroundColor: '#06b6d4',
    borderRadius: 4,
  },
  proBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#ffffff',
  },
  pricingBtn: {
    padding: 8,
  },
  content: {
    flex: 1,
  },
  bottomNav: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    backgroundColor: 'rgba(15, 23, 42, 0.95)',
    borderTopWidth: 1,
    borderTopColor: 'rgba(34, 211, 238, 0.2)',
    paddingVertical: 12,
    paddingBottom: 20,
  },
  navBtn: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  navBtnText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#22d3ee',
  },
  logoutText: {
    color: '#ef4444',
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
