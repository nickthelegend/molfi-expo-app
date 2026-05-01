import { useColor } from '@/hooks/useColor';
import { FONT_SIZE } from '@/theme/globals';
import React, { forwardRef } from 'react';
import {
  Text as RNText,
  TextProps as RNTextProps,
  TextStyle,
} from 'react-native';

type TextVariant =
  | 'body'
  | 'title'
  | 'subtitle'
  | 'caption'
  | 'heading'
  | 'link'
  | 'mono';

interface TextProps extends RNTextProps {
  variant?: TextVariant;
  lightColor?: string;
  darkColor?: string;
  children: React.ReactNode;
}

export const Text = forwardRef<RNText, TextProps>(
  (
    { variant = 'body', lightColor, darkColor, style, children, ...props },
    ref
  ) => {
    const textColor = useColor('text', { light: lightColor, dark: darkColor });
    const mutedColor = useColor('textMuted');

    const getTextStyle = (): TextStyle => {
      const baseStyle: TextStyle = {
        color: textColor,
      };

      switch (variant) {
        case 'heading':
          return {
            ...baseStyle,
            fontFamily: 'Manrope-ExtraBold',
            fontSize: 32,
            lineHeight: 38,
          };
        case 'title':
          return {
            ...baseStyle,
            fontFamily: 'Manrope-Bold',
            fontSize: 24,
            lineHeight: 32,
          };
        case 'subtitle':
          return {
            ...baseStyle,
            fontFamily: 'Manrope-SemiBold',
            fontSize: 20,
            lineHeight: 28,
          };
        case 'caption':
          return {
            ...baseStyle,
            fontFamily: 'Inter-Regular',
            fontSize: 14,
            lineHeight: 20,
            color: mutedColor,
          };
        case 'link':
          return {
            ...baseStyle,
            fontFamily: 'Inter-SemiBold',
            fontSize: FONT_SIZE,
            textDecorationLine: 'underline',
          };
        case 'mono':
          return {
            ...baseStyle,
            fontFamily: 'KHTekaMono',
            fontSize: 14,
          };
        default: // 'body'
          return {
            ...baseStyle,
            fontFamily: 'Inter-Regular',
            fontSize: FONT_SIZE,
            lineHeight: 24,
          };
      }
    };

    return (
      <RNText ref={ref} style={[getTextStyle(), style]} {...props}>
        {children}
      </RNText>
    );
  }
);

Text.displayName = 'Text';

