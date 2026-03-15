/**
 * Create Dare Screen
 */
import React, {useState} from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  TouchableOpacity,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import {useNavigation} from '@react-navigation/native';
import Toast from 'react-native-toast-message';

import {useAuthStore, useDaresStore} from '../store';
import {CreateDareFormData, DareCategory, ProofType, DareVisibility} from '../types';
import {COLORS} from '../constants/colors';
import {FONT_SIZES, SPACING, RADIUS} from '../constants/theme';
import {DARE_CATEGORIES, PROOF_TYPES, APP_CONFIG} from '../constants/config';
import Button from '../components/common/Button';
import Input from '../components/common/Input';
import Select from '../components/common/Select';
import ScreenHeader from '../components/common/ScreenHeader';

const DURATION_OPTIONS = [
  {id: '1', label: '1 Hour'},
  {id: '6', label: '6 Hours'},
  {id: '12', label: '12 Hours'},
  {id: '24', label: '24 Hours'},
  {id: '48', label: '2 Days'},
  {id: '72', label: '3 Days'},
  {id: '168', label: '1 Week'},
];

const VISIBILITY_OPTIONS = [
  {id: 'public', label: 'Public', icon: '🌍', description: 'Anyone can see and bet'},
  {id: 'friends', label: 'Friends Only', icon: '👥', description: 'Only your followers can bet'},
];

interface FormErrors {
  title?: string;
  description?: string;
  stakeAmount?: string;
  proofType?: string;
  category?: string;
  duration?: string;
}

