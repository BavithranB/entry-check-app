// app/(tabs)/_layout.tsx
import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { View, StyleSheet, Platform } from 'react-native';
import { ThemeProvider, useTheme } from '@/contexts/ThemeContext';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function TabLayout() {
  const { colors } = useTheme();

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      <Tabs
        screenOptions={{
          headerShown: false,
          tabBarActiveTintColor: colors.primary,
          tabBarInactiveTintColor: colors.textSecondary,
          tabBarStyle: {
            height: Platform.select({ ios: 90, android: 70, default: 60 }),
            paddingTop: 8,
            paddingBottom: Platform.select({ ios: 30, android: 20, default: 10 }),
            borderTopWidth: 1,
            borderTopColor: colors.border,
            backgroundColor: colors.card,
          },
          tabBarLabelStyle: {
            fontSize: 12,
            marginTop: 4,
          },
          tabBarItemStyle: {
            paddingVertical: 8,
          },
        }}
      >
        <Tabs.Screen
          name="manual"
          options={{
            title: 'Manual',
            tabBarIcon: ({ color }) => (
              <View style={styles.tabIconContainer}>
                <Ionicons name="create-outline" size={24} color={color} />
              </View>
            ),
          }}
        />
        <Tabs.Screen
          name="scanner"
          options={{
            title: 'Scanner',
            tabBarIcon: ({ color }) => (
              <View style={styles.tabIconContainer}>
                <Ionicons name="barcode-outline" size={24} color={color} />
              </View>
            ),
          }}
        />
        <Tabs.Screen
          name="stats"
          options={{
            title: 'Stats',
            tabBarIcon: ({ color }) => (
              <View style={styles.tabIconContainer}>
                <Ionicons name="stats-chart-outline" size={24} color={color} />
              </View>
            ),
          }}
        />
      </Tabs>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  tabIconContainer: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
});