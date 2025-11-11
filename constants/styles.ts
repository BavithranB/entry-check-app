import { StyleSheet } from 'react-native';
import { Colors } from './theme';

export const commonStyles = {
  logo: {
    width: 150,
    height: 75,
    resizeMode: 'contain',
  },
  // Add other common styles here
};

/**
 * Return header styles for a given color set.
 * Default uses the light Colors to preserve existing behavior.
 */
export const getHeaderStyles = (
  colors: typeof Colors.light = Colors.light
) =>
  StyleSheet.create({
    container: {
      paddingTop: 60,
      paddingHorizontal: 20,
      paddingBottom: 20,
      backgroundColor: colors.primary,
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    title: {
      fontSize: 24,
      fontWeight: 'bold',
      color: '#FFFFFF',
    },
    subtitle: {
      fontSize: 16,
      color: colors.secondary,
      marginTop: 4,
    },
  });

// Backwards-compatible default headerStyles
export const headerStyles = getHeaderStyles(Colors.light);