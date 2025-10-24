import { useTheme } from '@/contexts/ThemeContext';
import { Ionicons } from '@expo/vector-icons';
import Constants from 'expo-constants';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Image, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

// Access environment variables from expo-constants
const APP_SECRET = Constants.expoConfig?.extra?.appSecret;
const API_BASE_URL_RAW = Constants.expoConfig?.extra?.apiBaseUrl;

// Ensure HTTPS is used to avoid CORS redirect issues
const API_BASE_URL = API_BASE_URL_RAW?.replace('http://', 'https://');

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
 * Send a signed POST request to your FastAPI endpoint.
 */
async function sendSignedPost(endpoint: string, payload: any) {
  try {
    const body = JSON.stringify(payload);
    const timestamp = Date.now().toString();
    const signature = await createSignature(body, timestamp);

    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-App-Timestamp": timestamp,
        "X-App-Signature": signature,
      },
      body,
    });

    const contentType = response.headers.get("content-type");
    let data;
    
    if (contentType && contentType.includes("application/json")) {
      data = await response.json();
    } else {
      const text = await response.text();
      throw new Error(`Server returned non-JSON response: ${text}`);
    }

    if (!response.ok) {
      throw new Error(data.detail || `Request failed with status ${response.status}`);
    }

    return data;
  } catch (error: any) {
    if (error.message.includes('Network request failed') || error.message.includes('ERR_FAILED')) {
      throw new Error('Unable to connect to server. Check your internet connection and API URL.');
    }
    throw error;
  }
}

/**
 * Send a signed GET request to your FastAPI endpoint.
 */
async function sendSignedGet(endpoint: string) {
  try {
    const body = '';  // Empty body for GET requests
    const timestamp = Date.now().toString();
    const signature = await createSignature(body, timestamp);

    const response = await fetch(endpoint, {
      method: "GET",
      headers: {
        "X-App-Timestamp": timestamp,
        "X-App-Signature": signature,
      },
    });

    const contentType = response.headers.get("content-type");
    let data;
    
    if (contentType && contentType.includes("application/json")) {
      data = await response.json();
    } else {
      const text = await response.text();
      throw new Error(`Server returned non-JSON response: ${text}`);
    }

    if (!response.ok) {
      throw new Error(data.detail || `Request failed with status ${response.status}`);
    }

    return data;
  } catch (error: any) {
    if (error.message.includes('Network request failed') || error.message.includes('ERR_FAILED')) {
      throw new Error('Unable to connect to server. Check your internet connection and API URL.');
    }
    throw error;
  }
}

export default function ManualEntryScreen() {
  const { colors } = useTheme();
  const [regNo, setRegNo] = useState('');
  const [lastAdded, setLastAdded] = useState('');
  const [totalAttendees, setTotalAttendees] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    fetchTotalAttendees();
  }, []);

  const fetchTotalAttendees = async () => {
    try {
      if (!APP_SECRET || !API_BASE_URL) {
        console.error('API configuration missing');
        return;
      }

      const response = await sendSignedGet(`${API_BASE_URL}/stats`);
      // Backend returns { summary: [{ year: number, attended: number }] }
      const total = response.summary?.reduce((sum: number, item: any) => sum + (item.attended || 0), 0) || 0;
      setTotalAttendees(total);
    } catch (error: any) {
      console.error('Failed to fetch total attendees:', error.message);
    }
  };

  const handleAddEntry = async () => {
    const trimmedRegNo = regNo.trim().toUpperCase();
    
    if (!trimmedRegNo) {
      Alert.alert('Error', 'Please enter a registration number');
      return;
    }

    if (!APP_SECRET || !API_BASE_URL) {
      Alert.alert('Configuration Error', 'API is not properly configured');
      return;
    }

    setIsProcessing(true);

    try {
      // First check if already attended
      const checkResponse = await sendSignedPost(`${API_BASE_URL}/check_attendance`, { reg_no: trimmedRegNo });
      
      // Backend returns status: "attended" or "not attended"
      if (checkResponse.status === "attended") {
        Alert.alert(
          'Already Checked In',
          `${checkResponse.name || trimmedRegNo} has already checked in at ${checkResponse.attended_at || 'earlier'}.`
        );
        setRegNo('');
      } else {
        // Mark attendance
        const markResponse = await sendSignedPost(`${API_BASE_URL}/mark_attendance`, { reg_no: trimmedRegNo });
        
        // Backend returns status: "success" for successful marking
        if (markResponse.status === "success") {
          Alert.alert(
            'Check-in Successful',
            markResponse.message || `${trimmedRegNo} has been checked in successfully!`
          );
          setLastAdded(trimmedRegNo);
          setRegNo('');
          fetchTotalAttendees();
        }
      }
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to process check-in');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <View>
          <Text style={[styles.title, { color: colors.text }]}>Event Check-in</Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>Manual Entry</Text>
        </View>
        <Image 
          source={require('../../assets/images/talentia_logo_version_gold.png')} 
          style={styles.logo}
          resizeMode="contain"
        />
      </View>

      {/* Main Content */}
      <View style={styles.content}>
        <View style={[styles.inputContainer, { backgroundColor: colors.backgroundSecondary }]}>
          <Text style={[styles.label, { color: colors.textSecondary }]}>Registration Number</Text>
          <TextInput
            style={[
              styles.input, 
              { 
                backgroundColor: colors.card, 
                borderColor: colors.border,
                color: colors.text
              }
            ]}
            placeholder="Enter registration number"
            placeholderTextColor={colors.textTertiary}
            value={regNo}
            onChangeText={setRegNo}
            autoCapitalize="characters"
            editable={!isProcessing}
          />
          <TouchableOpacity 
            style={[
              styles.button, 
              { backgroundColor: isProcessing ? colors.textTertiary : colors.primary }
            ]}
            onPress={handleAddEntry}
            disabled={isProcessing}
          >
            {isProcessing ? (
              <ActivityIndicator size="small" color="white" />
            ) : (
              <Ionicons name="add" size={20} color="white" />
            )}
            <Text style={styles.buttonText}>
              {isProcessing ? 'Processing...' : 'Add Entry'}
            </Text>
          </TouchableOpacity>
        </View>

        {lastAdded && (
          <View style={[styles.lastAddedContainer, { backgroundColor: colors.backgroundTertiary }]}>
            <Ionicons name="checkmark-circle" size={20} color={colors.primary} />
            <Text style={[styles.lastAddedText, { color: colors.textSecondary }]}>
              Last added: {lastAdded}
            </Text>
          </View>
        )}

        <View style={[styles.statsContainer, { backgroundColor: colors.backgroundSecondary }]}>
          <Text style={[styles.statsNumber, { color: colors.text }]}>{totalAttendees}</Text>
          <Text style={[styles.statsLabel, { color: colors.textSecondary }]}>Total Attendees</Text>
        </View>
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
  content: {
    flex: 1,
    padding: 20,
  },
  inputContainer: {
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    marginBottom: 8,
  },
  input: {
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    borderWidth: 1,
    marginBottom: 16,
  },
  button: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 14,
    borderRadius: 8,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  lastAddedContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    borderRadius: 8,
    marginBottom: 20,
  },
  lastAddedText: {
    marginLeft: 8,
  },
  statsContainer: {
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
  },
  statsNumber: {
    fontSize: 36,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  statsLabel: {
    fontSize: 14,
  },
});
