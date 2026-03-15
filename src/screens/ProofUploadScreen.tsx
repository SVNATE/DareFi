/**
 * Proof Upload Screen
 * Creator uploads video/photo/GPS proof for their dare
 */
import React, {useState} from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  TextInput,
} from 'react-native';
import {NativeStackScreenProps} from '@react-navigation/native-stack';
import {launchImageLibrary, launchCamera, MediaType} from 'react-native-image-picker';
import Toast from 'react-native-toast-message';

import {useAuthStore, useDaresStore} from '../store';
import {HomeStackParamList} from '../types';
import {COLORS} from '../constants/colors';
import {FONT_SIZES, SPACING, RADIUS} from '../constants/theme';
import Button from '../components/common/Button';
import ScreenHeader from '../components/common/ScreenHeader';

type Props = NativeStackScreenProps<HomeStackParamList, 'ProofUpload'>;

const ProofUploadScreen = ({route, navigation}: Props): React.JSX.Element => {
  const {dareId} = route.params;
  const {user} = useAuthStore();
  const {selectedDare, submitProof, isSubmittingProof} = useDaresStore();

  const [selectedFile, setSelectedFile] = useState<{uri: string; type: string; name: string} | null>(null);
  const [description, setDescription] = useState('');
  const [uploadProgress, setUploadProgress] = useState(0);

  const proofType = selectedDare?.proofType ?? 'photo';
  const mediaType: MediaType = proofType === 'video' ? 'video' : 'photo';

  const pickFromLibrary = async (): Promise<void> => {
    const result = await launchImageLibrary({
      mediaType,
      quality: 0.8,
      videoQuality: 'medium',
    });

    if (result.assets && result.assets[0]) {
      const asset = result.assets[0];
      setSelectedFile({
        uri: asset.uri!,
        type: asset.type ?? (proofType === 'video' ? 'video/mp4' : 'image/jpeg'),
        name: asset.fileName ?? 'proof',
      });
    }
  };

  const pickFromCamera = async (): Promise<void> => {
    const result = await launchCamera({
      mediaType,
      quality: 0.8,
      videoQuality: 'medium',
    });

    if (result.assets && result.assets[0]) {
      const asset = result.assets[0];
      setSelectedFile({
        uri: asset.uri!,
        type: asset.type ?? (proofType === 'video' ? 'video/mp4' : 'image/jpeg'),
        name: asset.fileName ?? 'proof',
      });
    }
  };

  const handleSubmit = async (): Promise<void> => {
    if (!selectedFile || !user) {
      Toast.show({type: 'error', text1: 'Select a file first'});
      return;
    }

    const success = await submitProof(
      user.walletAddress,
      dareId,
      selectedFile.uri,
      selectedFile.type,
      description || undefined,
    );

    if (success) {
      Toast.show({
        type: 'success',
        text1: '🎉 Proof Submitted!',
        text2: 'Community voting will begin shortly.',
      });
      navigation.navigate('Voting', {dareId});
    }
  };

  return (
    <View style={styles.screen}>
      <ScreenHeader title="Submit Proof" showBack />

      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}>

        {/* Instruction */}
        <View style={styles.instructionCard}>
          <Text style={styles.instructionIcon}>
            {proofType === 'video' ? '🎥' : proofType === 'photo' ? '📷' : '📍'}
          </Text>
          <View style={styles.instructionInfo}>
            <Text style={styles.instructionTitle}>
              {proofType === 'video' ? 'Video Proof Required' :
               proofType === 'photo' ? 'Photo Proof Required' :
               'GPS Screenshot Required'}
            </Text>
            <Text style={styles.instructionDesc}>
              {proofType === 'video' ? 'Record yourself completing the challenge.' :
               proofType === 'photo' ? 'Take a clear photo showing completion.' :
               'Screenshot your GPS or health app showing the activity.'}
            </Text>
          </View>
        </View>

        {/* File Picker */}
        {!selectedFile ? (
          <View style={styles.uploadArea}>
            <Text style={styles.uploadIcon}>📤</Text>
            <Text style={styles.uploadTitle}>Upload Your Proof</Text>
            <Text style={styles.uploadSubtitle}>Select from library or capture now</Text>

            <View style={styles.pickButtons}>
              <TouchableOpacity style={styles.pickBtn} onPress={pickFromCamera}>
                <Text style={styles.pickBtnIcon}>📸</Text>
                <Text style={styles.pickBtnLabel}>Camera</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.pickBtn} onPress={pickFromLibrary}>
                <Text style={styles.pickBtnIcon}>🖼️</Text>
                <Text style={styles.pickBtnLabel}>Library</Text>
              </TouchableOpacity>
            </View>
          </View>
        ) : (
          <View style={styles.previewArea}>
            {proofType !== 'video' ? (
              <Image source={{uri: selectedFile.uri}} style={styles.previewImage} resizeMode="cover" />
            ) : (
              <View style={styles.videoPreview}>
                <Text style={styles.videoIcon}>🎬</Text>
                <Text style={styles.videoName}>{selectedFile.name}</Text>
              </View>
            )}
            <TouchableOpacity
              style={styles.removeBtn}
              onPress={() => setSelectedFile(null)}>
              <Text style={styles.removeBtnText}>✕ Remove</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Description */}
        <Text style={styles.descLabel}>Description (optional)</Text>
        <View style={styles.descInputRow}>
          <TextInput
            style={styles.descInput}
            value={description}
            onChangeText={setDescription}
            placeholder="Add context about your proof..."
            placeholderTextColor={COLORS.textMuted}
            multiline
            numberOfLines={3}
            maxLength={300}
          />
        </View>

        {/* Tips */}
        <View style={styles.tipsCard}>
          <Text style={styles.tipsTitle}>📌 Tips for a valid proof</Text>
          {[
            'Make sure the proof clearly shows completion',
            'Include timestamps or date/time if possible',
            'Ensure file is < 100MB',
            'Video should be under 2 minutes',
          ].map(tip => (
            <View key={tip} style={styles.tipRow}>
              <Text style={styles.tipBullet}>•</Text>
              <Text style={styles.tipText}>{tip}</Text>
            </View>
          ))}
        </View>

        <Button
          title={isSubmittingProof ? 'Uploading...' : '📎 Submit Proof (Gasless)'}
          onPress={handleSubmit}
          disabled={!selectedFile || isSubmittingProof}
          isLoading={isSubmittingProof}
          variant="primary"
          size="lg"
          fullWidth
        />

        <Text style={styles.gasFreeNote}>
          ⛽ Gas is sponsored by DareFi Paymaster
        </Text>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  screen: {flex: 1, backgroundColor: COLORS.background},
  scroll: {
    paddingHorizontal: SPACING.base,
    paddingBottom: SPACING['4xl'],
  },
  instructionCard: {
    flexDirection: 'row',
    gap: SPACING.md,
    backgroundColor: COLORS.card,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: SPACING.base,
    marginBottom: SPACING.lg,
    marginTop: SPACING.md,
    alignItems: 'center',
  },
  instructionIcon: {fontSize: 40},
  instructionInfo: {flex: 1},
  instructionTitle: {fontSize: FONT_SIZES.base, fontWeight: '700', color: COLORS.text},
  instructionDesc: {fontSize: FONT_SIZES.sm, color: COLORS.textMuted, marginTop: 4, lineHeight: 18},
  uploadArea: {
    backgroundColor: COLORS.card,
    borderRadius: RADIUS.lg,
    borderWidth: 2,
    borderColor: COLORS.border,
    borderStyle: 'dashed',
    alignItems: 'center',
    padding: SPACING['3xl'],
    marginBottom: SPACING.lg,
    gap: SPACING.sm,
  },
  uploadIcon: {fontSize: 48},
  uploadTitle: {fontSize: FONT_SIZES.lg, fontWeight: '700', color: COLORS.text},
  uploadSubtitle: {fontSize: FONT_SIZES.sm, color: COLORS.textMuted},
  pickButtons: {flexDirection: 'row', gap: SPACING.md, marginTop: SPACING.md},
  pickBtn: {
    flex: 1,
    alignItems: 'center',
    backgroundColor: COLORS.cardElevated,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: SPACING.md,
    gap: SPACING.xs,
  },
  pickBtnIcon: {fontSize: 28},
  pickBtnLabel: {fontSize: FONT_SIZES.sm, fontWeight: '600', color: COLORS.text},
  previewArea: {
    marginBottom: SPACING.lg,
    borderRadius: RADIUS.lg,
    overflow: 'hidden',
  },
  previewImage: {width: '100%', height: 240, borderRadius: RADIUS.lg},
  videoPreview: {
    backgroundColor: COLORS.card,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
    height: 160,
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.sm,
  },
  videoIcon: {fontSize: 48},
  videoName: {fontSize: FONT_SIZES.sm, color: COLORS.textSecondary},
  removeBtn: {
    marginTop: SPACING.sm,
    alignSelf: 'flex-end',
    backgroundColor: COLORS.dangerGlow,
    borderRadius: RADIUS.full,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs,
  },
  removeBtnText: {color: COLORS.danger, fontSize: FONT_SIZES.sm, fontWeight: '700'},
  descLabel: {
    fontSize: FONT_SIZES.sm,
    fontWeight: '600',
    color: COLORS.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: SPACING.xs,
  },
  descInputRow: {
    backgroundColor: COLORS.card,
    borderRadius: RADIUS.md,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    padding: SPACING.md,
    marginBottom: SPACING.lg,
  },
  descInput: {
    fontSize: FONT_SIZES.base,
    color: COLORS.text,
    minHeight: 80,
    textAlignVertical: 'top',
  },
  tipsCard: {
    backgroundColor: COLORS.card,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: SPACING.base,
    marginBottom: SPACING.xl,
    gap: SPACING.sm,
  },
  tipsTitle: {fontSize: FONT_SIZES.sm, fontWeight: '700', color: COLORS.text},
  tipRow: {flexDirection: 'row', gap: SPACING.xs},
  tipBullet: {color: COLORS.textMuted, fontSize: FONT_SIZES.sm},
  tipText: {fontSize: FONT_SIZES.sm, color: COLORS.textMuted, flex: 1},
  gasFreeNote: {
    textAlign: 'center',
    fontSize: FONT_SIZES.xs,
    color: COLORS.textMuted,
    marginTop: SPACING.sm,
  },
});

export default ProofUploadScreen;
