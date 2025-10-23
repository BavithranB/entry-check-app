import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, FlatList } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

// Screens
function ManualEntryScreen() {
  const [rollNumber, setRollNumber] = React.useState('');
  const [lastAdded, setLastAdded] = React.useState('');
  const [totalAttendees, setTotalAttendees] = React.useState(247);

  const handleAddEntry = () => {
    if (rollNumber.trim()) {
      setLastAdded(rollNumber);
      setRollNumber('');
      setTotalAttendees(prev => prev + 1);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Event Check-in</Text>
        <Text style={styles.subtitle}>Manual Entry</Text>
      </View>

      <View style={styles.content}>
        <View style={styles.inputContainer}>
          <Text style={styles.label}>Roll Number</Text>
          <TextInput
            style={styles.input}
            value={rollNumber}
            onChangeText={setRollNumber}
            placeholder="Enter roll number"
            keyboardType="numeric"
          />
          <TouchableOpacity style={styles.button} onPress={handleAddEntry}>
            <Ionicons name="add" size={20} color="white" />
            <Text style={styles.buttonText}>Add Entry</Text>
          </TouchableOpacity>
        </View>

        {lastAdded ? (
          <View style={styles.lastAddedContainer}>
            <Ionicons name="time-outline" size={20} color="#666" />
            <Text style={styles.lastAddedText}>Last added: {lastAdded}</Text>
          </View>
        ) : null}

        <View style={styles.statsContainer}>
          <Text style={styles.statsNumber}>{totalAttendees}</Text>
          <Text style={styles.statsLabel}>Total Attendees</Text>
        </View>
      </View>
    </View>
  );
}

function ScannerScreen() {
  // This would be implemented with a barcode scanner in a real app
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Event Check-in</Text>
        <Text style={styles.subtitle}>Barcode Scanner</Text>
      </View>

      <View style={styles.scannerContainer}>
        <View style={styles.scannerPlaceholder}>
          <Text style={styles.scannerText}>Barcode Scanner View</Text>
        </View>
        <TouchableOpacity style={[styles.button, { marginTop: 20 }]}>
          <Ionicons name="add" size={20} color="white" />
          <Text style={styles.buttonText}>Add Entry</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.statsContainer}>
        <Text style={styles.statsNumber}>247</Text>
        <Text style={styles.statsLabel}>Total Attendees</Text>
      </View>
    </View>
  );
}

function StatsScreen() {
  // Mock data for recent check-ins
  const recentCheckIns = [
    { id: '1', name: 'Bavithran B', idNumber: '310624104039', type: 'Scanned', time: '2:45 PM' },
    { id: '2', name: 'Kevin Denzil', idNumber: '310622104', type: 'Manual', time: '2:32 PM' },
    { id: '3', name: 'Lisa Anderson', idNumber: '2024006', type: 'Scanned', time: '2:28 PM' },
    { id: '4', name: 'David Martinez', idNumber: '2024007', type: 'Scanned', time: '2:25 PM' },
    { id: '5', name: 'Jennifer Taylor', idNumber: '2024008', type: 'Manual', time: '2:22 PM' },
  ];

  const renderItem = ({ item }) => (
    <View style={styles.checkInItem}>
      <View style={styles.checkInInfo}>
        <Text style={styles.checkInName}>{item.name}</Text>
        <Text style={styles.checkInId}>ID: {item.idNumber}</Text>
      </View>
      <View style={styles.checkInMeta}>
        <Text style={styles.checkInType}>{item.type}</Text>
        <Text style={styles.checkInTime}>{item.time}</Text>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Event Check-in</Text>
        <Text style={styles.subtitle}>Recent Check-ins</Text>
      </View>

      <FlatList
        data={recentCheckIns}
        renderItem={renderItem}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.checkInList}
      />
    </View>
  );
}

// Navigation
const Tab = createBottomTabNavigator();

function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;

          if (route.name === 'Manual') {
            iconName = focused ? 'create' : 'create-outline';
          } else if (route.name === 'Scanner') {
            iconName = focused ? 'barcode' : 'barcode-outline';
          } else if (route.name === 'Stats') {
            iconName = focused ? 'stats-chart' : 'stats-chart-outline';
          }

          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: '#007AFF',
        tabBarInactiveTintColor: 'gray',
        headerShown: false,
      })}
    >
      <Tab.Screen name="Manual" component={ManualEntryScreen} />
      <Tab.Screen name="Scanner" component={ScannerScreen} />
      <Tab.Screen name="Stats" component={StatsScreen} />
    </Tab.Navigator>
  );
}

// App Component
export default function App() {
  return (
    <NavigationContainer>
      <MainTabs />
    </NavigationContainer>
  );
}

// Styles
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    paddingTop: 50,
    paddingHorizontal: 24,
    paddingBottom: 20,
    backgroundColor: '#f8f8f8',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
  },
  content: {
    flex: 1,
    padding: 24,
  },
  inputContainer: {
    marginBottom: 24,
  },
  label: {
    fontSize: 16,
    marginBottom: 8,
    color: '#333',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 16,
    fontSize: 16,
    marginBottom: 16,
  },
  button: {
    backgroundColor: '#007AFF',
    padding: 16,
    borderRadius: 8,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  lastAddedContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
    padding: 16,
    backgroundColor: '#f8f8f8',
    borderRadius: 8,
  },
  lastAddedText: {
    marginLeft: 8,
    color: '#666',
  },
  statsContainer: {
    alignItems: 'center',
    marginTop: 'auto',
    marginBottom: 40,
  },
  statsNumber: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#007AFF',
  },
  statsLabel: {
    fontSize: 16,
    color: '#666',
    marginTop: 8,
  },
  scannerContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  scannerPlaceholder: {
    width: '100%',
    aspectRatio: 1,
    backgroundColor: '#f0f0f0',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scannerText: {
    color: '#999',
    fontSize: 16,
  },
  checkInList: {
    padding: 16,
  },
  checkInItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  checkInInfo: {
    flex: 1,
  },
  checkInName: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 4,
  },
  checkInId: {
    fontSize: 14,
    color: '#666',
  },
  checkInMeta: {
    alignItems: 'flex-end',
  },
  checkInType: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  checkInTime: {
    fontSize: 14,
    color: '#999',
  },
});
