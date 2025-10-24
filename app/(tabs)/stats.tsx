import { useTheme } from '@/contexts/ThemeContext';
import { Ionicons } from '@expo/vector-icons';
import axios from 'axios';
import Constants from 'expo-constants';
import { useEffect, useState } from 'react';
import { FlatList, Image, RefreshControl, StyleSheet, Text, View } from 'react-native';

// Access environment variables from expo-constants
const APP_SECRET = Constants.expoConfig?.extra?.appSecret;
const API_BASE_URL_RAW = Constants.expoConfig?.extra?.apiBaseUrl;

// Ensure HTTPS is used to avoid CORS redirect issues
const API_BASE_URL = API_BASE_URL_RAW?.replace('http://', 'https://');

// Create axios instance with base configuration
const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

/**
 * Create an HMAC-SHA256 signature exactly like backend logic using Web Crypto API.
 * Backend computes: HMAC-SHA256(secret, body + timestamp + secret)
 */
async function createSignature(body: string, timestamp: string): Promise<string> {
  const message = body + timestamp + APP_SECRET;
  
  // Convert strings to Uint8Array
  const encoder = new TextEncoder();
  const keyData = encoder.encode(APP_SECRET);
  const messageData = encoder.encode(message);
  
  // Import the secret key for HMAC
  const key = await crypto.subtle.importKey(
    'raw',
    keyData,
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  
  // Sign the message
  const signature = await crypto.subtle.sign('HMAC', key, messageData);
  
  // Convert to hex string
  const hashArray = Array.from(new Uint8Array(signature));
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  
  return hashHex;
}

/**
 * Send a signed GET request to your FastAPI endpoint using axios.
 */
async function sendSignedRequest(endpoint: string) {
  try {
    const body = '';  // Empty body for GET requests
    const timestamp = Date.now().toString();
    const signature = await createSignature(body, timestamp);

    const response = await api.get(endpoint, {
      headers: {
        'X-App-Timestamp': timestamp,
        'X-App-Signature': signature,
      }
    });

    return response.data;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      if (error.response) {
        // Server responded with error status
        throw new Error(error.response.data?.detail || `Request failed with status ${error.response.status}`);
      } else if (error.request) {
        // Request made but no response received
        throw new Error('Unable to connect to server. Check your internet connection and API URL.');
      } else {
        // Error setting up the request
        throw new Error(error.message || 'Failed to make request');
      }
    }
    throw error;
  }
}

export default function StatsScreen() {
  const { colors } = useTheme();
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [stats, setStats] = useState({
    total: 0,
    scanned: 0,
    manual: 0,
  });
  const [recentCheckIns, setRecentCheckIns] = useState([]);

  // Fetch stats from the API
  const fetchStats = async () => {
    try {
      if (!APP_SECRET) {
        throw new Error('APP_SECRET is not configured. Check your app.json extra config.');
      }
      if (!API_BASE_URL) {
        throw new Error('API_BASE_URL is not configured. Check your app.json extra config.');
      }

      // Get overall stats
      const statsResponse = await sendSignedRequest('/stats');
      
      // Backend returns { summary: [{ year: number, attended: number }] }
      const totalAttended = statsResponse.summary?.reduce((sum: any, item: any) => sum + (item.attended || 0), 0) || 0;

      // Get recent students (first page)
      const recentResponse = await sendSignedRequest('/recent_students?page=1&per_page=10');
      
      // Backend returns { page, per_page, total, total_pages, students: [...] }
      const newStats = {
        total: recentResponse.total || 0,
        scanned: totalAttended, // We'll use attended as scanned for now
        manual: 0, // Backend doesn't distinguish between scanned and manual
      };
      
      setStats(newStats);

      // Transform API response to match component's data structure
      if (recentResponse.students && Array.isArray(recentResponse.students)) {
        const transformedCheckIns = recentResponse.students.map((student: any, index: number) => {
          // Convert attended_at to time format
          let timeStr = 'N/A';
          if (student.attended_at) {
            try {
              const date = new Date(student.attended_at);
              timeStr = date.toLocaleTimeString('en-US', { 
                hour: 'numeric', 
                minute: '2-digit',
                hour12: true 
              });
            } catch (e) {
              console.error('Error parsing date:', e);
            }
          }

          return {
            id: student.reg_no || index.toString(),
            name: student.name || 'Unknown',
            idNumber: student.reg_no || 'N/A',
            type: 'Scanned', // Backend doesn't distinguish between scanned and manual
            time: timeStr
          };
        });
        setRecentCheckIns(transformedCheckIns);
      }
      
      setError(null);
    } catch (err: any) {
      console.error("Failed to fetch stats:", err.message);
      setError(err.message);
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
              ? { backgroundColor: colors.primary + '20', color: colors.primary }
              : { backgroundColor: colors.secondary + '20', color: colors.secondary }
          ]}
        >
          {item.type}
        </Text>
        <Text style={[styles.checkInTime, { color: colors.textTertiary }]}>{item.time}</Text>
      </View>
    </View>
  );

  const renderEmpty = () => (
    <View style={styles.emptyContainer}>
      <Ionicons name="people-outline" size={48} color={colors.textTertiary} />
      <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
        {error ? error : 'No check-ins yet'}
      </Text>
      {error && (
        <Text style={[styles.retryText, { color: colors.primary }]} onPress={fetchStats}>
          Tap to retry
        </Text>
      )}
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
          <Text style={[styles.summaryNumber, { color: colors.text }]}>{stats.total}</Text>
          <Text style={[styles.summaryLabel, { color: colors.textSecondary }]}>Total</Text>
        </View>
        <View style={[styles.summaryDivider, { backgroundColor: colors.border }]} />
        <View style={styles.summaryItem}>
          <Text style={[styles.summaryNumber, { color: colors.primary }]}>{stats.scanned}</Text>
          <Text style={[styles.summaryLabel, { color: colors.textSecondary }]}>Scanned</Text>
        </View>
        <View style={[styles.summaryDivider, { backgroundColor: colors.border }]} />
        <View style={styles.summaryItem}>
          <Text style={[styles.summaryNumber, { color: colors.secondary }]}>{stats.manual}</Text>
          <Text style={[styles.summaryLabel, { color: colors.textSecondary }]}>Manual</Text>
        </View>
      </View>

      {/* Recent Check-ins List */}
      <View style={styles.listContainer}>
        <FlatList
          data={recentCheckIns}
          renderItem={renderItem}
          keyExtractor={(item, index) => item.id || index.toString()}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={renderEmpty}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={colors.primary}
              colors={[colors.primary]}
            />
          }
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