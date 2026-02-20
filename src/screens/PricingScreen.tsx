import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  SafeAreaView,
  ActivityIndicator,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../types/navigation';
import Icon from 'react-native-vector-icons/Ionicons';
import AppShell from '../components/AppShell';
import { useAuth } from '../context/AuthContext';
import { useSubscription } from '../context/SubscriptionContext';
import { useRazorpayCheckout } from '../hooks/useRazorpayCheckout';
import { SUBSCRIPTION_CONFIG, PRICING } from '../constants';
import type { BillingCycle } from '../types/subscription.types';

type PricingScreenNavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  'Pricing'
>;

const FREE_FEATURES = [
  `${SUBSCRIPTION_CONFIG.FREE_MAX_RECORDINGS} recordings per month`,
  `Up to ${SUBSCRIPTION_CONFIG.FREE_MAX_NOTES} total notes`,
  `Custom vocabulary (up to ${SUBSCRIPTION_CONFIG.FREE_MAX_VOCABULARY} entries)`,
  'AI-powered text formatting',
  'Basic voice-to-text',
  'Download and copy notes',
];

const PRO_FEATURES = [
  'Unlimited recordings',
  'Unlimited notes',
  'Unlimited vocabulary entries',
  'AI-powered text formatting',
  'Priority processing',
  'Download and copy notes',
  'Priority support',
];

