import React, {useEffect, useRef, useState} from 'react';
import {Text, StyleSheet} from 'react-native';
import {COLORS} from '../../constants/colors';
import {FONT_SIZES} from '../../constants/theme';

interface CountdownProps {
  expiresAt: string; // ISO string
  style?: object;
  onExpire?: () => void;
}

const Countdown = ({expiresAt, style, onExpire}: CountdownProps): React.JSX.Element => {
  const [timeLeft, setTimeLeft] = useState('');
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    const compute = (): void => {
      const diff = new Date(expiresAt).getTime() - Date.now();
      if (diff <= 0) {
        setTimeLeft('Expired');
        if (intervalRef.current) {clearInterval(intervalRef.current);}
        onExpire?.();
        return;
      }

      const h = Math.floor(diff / 3_600_000);
      const m = Math.floor((diff % 3_600_000) / 60_000);
      const s = Math.floor((diff % 60_000) / 1000);

      if (h > 0) {
        setTimeLeft(`${h}h ${m}m`);
      } else if (m > 0) {
        setTimeLeft(`${m}m ${s}s`);
      } else {
        setTimeLeft(`${s}s`);
      }
    };

    compute();
    intervalRef.current = setInterval(compute, 1000);
    return () => {
      if (intervalRef.current) {clearInterval(intervalRef.current);}
    };
  }, [expiresAt, onExpire]);

  const isUrgent =
    new Date(expiresAt).getTime() - Date.now() < 3_600_000; // < 1 hour

  return (
    <Text style={[styles.text, isUrgent && styles.urgent, style]}>
      ⏱ {timeLeft}
    </Text>
  );
};

const styles = StyleSheet.create({
  text: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
    fontWeight: '600',
  },
  urgent: {
    color: COLORS.danger,
  },
});

export default Countdown;
