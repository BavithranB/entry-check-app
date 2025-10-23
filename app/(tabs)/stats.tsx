import { View, Text, StyleSheet, Image, FlatList } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/contexts/ThemeContext';

// Mock data for recent check-ins
const recentCheckIns = [
  { id: '1', name: 'Bavithran B', idNumber: '310624104039', type: 'Scanned', time: '2:45 PM' },
  { id: '2', name: 'Kevin Denzil', idNumber: '310622104', type: 'Manual', time: '2:32 PM' },
  { id: '3', name: 'Lisa Anderson', idNumber: '2024006', type: 'Scanned', time: '2:28 PM' },
  { id: '4', name: 'David Martinez', idNumber: '2024007', type: 'Scanned', time: '2:25 PM' },
  { id: '5', name: 'Jennifer Taylor', idNumber: '2024008', type: 'Manual', time: '2:22 PM' },
];

export default function StatsScreen() {
  const { colors } = useTheme();

  const renderItem = ({ item }) => (
    <View style={[styles.checkInItem, { backgroundColor: colors.card }]}>
      <View style={styles.checkInInfo}>
        <Text style={[styles.checkInName, { color: colors.text }]}>{item.name}</Text>
        <Text style={[styles.checkInId, { color: colors.textSecondary }]}>
          ID: {item.idNumber}
        </Text>
      </View>
      <View style={styles.checkInMeta}>
        <Text 
          style={[
            styles.checkInType, 
            item.type === 'Scanned' 
              ? { ...styles.scanned, backgroundColor: colors.primary + '20', color: colors.primary }
              : { ...styles.manual, backgroundColor: colors.secondary + '20', color: colors.secondary }
          ]}
        >
          {item.type}
        </Text>
        <Text style={[styles.checkInTime, { color: colors.textTertiary }]}>{item.time}</Text>
      </View>
    </View>
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <View>
          <Text style={[styles.title, { color: colors.text }]}>Event Check-in</Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>Recent Check-ins</Text>
        </View>
        <Image 
          source={require('../../assets/images/talentia_logo_version_gold.png')} 
          style={styles.logo}
          resizeMode="contain"
        />
      </View>

      {/* Stats Summary */}
      <View style={[styles.summaryContainer, { backgroundColor: colors.card }]}>
        <View style={styles.summaryItem}>
          <Text style={[styles.summaryNumber, { color: colors.text }]}>247</Text>
          <Text style={[styles.summaryLabel, { color: colors.textSecondary }]}>Total</Text>
        </View>
        <View style={[styles.summaryDivider, { backgroundColor: colors.border }]} />
        <View style={styles.summaryItem}>
          <Text style={[styles.summaryNumber, { color: colors.primary }]}>198</Text>
          <Text style={[styles.summaryLabel, { color: colors.textSecondary }]}>Scanned</Text>
        </View>
        <View style={[styles.summaryDivider, { backgroundColor: colors.border }]} />
        <View style={styles.summaryItem}>
          <Text style={[styles.summaryNumber, { color: colors.secondary }]}>49</Text>
          <Text style={[styles.summaryLabel, { color: colors.textSecondary }]}>Manual</Text>
        </View>
      </View>

      {/* Recent Check-ins List */}
      <View style={styles.listContainer}>
        <FlatList
          data={recentCheckIns}
          renderItem={renderItem}
          keyExtractor={item => item.id}
          showsVerticalScrollIndicator={false}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  subtitle: {
    fontSize: 16,
    marginTop: 4,
  },
  logo: {
    width: 40,
    height: 40,
  },
  summaryContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    margin: 20,
    borderRadius: 12,
    paddingVertical: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  summaryItem: {
    flex: 1,
    alignItems: 'center',
  },
  summaryNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  summaryLabel: {
    fontSize: 14,
  },
  summaryDivider: {
    width: 1,
    marginVertical: 8,
  },
  listContainer: {
    flex: 1,
    paddingHorizontal: 20,
  },
  checkInItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 1,
  },
  checkInInfo: {
    flex: 1,
  },
  checkInName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  checkInId: {
    fontSize: 14,
  },
  checkInMeta: {
    alignItems: 'flex-end',
  },
  checkInType: {
    fontSize: 12,
    fontWeight: '600',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 4,
  },
  checkInTime: {
    fontSize: 12,
  },
  scanned: {
    backgroundColor: 'rgba(0, 122, 255, 0.1)',
    color: '#007AFF',
  },
  manual: {
    backgroundColor: 'rgba(52, 199, 89, 0.1)',
    color: '#34C759',
  },
});
