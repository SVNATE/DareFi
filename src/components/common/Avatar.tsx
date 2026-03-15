import React from 'react';
import {View, Text, Image, StyleSheet, ViewStyle, TouchableOpacity} from 'react-native';
import {COLORS} from '../../constants/colors';
import {FONT_SIZES} from '../../constants/theme';

type AvatarSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl';

const SIZE_MAP: Record<AvatarSize, number> = {
  xs: 24,
  sm: 32,
  md: 44,
  lg: 56,
  xl: 80,
};

interface AvatarProps {
  uri?: string;
  username?: string;
  size?: AvatarSize;
  style?: ViewStyle;
  onPress?: () => void;
  showBorder?: boolean;
}

const Avatar = ({
  uri,
  username,
  size = 'md',
  style,
  onPress,
  showBorder = false,
}: AvatarProps): React.JSX.Element => {
  const dim = SIZE_MAP[size];
  const fontSize = dim * 0.38;

  const content = uri ? (
    <Image source={{uri}} style={[styles.image, {width: dim, height: dim, borderRadius: dim / 2}]} />
  ) : (
    <View
      style={[
        styles.placeholder,
        {width: dim, height: dim, borderRadius: dim / 2},
      ]}>
      <Text style={[styles.initials, {fontSize}]}>
        {username ? username.slice(0, 2).toUpperCase() : '?'}
      </Text>
    </View>
  );

  const containerStyle: ViewStyle = {
    width: dim,
    height: dim,
    borderRadius: dim / 2,
    ...(showBorder
      ? {borderWidth: 2, borderColor: COLORS.primary}
      : {}),
    overflow: 'hidden',
  };

  if (onPress) {
    return (
      <TouchableOpacity onPress={onPress} style={[containerStyle, style]}>
        {content}
      </TouchableOpacity>
    );
  }

  return <View style={[containerStyle, style]}>{content}</View>;
};

const styles = StyleSheet.create({
  image: {
    resizeMode: 'cover',
  },
  placeholder: {
    backgroundColor: COLORS.primaryDark,
    alignItems: 'center',
    justifyContent: 'center',
  },
  initials: {
    color: COLORS.white,
    fontWeight: '700',
  },
});

export default Avatar;
