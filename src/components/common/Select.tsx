/**
 * Select/Picker component for categories, proof types, visibility, etc.
 */
import React, {useState} from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  FlatList,
  StyleSheet,
  ViewStyle,
} from 'react-native';
import {COLORS} from '../../constants/colors';
import {FONT_SIZES, RADIUS, SPACING} from '../../constants/theme';

interface Option {
  id: string;
  label: string;
  icon?: string;
  description?: string;
}

interface SelectProps {
  label?: string;
  placeholder?: string;
  value: string | null;
  options: Option[];
  onChange: (value: string) => void;
  containerStyle?: ViewStyle;
  error?: string;
}

const Select = ({
  label,
  placeholder = 'Select...',
  value,
  options,
  onChange,
  containerStyle,
  error,
}: SelectProps): React.JSX.Element => {
  const [open, setOpen] = useState(false);
  const selected = options.find(o => o.id === value);

  return (
    <View style={[styles.container, containerStyle]}>
      {label && <Text style={styles.label}>{label}</Text>}
      <TouchableOpacity
        style={[styles.trigger, !!error && styles.triggerError]}
        onPress={() => setOpen(true)}
        activeOpacity={0.75}>
        <Text style={selected ? styles.selected : styles.placeholder}>
          {selected ? `${selected.icon ?? ''} ${selected.label}` : placeholder}
        </Text>
        <Text style={styles.chevron}>▾</Text>
      </TouchableOpacity>
      {error && <Text style={styles.error}>{error}</Text>}

      <Modal
        visible={open}
        transparent
        animationType="slide"
        onRequestClose={() => setOpen(false)}>
        <TouchableOpacity
          style={styles.overlay}
          activeOpacity={1}
          onPress={() => setOpen(false)}
        />
        <View style={styles.sheet}>
          {label && <Text style={styles.sheetTitle}>{label}</Text>}
          <FlatList
            data={options}
            keyExtractor={item => item.id}
            renderItem={({item}) => (
              <TouchableOpacity
                style={[styles.option, item.id === value && styles.optionSelected]}
                onPress={() => {
                  onChange(item.id);
                  setOpen(false);
                }}>
                {item.icon && <Text style={styles.optionIcon}>{item.icon}</Text>}
                <View style={{flex: 1}}>
                  <Text style={[styles.optionLabel, item.id === value && styles.optionLabelSelected]}>
                    {item.label}
                  </Text>
                  {item.description && (
                    <Text style={styles.optionDesc}>{item.description}</Text>
                  )}
                </View>
                {item.id === value && <Text style={styles.check}>✓</Text>}
              </TouchableOpacity>
            )}
          />
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {marginBottom: SPACING.base},
  label: {
    fontSize: FONT_SIZES.sm,
    fontWeight: '600',
    color: COLORS.textSecondary,
    marginBottom: SPACING.xs,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  trigger: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: COLORS.card,
    borderRadius: RADIUS.md,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    paddingHorizontal: SPACING.md,
    height: 52,
  },
  triggerError: {borderColor: COLORS.danger},
  selected: {fontSize: FONT_SIZES.base, color: COLORS.text, fontWeight: '500'},
  placeholder: {fontSize: FONT_SIZES.base, color: COLORS.textMuted},
  chevron: {fontSize: 14, color: COLORS.textMuted},
  error: {fontSize: FONT_SIZES.sm, color: COLORS.danger, marginTop: SPACING.xs},
  overlay: {flex: 1, backgroundColor: COLORS.overlay},
  sheet: {
    backgroundColor: COLORS.surface,
    borderTopLeftRadius: RADIUS.xl,
    borderTopRightRadius: RADIUS.xl,
    paddingTop: SPACING.lg,
    paddingBottom: SPACING['4xl'],
    maxHeight: '70%',
    borderTopWidth: 1,
    borderColor: COLORS.border,
  },
  sheetTitle: {
    fontSize: FONT_SIZES.base,
    fontWeight: '700',
    color: COLORS.text,
    paddingHorizontal: SPACING.base,
    marginBottom: SPACING.md,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.base,
    paddingVertical: SPACING.md,
    gap: SPACING.md,
  },
  optionSelected: {backgroundColor: COLORS.primaryGlow},
  optionIcon: {fontSize: 20},
  optionLabel: {
    fontSize: FONT_SIZES.base,
    color: COLORS.text,
    fontWeight: '500',
  },
  optionLabelSelected: {color: COLORS.primaryLight, fontWeight: '700'},
  optionDesc: {fontSize: FONT_SIZES.sm, color: COLORS.textMuted, marginTop: 2},
  check: {fontSize: 16, color: COLORS.primary, fontWeight: '700'},
});

export default Select;
