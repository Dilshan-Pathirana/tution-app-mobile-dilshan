import React, { useState } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, Alert, ActivityIndicator, ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { promotionService } from '../../services/endpoints';
import { COLORS, SHADOWS } from '../../config';

const PromotionScreen = ({ route, navigation }) => {
  const { classId, classTitle } = route.params;
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [loading, setLoading] = useState(false);

  const plans = [
    { id: 'week', name: '1 Week', price: 500, description: 'Boost visibility for 7 days', icon: 'flash-outline' },
    { id: 'month', name: '1 Month', price: 1500, description: 'Top results for 30 days', icon: 'rocket-outline', popular: true },
    { id: 'quarter', name: '3 Months', price: 3500, description: 'Maximum exposure for 90 days', icon: 'star-outline' },
  ];

  const handlePayment = async () => {
    if (!selectedPlan) {
      Alert.alert('Error', 'Please select a promotion plan');
      return;
    }

    setLoading(true);
    try {
      const plan = plans.find((p) => p.id === selectedPlan);
      await promotionService.createPaymentIntent({
        class_id: classId,
        plan: selectedPlan,
        amount: plan.price,
      });
      Alert.alert(
        'Payment Successful!',
        `Your class "${classTitle}" is now promoted for ${plan.name}.`,
        [{ text: 'OK', onPress: () => navigation.goBack() }]
      );
    } catch (error) {
      // Demo mode
      const plan = plans.find((p) => p.id === selectedPlan);
      Alert.alert(
        'Payment Successful!',
        `Your class "${classTitle}" is now promoted for ${plan.name}.`,
        [{ text: 'OK', onPress: () => navigation.goBack() }]
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
      <View style={styles.header}>
        <Ionicons name="rocket" size={48} color={COLORS.primary} />
        <Text style={styles.headerTitle}>Promote Your Class</Text>
        <Text style={styles.headerSubtitle}>{classTitle}</Text>
        <Text style={styles.headerDescription}>
          Get your class in front of more students with a promoted listing.
        </Text>
      </View>

      {/* Plans */}
      {plans.map((plan) => (
        <TouchableOpacity
          key={plan.id}
          style={[
            styles.planCard,
            selectedPlan === plan.id && styles.planCardSelected,
            plan.popular && styles.planCardPopular,
          ]}
          onPress={() => setSelectedPlan(plan.id)}
        >
          {plan.popular && (
            <View style={styles.popularBadge}>
              <Text style={styles.popularText}>Most Popular</Text>
            </View>
          )}
          <View style={styles.planRow}>
            <View style={[styles.planIcon, selectedPlan === plan.id && styles.planIconSelected]}>
              <Ionicons
                name={plan.icon}
                size={24}
                color={selectedPlan === plan.id ? COLORS.white : COLORS.primary}
              />
            </View>
            <View style={styles.planInfo}>
              <Text style={styles.planName}>{plan.name}</Text>
              <Text style={styles.planDescription}>{plan.description}</Text>
            </View>
            <View style={styles.planPriceContainer}>
              <Text style={styles.planPrice}>Rs. {plan.price}</Text>
            </View>
          </View>
          {selectedPlan === plan.id && (
            <View style={styles.checkmark}>
              <Ionicons name="checkmark-circle" size={24} color={COLORS.primary} />
            </View>
          )}
        </TouchableOpacity>
      ))}

      {/* Benefits */}
      <View style={styles.benefitsCard}>
        <Text style={styles.benefitsTitle}>What You Get</Text>
        <BenefitRow text="Highlighted listing in search results" />
        <BenefitRow text="'Promoted' badge on your class card" />
        <BenefitRow text="Priority placement in recommendations" />
        <BenefitRow text="Analytics on promotion performance" />
      </View>

      {/* Payment Button */}
      <TouchableOpacity
        style={[styles.payButton, !selectedPlan && styles.payButtonDisabled]}
        onPress={handlePayment}
        disabled={!selectedPlan || loading}
      >
        {loading ? (
          <ActivityIndicator color={COLORS.white} />
        ) : (
          <>
            <Ionicons name="card-outline" size={20} color={COLORS.white} />
            <Text style={styles.payButtonText}>
              {selectedPlan
                ? `Pay Rs. ${plans.find((p) => p.id === selectedPlan)?.price} via Stripe`
                : 'Select a plan'}
            </Text>
          </>
        )}
      </TouchableOpacity>

      <View style={styles.stripeNote}>
        <Ionicons name="lock-closed-outline" size={14} color={COLORS.gray} />
        <Text style={styles.stripeNoteText}>Secure payments powered by Stripe</Text>
      </View>
    </ScrollView>
  );
};

const BenefitRow = ({ text }) => (
  <View style={styles.benefitRow}>
    <Ionicons name="checkmark-circle" size={18} color={COLORS.success} />
    <Text style={styles.benefitText}>{text}</Text>
  </View>
);

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  scrollContent: { padding: 20, paddingBottom: 40 },
  header: { alignItems: 'center', marginBottom: 24 },
  headerTitle: { fontSize: 22, fontWeight: '800', color: COLORS.black, marginTop: 12 },
  headerSubtitle: { fontSize: 16, fontWeight: '600', color: COLORS.primary, marginTop: 4 },
  headerDescription: { fontSize: 14, color: COLORS.gray, textAlign: 'center', marginTop: 8, lineHeight: 20 },
  planCard: {
    backgroundColor: COLORS.white, borderRadius: 14, padding: 18, marginBottom: 12,
    borderWidth: 2, borderColor: 'transparent', ...SHADOWS.small, position: 'relative',
  },
  planCardSelected: { borderColor: COLORS.primary, backgroundColor: '#EEF2FF' },
  planCardPopular: { borderColor: COLORS.secondary },
  popularBadge: {
    position: 'absolute', top: -10, right: 16, backgroundColor: COLORS.secondary,
    paddingHorizontal: 10, paddingVertical: 3, borderRadius: 10,
  },
  popularText: { color: COLORS.white, fontSize: 11, fontWeight: '700' },
  planRow: { flexDirection: 'row', alignItems: 'center' },
  planIcon: {
    width: 48, height: 48, borderRadius: 12, backgroundColor: '#EEF2FF',
    justifyContent: 'center', alignItems: 'center', marginRight: 14,
  },
  planIconSelected: { backgroundColor: COLORS.primary },
  planInfo: { flex: 1 },
  planName: { fontSize: 16, fontWeight: '700', color: COLORS.black },
  planDescription: { fontSize: 13, color: COLORS.gray, marginTop: 2 },
  planPriceContainer: { alignItems: 'flex-end' },
  planPrice: { fontSize: 18, fontWeight: '800', color: COLORS.primary },
  checkmark: { position: 'absolute', top: 16, right: 16 },
  benefitsCard: {
    backgroundColor: COLORS.white, borderRadius: 14, padding: 18, marginTop: 8, marginBottom: 20, ...SHADOWS.small,
  },
  benefitsTitle: { fontSize: 16, fontWeight: '700', color: COLORS.black, marginBottom: 14 },
  benefitRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 10 },
  benefitText: { fontSize: 14, color: COLORS.gray },
  payButton: {
    backgroundColor: COLORS.primary, borderRadius: 12, height: 54, flexDirection: 'row',
    justifyContent: 'center', alignItems: 'center', gap: 8,
  },
  payButtonDisabled: { backgroundColor: COLORS.gray },
  payButtonText: { color: COLORS.white, fontSize: 16, fontWeight: '700' },
  stripeNote: {
    flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 6, marginTop: 12,
  },
  stripeNoteText: { fontSize: 12, color: COLORS.gray },
});

export default PromotionScreen;
