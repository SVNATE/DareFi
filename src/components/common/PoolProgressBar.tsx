import React from 'react';
import {View, Text, StyleSheet} from 'react-native';
import {COLORS} from '../../constants/colors';
import {FONT_SIZES, SPACING} from '../../constants/theme';

interface ProgressBarProps {
  successPercent: number;   // 0–100
  failPercent: number;      // 0–100
  successLabel?: string;
  failLabel?: string;
  showLabels?: boolean;
  height?: number;
}

const PoolProgressBar = ({
  successPercent,
  failPercent,
  successLabel,
  failLabel,
  showLabels = true,
  height = 8,
}: ProgressBarProps): React.JSX.Element => {
  return (
    <View>
      <View style={[styles.track, {height}]}>
        <View
          style={[
            styles.successFill,
            {width: `${Math.min(100, successPercent)}%`, height},
          ]}
        />
        <View
          style={[
            styles.failFill,
            {width: `${Math.min(100, failPercent)}%`, height},
          ]}
        />
      </View>
      {showLabels && (
        <View style={styles.labelsRow}>
          <View style={styles.labelItem}>
            <View style={[styles.circle, {backgroundColor: COLORS.success}]} />
            <Text style={styles.labelText}>
              {successLabel ?? `${successPercent.toFixed(0)}% WIN`}
            </Text>
          </View>
          <View style={styles.labelItem}>
            <View style={[styles.circle, {backgroundColor: COLORS.danger}]} />
            <Text style={styles.labelText}>
              {failLabel ?? `${failPercent.toFixed(0)}% FAIL`}
            </Text>
          </View>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  track: {
    flexDirection: 'row',
    backgroundColor: COLORS.border,
    borderRadius: 99,
    overflow: 'hidden',
  },
  successFill: {
    backgroundColor: COLORS.success,
  },
  failFill: {
    backgroundColor: COLORS.danger,
  },
  labelsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: SPACING.xs,
  },
  labelItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  circle: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 4,
  },
  labelText: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.textMuted,
    fontWeight: '600',
  },
});

export default PoolProgressBar;
