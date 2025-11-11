/**
 * Below are the colors that are used in the app. The colors are defined in the light and dark mode.
 * There are many other ways to style your app. For example, [Nativewind](https://www.nativewind.dev/), [Tamagui](https://tamagui.dev/), [unistyles](https://reactnativeunistyles.vercel.app), etc.
 */

import { Platform } from 'react-native';

// Extracted/adjusted palette to match the attached CL Halloween logo.
// Dominant colors: black background, pumpkin-orange primary, burnt orange secondary,
// deep purple supporting hue, and off-white/ivory accents for the white CL shapes.
const HALLOWEEN = {
  primary: '#EB5B00', // pumpkin / bright orange (logo triangle)
  secondary: '#B12C00', // burnt orange (darker pumpkin)
  support: '#640D5F', // deep plum/purple (subtle accent in the palette)
  ivory: '#F6F4F3', // off-white for logos and text contrast
  black: '#000000',
};

export const Colors = {
  light: {
    text: '#1E1E1E',
    // Light variant kept mostly for readability; warm parchment with subtle orange tint
    background: '#FFF6F0',
    primary: HALLOWEEN.primary,
    secondary: HALLOWEEN.secondary,
    accent: HALLOWEEN.support,
    error: '#8B0000',
    success: '#0B6A3A',
    warning: HALLOWEEN.primary,
    info: HALLOWEEN.support,
    border: '#ECD9D0',
    card: '#FFF9F6',
    notification: HALLOWEEN.secondary,
    textSecondary: '#6B4A47',
    textTertiary: '#9C857F',
    backgroundSecondary: '#FFF0E2',
    backgroundTertiary: '#FBEFE8',
  },
  dark: {
    // Use pure black to match the logo background and create a creepy canvas.
    text: HALLOWEEN.ivory,
    background: HALLOWEEN.black,
    primary: HALLOWEEN.primary,
    secondary: HALLOWEEN.secondary,
    accent: HALLOWEEN.support,
    error: '#8B0000',
    success: '#0B6A3A',
    warning: HALLOWEEN.primary,
    info: HALLOWEEN.support,
    border: '#120904',
    card: '#0A0A0A',
    notification: HALLOWEEN.secondary,
    textSecondary: '#C9B7B2',
    textTertiary: '#9F8A85',
    backgroundSecondary: '#0A0604',
    backgroundTertiary: '#050303',
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