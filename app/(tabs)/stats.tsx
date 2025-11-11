import { useTheme } from '@/contexts/ThemeContext';
import { Ionicons } from '@expo/vector-icons';
import axios from 'axios';
import Constants from 'expo-constants';
import { useEffect, useState } from 'react';
import { RefreshControl, ScrollView, StyleSheet, Text, View, Image } from 'react-native';

// Access environment variables from expo-constants
const API_BASE_URL_RAW = Constants.expoConfig?.extra?.apiBaseUrl;
const API_BASE_URL = API_BASE_URL_RAW;
// Ensure HTTPS is used to avoid CORS redirect issues
// const API_BASE_URL = API_BASE_URL_RAW?.replace('http://', 'https://');

// Create axios instance with base configuration
const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

interface EventStats {
  [eventName: string]: number;
}

export default function StatsScreen() {
  const { colors } = useTheme();
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [totalAttendees, setTotalAttendees] = useState(0);
  const [eventStats, setEventStats] = useState<EventStats>({});

  const MAX_CAPACITY_PER_EVENT = 100;
  const TOTAL_MAX_CAPACITY = 400;

  // Fetch stats from the API
  const fetchStats = async () => {
    try {
      if (!API_BASE_URL) {
        throw new Error('API_BASE_URL is not configured. Check your app.json extra config.');
      }

      const response = await api.get('/totalcount');
      const data: EventStats = response.data;
      
      // Calculate total attendees
      const total = Object.values(data).reduce((sum, count) => sum + count, 0);
      
      setTotalAttendees(total);
      setEventStats(data);
      setError(null);
    } catch (err: any) {
      console.error("Failed to fetch stats:", err.message);
      if (axios.isAxiosError(err)) {
        if (err.response) {
          setError(err.response.data?.detail || `Request failed with status ${err.response.status}`);
        } else if (err.request) {
          setError('Unable to connect to server. Check your internet connection and API URL.');
        } else {
          setError(err.message || 'Failed to make request');
        }
      } else {
        setError(err.message || 'An error occurred');
      }
    } finally {
      setLoading(false);
    }
  };

  // Initial load
  useEffect(() => {
    fetchStats();
  }, []);

  // Pull-to-refresh handler
  const onRefresh = async () => {
    setRefreshing(true);
    await fetchStats();
    setRefreshing(false);
  };

  // Calculate percentage for progress bar
  const getPercentage = (count: number, max: number) => {
    return Math.min((count / max) * 100, 100);
  };

  // Get color based on capacity percentage
  const getCapacityColor = (percentage: number) => {
    if (percentage >= 90) return '#ef4444'; // red
    if (percentage >= 70) return '#f59e0b'; // amber
    return colors.primary; // default primary color
  };

  const renderEventCard = (eventName: string, count: number) => {
    const percentage = getPercentage(count, MAX_CAPACITY_PER_EVENT);
    const barColor = getCapacityColor(percentage);
    
    // Remove " - CL Flix" suffix if present
    const displayName = eventName.replace(/ - CL Flix$/i, '');

    return (
      <View key={eventName} style={[styles.eventCard, { backgroundColor: colors.card }]}>
        <View style={styles.eventHeader}>
          <Text style={[styles.eventName, { color: colors.text }]} numberOfLines={2}>
            {displayName}
          </Text>
          <View style={styles.eventCount}>
            <Text style={[styles.countNumber, { color: barColor }]}>{count}</Text>
            <Text style={[styles.countTotal, { color: colors.textSecondary }]}>
              /{MAX_CAPACITY_PER_EVENT}
            </Text>
          </View>
        </View>
        
        {/* Progress Bar */}
        <View style={[styles.progressBarContainer, { backgroundColor: colors.border }]}>
          <View 
            style={[
              styles.progressBarFill, 
              { 
                width: `${percentage}%`,
                backgroundColor: barColor 
              }
            ]} 
          />
        </View>
        
        <Text style={[styles.percentageText, { color: colors.textSecondary }]}>
          {percentage.toFixed(1)}% capacity
        </Text>
      </View>
    );
  };

  const renderEmpty = () => (
    <View style={styles.emptyContainer}>
      <Ionicons name="bar-chart-outline" size={48} color={colors.textTertiary} />
      <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
        {error ? error : 'No event data available'}
      </Text>
      {error && (
        <Text style={[styles.retryText, { color: colors.primary }]} onPress={fetchStats}>
          Tap to retry
        </Text>
      )}
    </View>
  );

  const overallPercentage = getPercentage(totalAttendees, TOTAL_MAX_CAPACITY);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <View style={styles.headerTextContainer}>
          <Text style={[styles.title, { color: colors.text }]}>Event Statistics</Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>Live Attendance Tracking</Text>
        </View>
        <Image 
          source={require('../../assets/images/CL-Halloween.png')} 
          style={styles.logo}
          resizeMode="contain"
        />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.primary}
            colors={[colors.primary]}
          />
        }
      >
        {/* Total Summary */}
        <View style={[styles.totalContainer, { backgroundColor: colors.card }]}>
          <View style={styles.totalContent}>
            <Text style={[styles.totalNumber, { color: colors.primary }]}>
              {totalAttendees}
            </Text>
            <Text style={[styles.totalLabel, { color: colors.textSecondary }]}>
              Total Attendees
            </Text>
            <Text style={[styles.capacityLabel, { color: colors.textTertiary }]}>
              out of {TOTAL_MAX_CAPACITY} total capacity
            </Text>
            
            {/* Overall Progress Bar */}
            <View style={[styles.overallProgressContainer, { backgroundColor: colors.border }]}>
              <View 
                style={[
                  styles.overallProgressFill, 
                  { 
                    width: `${overallPercentage}%`,
                    backgroundColor: getCapacityColor(overallPercentage)
                  }
                ]} 
              />
            </View>
            <Text style={[styles.overallPercentage, { color: colors.textSecondary }]}>
              {overallPercentage.toFixed(1)}% overall capacity
            </Text>
          </View>
        </View>

        {/* Event Cards */}
        <View style={styles.eventsContainer}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Event Breakdown</Text>
          
          {Object.keys(eventStats).length > 0 ? (
            Object.entries(eventStats).map(([eventName, count]) => 
              renderEventCard(eventName, count)
            )
          ) : (
            renderEmpty()
          )}
        </View>
      </ScrollView>
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
    minHeight: 100,
  },
  headerTextContainer: {
    flex: 1,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  subtitle: {
    fontSize: 14,
    marginTop: 4,
  },
  logo: {
    width: 100,
    height: 60,
    marginLeft: 12,
  },
  totalContainer: {
    margin: 20,
    borderRadius: 16,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  totalContent: {
    alignItems: 'center',
  },
  totalNumber: {
    fontSize: 56,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  totalLabel: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 4,
  },
  capacityLabel: {
    fontSize: 14,
    marginBottom: 16,
  },
  overallProgressContainer: {
    width: '100%',
    height: 8,
    borderRadius: 4,
    overflow: 'hidden',
    marginTop: 8,
  },
  overallProgressFill: {
    height: '100%',
    borderRadius: 4,
  },
  overallPercentage: {
    fontSize: 14,
    marginTop: 8,
  },
  eventsContainer: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  eventCard: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  eventHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  eventName: {
    fontSize: 16,
    fontWeight: '600',
    flex: 1,
    marginRight: 12,
  },
  eventCount: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  countNumber: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  countTotal: {
    fontSize: 16,
    marginLeft: 2,
  },
  progressBarContainer: {
    height: 6,
    borderRadius: 3,
    overflow: 'hidden',
    marginBottom: 8,
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 3,
  },
  percentageText: {
    fontSize: 13,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 48,
  },
  emptyText: {
    fontSize: 16,
    marginTop: 12,
    textAlign: 'center',
  },
  retryText: {
    fontSize: 14,
    marginTop: 8,
    fontWeight: '600',
  },
});