const CreateDareScreen = (): React.JSX.Element => {
  const navigation = useNavigation();
  const {user} = useAuthStore();
  const {createDare, isCreating} = useDaresStore();

  const [form, setForm] = useState<Partial<CreateDareFormData>>({
    visibility: 'public',
    durationHours: 24,
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const [step, setStep] = useState<1 | 2>(1);

  const update = (field: keyof CreateDareFormData, value: any): void => {
    setForm(prev => ({...prev, [field]: value}));
    if (errors[field as keyof FormErrors]) {
      setErrors(prev => ({...prev, [field]: undefined}));
    }
  };

  const validateStep1 = (): boolean => {
    const errs: FormErrors = {};
    if (!form.title?.trim()) {errs.title = 'Title is required';}
    else if (form.title.length < 10) {errs.title = 'Title must be at least 10 characters';}
    if (!form.description?.trim()) {errs.description = 'Description is required';}
    else if (form.description.length < 20) {errs.description = 'Description must be at least 20 characters';}
    if (!form.category) {errs.category = 'Select a category';}
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const validateStep2 = (): boolean => {
    const errs: FormErrors = {};
    const stake = parseFloat(form.stakeAmount ?? '0');
    if (!form.stakeAmount || isNaN(stake)) {errs.stakeAmount = 'Enter a stake amount';}
    else if (stake < APP_CONFIG.minStakeUSDC) {errs.stakeAmount = `Minimum stake is $${APP_CONFIG.minStakeUSDC}`;}
    else if (stake > APP_CONFIG.maxStakeUSDC) {errs.stakeAmount = `Maximum stake is $${APP_CONFIG.maxStakeUSDC}`;}
    if (!form.proofType) {errs.proofType = 'Select a proof type';}
    if (!form.durationHours) {errs.duration = 'Select a duration';}
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleNext = (): void => {
    if (validateStep1()) {setStep(2);}
  };

  const handleCreate = async (): Promise<void> => {
    if (!validateStep2()) {return;}
    if (!user) {
      Toast.show({type: 'error', text1: 'Not logged in'});
      return;
    }

    const fullForm: CreateDareFormData = {
      title: form.title!,
      description: form.description!,
      category: form.category as DareCategory,
      stakeAmount: form.stakeAmount!,
      proofType: form.proofType as ProofType,
      durationHours: form.durationHours!,
      visibility: form.visibility as DareVisibility,
    };

    const dare = await createDare(user.walletAddress, fullForm);
    if (dare) {
      Toast.show({type: 'success', text1: '⚡ Dare Created!', text2: 'Your dare is live and accepting bets.'});
      navigation.goBack();
    }
  };

  return (
    <View style={styles.screen}>
      <ScreenHeader
        title="Create Dare"
        subtitle={`Step ${step} of 2`}
        showBack
      />

      {/* Progress */}
      <View style={styles.progressBar}>
        <LinearGradient
          colors={COLORS.gradientPrimary}
          start={{x: 0, y: 0}}
          end={{x: 1, y: 0}}
          style={[styles.progressFill, {width: step === 1 ? '50%' : '100%'}]}
        />
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.flex}>
        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}>

          {step === 1 ? (
            <>
              <Text style={styles.stepTitle}>📝 Describe Your Dare</Text>

              <Input
                label="Dare Title"
                placeholder="e.g. Run 5km before 8 AM"
                value={form.title ?? ''}
                onChangeText={v => update('title', v)}
                error={errors.title}
                maxLength={100}
                hint={`${form.title?.length ?? 0}/100`}
              />

              <Input
                label="Description"
                placeholder="Describe the challenge in detail..."
                value={form.description ?? ''}
                onChangeText={v => update('description', v)}
                error={errors.description}
                multiline
                numberOfLines={4}
                maxLength={500}
                hint={`${form.description?.length ?? 0}/500`}
              />

              <Select
                label="Category"
                placeholder="Select category"
                value={form.category ?? null}
                options={DARE_CATEGORIES.map(c => ({id: c.id, label: c.label, icon: c.icon}))}
                onChange={v => update('category', v)}
                error={errors.category}
              />

              <Select
                label="Visibility"
                value={form.visibility ?? 'public'}
                options={VISIBILITY_OPTIONS}
                onChange={v => update('visibility', v)}
              />

              <Button
                title="Next →"
                onPress={handleNext}
                variant="primary"
                size="lg"
                fullWidth
              />
            </>
          ) : (
            <>
              <Text style={styles.stepTitle}>💰 Stake & Proof</Text>

              {/* Stake */}
              <Input
                label="Your Stake (USDC)"
                placeholder="20.00"
                value={form.stakeAmount ?? ''}
                onChangeText={v => update('stakeAmount', v)}
                keyboardType="decimal-pad"
                prefix="$"
                suffix="USDC"
                error={errors.stakeAmount}
                hint={`Min: $${APP_CONFIG.minStakeUSDC} · Max: $${APP_CONFIG.maxStakeUSDC}`}
              />

              {/* Quick stake amounts */}
              <View style={styles.quickAmounts}>
                {['5', '10', '20', '50', '100'].map(a => (
                  <TouchableOpacity
                    key={a}
                    style={[styles.quickBtn, form.stakeAmount === a && styles.quickBtnActive]}
                    onPress={() => update('stakeAmount', a)}>
                    <Text style={[styles.quickBtnText, form.stakeAmount === a && styles.quickBtnTextActive]}>
                      ${a}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Select
                label="Proof Type"
                placeholder="How will you prove it?"
                value={form.proofType ?? null}
                options={PROOF_TYPES.map(p => ({id: p.id, label: p.label, icon: p.icon}))}
                onChange={v => update('proofType', v)}
                error={errors.proofType}
              />

              <Select
                label="Duration"
                value={form.durationHours?.toString() ?? null}
                options={DURATION_OPTIONS}
                onChange={v => update('durationHours', parseInt(v, 10))}
                error={errors.duration}
              />

              {/* Summary */}
              {form.stakeAmount && parseFloat(form.stakeAmount) > 0 && (
                <View style={styles.summaryCard}>
                  <Text style={styles.summaryTitle}>📊 Summary</Text>
                  <View style={styles.summaryRow}>
                    <Text style={styles.summaryLabel}>Your stake</Text>
                    <Text style={styles.summaryValue}>${form.stakeAmount} USDC</Text>
                  </View>
                  <View style={styles.summaryRow}>
                    <Text style={styles.summaryLabel}>Platform fee (1.5%)</Text>
                    <Text style={[styles.summaryValue, {color: COLORS.textMuted}]}>
                      -${(parseFloat(form.stakeAmount) * 0.015).toFixed(2)}
                    </Text>
                  </View>
                  <View style={styles.summaryRow}>
                    <Text style={styles.summaryLabel}>Gas fee</Text>
                    <Text style={[styles.summaryValue, {color: COLORS.success}]}>FREE ⛽</Text>
                  </View>
                  <View style={[styles.summaryRow, styles.summaryTotal]}>
                    <Text style={styles.summaryTotalLabel}>If you WIN</Text>
                    <Text style={styles.summaryTotalValue}>
                      You + all bet pools
                    </Text>
                  </View>
                </View>
              )}

              <View style={styles.buttonsRow}>
                <Button
                  title="← Back"
                  onPress={() => setStep(1)}
                  variant="outline"
                  size="lg"
                  style={{flex: 1}}
                />
                <Button
                  title="⚡ Create Dare"
                  onPress={handleCreate}
                  variant="primary"
                  size="lg"
                  isLoading={isCreating}
                  style={{flex: 2}}
                />
              </View>

              <Text style={styles.gasFreeNote}>
                ⛽ Gasless transaction powered by Starkzap Paymaster
              </Text>
            </>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
};

const styles = StyleSheet.create({
  screen: {flex: 1, backgroundColor: COLORS.background},
  flex: {flex: 1},
  progressBar: {
    height: 4,
    backgroundColor: COLORS.border,
    marginHorizontal: 0,
  },
  progressFill: {
    height: 4,
    borderRadius: 0,
  },
  scroll: {
    paddingHorizontal: SPACING.base,
    paddingTop: SPACING.xl,
    paddingBottom: SPACING['4xl'],
  },
  stepTitle: {
    fontSize: FONT_SIZES.xl,
    fontWeight: '800',
    color: COLORS.text,
    marginBottom: SPACING.xl,
  },
  quickAmounts: {
    flexDirection: 'row',
    gap: SPACING.sm,
    marginTop: -SPACING.sm,
    marginBottom: SPACING.base,
  },
  quickBtn: {
    flex: 1,
    paddingVertical: SPACING.sm,
    borderRadius: RADIUS.sm,
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: 'center',
  },
  quickBtnActive: {borderColor: COLORS.primary, backgroundColor: COLORS.primaryGlow},
  quickBtnText: {fontSize: FONT_SIZES.sm, color: COLORS.textSecondary, fontWeight: '600'},
  quickBtnTextActive: {color: COLORS.primaryLight, fontWeight: '700'},
  summaryCard: {
    backgroundColor: COLORS.card,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: SPACING.base,
    marginBottom: SPACING.xl,
    gap: SPACING.sm,
  },
  summaryTitle: {fontSize: FONT_SIZES.sm, fontWeight: '700', color: COLORS.text, marginBottom: SPACING.xs},
  summaryRow: {flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center'},
  summaryLabel: {fontSize: FONT_SIZES.sm, color: COLORS.textMuted},
  summaryValue: {fontSize: FONT_SIZES.sm, fontWeight: '600', color: COLORS.text},
  summaryTotal: {
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    paddingTop: SPACING.sm,
    marginTop: SPACING.xs,
  },
  summaryTotalLabel: {fontSize: FONT_SIZES.base, fontWeight: '700', color: COLORS.text},
  summaryTotalValue: {fontSize: FONT_SIZES.base, fontWeight: '800', color: COLORS.success},
  buttonsRow: {
    flexDirection: 'row',
    gap: SPACING.sm,
    marginBottom: SPACING.md,
  },
  gasFreeNote: {
    textAlign: 'center',
    fontSize: FONT_SIZES.xs,
    color: COLORS.textMuted,
    marginBottom: SPACING.md,
  },
});

export default CreateDareScreen;
