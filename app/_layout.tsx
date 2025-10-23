import { DarkTheme, DefaultTheme, ThemeProvider as NavThemeProvider } from '@react-navigation/native';
import { Stack, usePathname } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { ThemeProvider, useTheme } from '../contexts/ThemeContext';
import * as Linking from 'expo-linking';
import { useEffect } from 'react';

// This is the root layout component
export default function RootLayout() {
  return (
    <ThemeProvider>
      <RootLayoutNav />
    </ThemeProvider>
  );
}

function RootLayoutNav() {
  const { colors, isDark } = useTheme();
  const pathname = usePathname();

  // Log the current route for debugging
  useEffect(() => {
    console.log('Current route:', pathname);
  }, [pathname]);

  // Handle deep linking
  useEffect(() => {
    const handleDeepLink = (event: { url: string }) => {
      // Handle deep link URL
      console.log('Deep link:', event.url);
    };

    const subscription = Linking.addEventListener('url', handleDeepLink);
    return () => subscription.remove();
  }, []);

  return (
    <NavThemeProvider value={isDark ? DarkTheme : DefaultTheme}>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      <Stack
        screenOptions={{
          headerShown: false,
        }}
      >
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen 
          name="modal" 
          options={{ 
            presentation: 'modal', 
            title: 'Modal',
            headerShown: true,
          }} 
        />
      </Stack>
    </NavThemeProvider>
  );
}