export default function PricingScreen() {
  const navigation = useNavigation<PricingScreenNavigationProp>();
  const { user } = useAuth();
  const { isProUser, refetch } = useSubscription();

  const [billingCycle, setBillingCycle] = useState<BillingCycle>('monthly');

  const { initiateCheckout, isLoading: checkoutLoading } =
    useRazorpayCheckout({
      onSuccess: async () => {
        refetch();
        // Payment successful, subscription activated
        // User stays on pricing page or can navigate back
      },
      onError: (error) => {
        console.error('Payment error:', error);
      },
    });

  const handleProUpgrade = () => {
    if (!user) {
      navigation.navigate('Auth');
      return;
    }
    initiateCheckout(billingCycle);
  };

  const handleFreeClick = () => {
    if (!user) {
      navigation.navigate('Auth');
    } else {
      navigation.navigate('Recording');
    }
  };

  const monthlyPrice = PRICING.MONTHLY;
  const yearlyPrice = PRICING.YEARLY;
  const monthlySavings = PRICING.YEARLY_SAVINGS_PERCENT;

  return (
    <AppShell>
      <SafeAreaView style={styles.container}>
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
        >
          {/* Header with Back Button and Title */}
          <View style={styles.headerContainer}>
            <Pressable
              style={styles.backButton}
              onPress={() => navigation.goBack()}
            >
              <Icon name="arrow-back" size={24} color="#ffffff" />
            </Pressable>
            <View style={styles.headerContent}>
              <Text style={styles.mainTitle}>
                Simple, Transparent <Text style={styles.accentText}>Pricing</Text>
              </Text>
              <Text style={styles.subtitle}>
                Start free and upgrade when you need more. No hidden fees, cancel
                anytime.
              </Text>
            </View>
          </View>

          {/* Billing Toggle */}
          <View style={styles.billingToggleContainer}>
            <View style={styles.billingToggle}>
              <Pressable
                style={[
                  styles.toggleOption,
                  billingCycle === 'monthly' && styles.toggleOptionActive,
                ]}
                onPress={() => setBillingCycle('monthly')}
              >
                <Text
                  style={[
                    styles.toggleText,
                    billingCycle === 'monthly' && styles.toggleTextActive,
                  ]}
                >
                  Monthly
                </Text>
              </Pressable>

              <Pressable
                style={[
                  styles.toggleOption,
                  billingCycle === 'yearly' && styles.toggleOptionActive,
                ]}
                onPress={() => setBillingCycle('yearly')}
              >
                <View>
                  <Text
                    style={[
                      styles.toggleText,
                      billingCycle === 'yearly' && styles.toggleTextActive,
                    ]}
                  >
                    Yearly
                  </Text>
                </View>
                {billingCycle === 'yearly' && (
                  <View style={styles.savingsBadge}>
                    <Text style={styles.savingsText}>
                      Save {monthlySavings}%
                    </Text>
                  </View>
                )}
              </Pressable>
            </View>
          </View>

          {/* Pricing Cards */}
          <View style={styles.cardsContainer}>
            {/* Free Card */}
            <View style={styles.card}>
              <View style={styles.cardHeader}>
                <Text style={styles.planName}>Free</Text>
              </View>

              <View style={styles.priceSection}>
                <Text style={styles.price}>₹0</Text>
              </View>

              <View style={styles.featuresContainer}>
                {FREE_FEATURES.map((feature, index) => (
                  <View key={index} style={styles.featureItem}>
                    <Icon
                      name="checkmark-circle"
                      size={18}
                      color="#9ca3af"
                      style={styles.featureIcon}
                    />
                    <Text style={styles.featureText}>{feature}</Text>
                  </View>
                ))}
              </View>

              <Pressable
                style={[
                  styles.button,
                  isProUser && styles.buttonSecondary,
                ]}
                onPress={handleFreeClick}
                disabled={isProUser}
              >
                <Text
                  style={[
                    styles.buttonText,
                    isProUser && styles.buttonSecondaryText,
                  ]}
                >
                  {isProUser ? 'Current Plan' : 'Get Started'}
                </Text>
              </Pressable>
            </View>

            {/* Pro Card */}
            <View
              style={[
                styles.card,
                styles.proCard,
              ]}
            >
              <View style={styles.popularBadge}>
                <Text style={styles.popularText}>Most Popular</Text>
              </View>

              <View style={styles.cardHeader}>
                <Text style={styles.planName}>Pro</Text>
              </View>

              <View style={styles.priceSection}>
                <Text style={styles.price}>
                  ₹{billingCycle === 'monthly' ? monthlyPrice : yearlyPrice}
                </Text>
                <Text style={styles.period}>
                  /{billingCycle === 'monthly' ? 'month' : 'year'}
                </Text>
              </View>

              <View style={styles.featuresContainer}>
                {PRO_FEATURES.map((feature, index) => (
                  <View key={index} style={styles.featureItem}>
                    <Icon
                      name="checkmark-circle"
                      size={18}
                      color="#06b6d4"
                      style={styles.featureIcon}
                    />
                    <Text style={[styles.featureText, styles.proFeatureText]}>
                      {feature}
                    </Text>
                  </View>
                ))}
              </View>

              <Pressable
                style={[
                  styles.button,
                  styles.buttonPrimary,
                  checkoutLoading && styles.buttonDisabled,
                ]}
                onPress={handleProUpgrade}
                disabled={checkoutLoading || isProUser}
              >
                {checkoutLoading ? (
                  <ActivityIndicator color="#ffffff" />
                ) : (
                  <Text style={styles.buttonPrimaryText}>
                    {isProUser ? 'Current Plan' : 'Upgrade to Pro'}
                  </Text>
                )}
              </Pressable>
            </View>
          </View>

          {/* FAQ Section */}
          <View style={styles.faqSection}>
            <Text style={styles.faqTitle}>Frequently Asked Questions</Text>

            <View style={styles.faqItem}>
              <View style={styles.faqQuestion}>
                <Icon
                  name="help-circle"
                  size={18}
                  color="#06b6d4"
                  style={styles.faqIcon}
                />
                <Text style={styles.faqQuestionText}>Can I cancel anytime?</Text>
              </View>
              <Text style={styles.faqAnswer}>
                Yes! You can cancel your subscription at any time. You'll
                continue to have access until the end of your billing period.
              </Text>
            </View>

            <View style={styles.faqItem}>
              <View style={styles.faqQuestion}>
                <Icon
                  name="help-circle"
                  size={18}
                  color="#06b6d4"
                  style={styles.faqIcon}
                />
                <Text style={styles.faqQuestionText}>
                  What happens to my notes if I downgrade?
                </Text>
              </View>
              <Text style={styles.faqAnswer}>
                Your existing notes are safe! You'll keep all your notes, but
                new recording limits will apply.
              </Text>
            </View>

            <View style={styles.faqItem}>
              <View style={styles.faqQuestion}>
                <Icon
                  name="help-circle"
                  size={18}
                  color="#06b6d4"
                  style={styles.faqIcon}
                />
                <Text style={styles.faqQuestionText}>Is my payment secure?</Text>
              </View>
              <Text style={styles.faqAnswer}>
                Absolutely. We use Razorpay, India's most trusted payment
                gateway, to process all payments securely.
              </Text>
            </View>
          </View>

          <View style={{ height: 32 }} />
        </ScrollView>
      </SafeAreaView>
    </AppShell>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#020617',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 32,
  },
  
  // Header with back button
  headerContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingHorizontal: 16,
    paddingVertical: 16,
    gap: 12,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 4,
  },
  headerContent: {
    flex: 1,
  },
  mainTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: '#ffffff',
    marginBottom: 8,
  },
  accentText: {
    color: '#06b6d4',
  },
  subtitle: {
    fontSize: 13,
    color: '#9ca3af',
    lineHeight: 20,
  },

  // Billing Toggle - Enhanced
  billingToggleContainer: {
    paddingHorizontal: 16,
    marginBottom: 28,
  },
  billingToggle: {
    flexDirection: 'row',
    backgroundColor: '#1e293b',
    borderRadius: 10,
    padding: 4,
    gap: 8,
    borderWidth: 1,
    borderColor: '#334155',
  },
  toggleOption: {
    flex: 1,
    paddingVertical: 14,
    paddingHorizontal: 12,
    alignItems: 'center',
    borderRadius: 8,
    backgroundColor: 'transparent',
  },
  toggleOptionActive: {
    backgroundColor: '#06b6d4',
    borderWidth: 0,
  },
  toggleText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#9ca3af',
  },
  toggleTextActive: {
    color: '#ffffff',
    fontWeight: '700',
  },
  savingsBadge: {
    marginTop: 6,
    backgroundColor: '#ffffff',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 4,
  },
  savingsText: {
    fontSize: 9,
    fontWeight: '700',
    color: '#06b6d4',
  },

  // Cards Container
  cardsContainer: {
    paddingHorizontal: 16,
    gap: 16,
    marginBottom: 40,
  },
  card: {
    backgroundColor: '#1e293b',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#334155',
    padding: 20,
  },
  proCard: {
    borderColor: '#06b6d4',
    borderWidth: 2,
    backgroundColor: '#1e293b',
  },

  // Popular Badge
  popularBadge: {
    position: 'absolute',
    top: -10,
    left: 20,
    backgroundColor: '#06b6d4',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 16,
  },
  popularText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#ffffff',
  },

  // Card Header
  cardHeader: {
    marginBottom: 16,
    marginTop: 4,
  },
  planName: {
    fontSize: 18,
    fontWeight: '700',
    color: '#ffffff',
  },

  // Price Section
  priceSection: {
    marginBottom: 24,
  },
  price: {
    fontSize: 32,
    fontWeight: '700',
    color: '#ffffff',
  },
  period: {
    fontSize: 13,
    color: '#9ca3af',
    marginTop: 4,
  },

  // Features Container
  featuresContainer: {
    marginBottom: 24,
    gap: 10,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  featureIcon: {
    marginRight: 10,
    marginTop: 2,
  },
  featureText: {
    fontSize: 12,
    color: '#d1d5db',
    flex: 1,
    lineHeight: 16,
  },
  proFeatureText: {
    color: '#ffffff',
    fontSize: 12,
  },

  // Buttons
  button: {
    paddingVertical: 11,
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#475569',
    backgroundColor: 'transparent',
  },
  buttonSecondary: {
    backgroundColor: '#334155',
    borderColor: '#334155',
  },
  buttonPrimary: {
    backgroundColor: '#06b6d4',
    borderColor: '#06b6d4',
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#9ca3af',
  },
  buttonSecondaryText: {
    color: '#9ca3af',
  },
  buttonPrimaryText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#ffffff',
  },

  // FAQ Section
  faqSection: {
    paddingHorizontal: 16,
  },
  faqTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#ffffff',
    marginBottom: 16,
  },
  faqItem: {
    marginBottom: 16,
  },
  faqQuestion: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  faqIcon: {
    marginRight: 8,
  },
  faqQuestionText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#ffffff',
    flex: 1,
  },
  faqAnswer: {
    fontSize: 12,
    color: '#9ca3af',
    lineHeight: 18,
    marginLeft: 28,
  },
});
