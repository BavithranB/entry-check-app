import { Redirect } from 'expo-router';

export default function Index() {
  // Redirect to the default tab (manual in this case)
  return <Redirect href="/(tabs)/manual" />;
}
