/**
 * Below are the colors that are used in the app. The colors are defined in the light and dark mode.
 * There are many other ways to style your app. For example, [Nativewind](https://www.nativewind.dev/), [Tamagui](https://tamagui.dev/), [unistyles](https://reactnativeunistyles.vercel.app), etc.
 */

import { Platform } from 'react-native';

const tintColorLight = '#0a7ea4';
const tintColorDark = '#fff';

export const Colors = {
  light: {
    text: '#1E1E1E',
    background: '#FFFFFF',
    primary: '#2563EB',
    secondary: '#4F46E5',
    accent: '#7C3AED',
    error: '#DC2626',
    success: '#10B981',
    warning: '#F59E0B',
    info: '#3B82F6',
    border: '#E5E7EB',
    card: '#FFFFFF',
    notification: '#F43F5E',
    textSecondary: '#6B7280',
    textTertiary: '#9CA3AF',
    backgroundSecondary: '#F9FAFB',
    backgroundTertiary: '#F3F4F6',
  },
  dark: {
    // Pure black theme
    text: '#FFFFFF',
    background: '#000000',
    primary: '#3B82F6',
    secondary: '#6366F1',
    accent: '#8B5CF6',
    error: '#EF4444',
    success: '#10B981',
    warning: '#F59E0B',
    info: '#3B82F6',
    border: '#1F1F1F',
    card: '#0A0A0A',
    notification: '#F43F5E',
    textSecondary: '#A0A0A0',
    textTertiary: '#707070',
    backgroundSecondary: '#0A0A0A',
    backgroundTertiary: '#121212',
  },
};

export const Fonts = Platform.select({
  ios: {
    /** iOS `UIFontDescriptorSystemDesignDefault` */
    sans: 'system-ui',
    /** iOS `UIFontDescriptorSystemDesignSerif` */
    serif: 'ui-serif',
    /** iOS `UIFontDescriptorSystemDesignRounded` */
    rounded: 'ui-rounded',
    /** iOS `UIFontDescriptorSystemDesignMonospaced` */
    mono: 'ui-monospace',
  },
  default: {
    sans: 'normal',
    serif: 'serif',
    rounded: 'normal',
    mono: 'monospace',
  },
  web: {
    sans: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
    serif: "Georgia, 'Times New Roman', serif",
    rounded: "'SF Pro Rounded', 'Hiragino Maru Gothic ProN', Meiryo, 'MS PGothic', sans-serif",
    mono: "SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
  },
});
