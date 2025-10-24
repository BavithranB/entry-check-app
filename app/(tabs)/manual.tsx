import ThemedDialog from '@/components/themed-dialog';
import { useTheme } from '@/contexts/ThemeContext';
import { Ionicons } from '@expo/vector-icons';
import CryptoJS from 'crypto-js';
import Constants from 'expo-constants';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Image, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

// Access environment variables from expo-constants
const APP_SECRET = Constants.expoConfig?.extra?.appSecret;
const API_BASE_URL_RAW = Constants.expoConfig?.extra?.apiBaseUrl;

// Ensure HTTPS is used to avoid CORS redirect issues
const API_BASE_URL = API_BASE_URL_RAW?.replace('http://', 'https://');

/**
 * HMAC-SHA256 implementation using crypto-js
 * Backend computes: HMAC-SHA256(secret, body + timestamp + secret)
 */
async function createSignature(body: string, timestamp: string): Promise<string> {
  const message = body + timestamp + APP_SECRET;
  const key = APP_SECRET;
  
  // Use crypto-js to create HMAC-SHA256
  const hmac = CryptoJS.HmacSHA256(message, key);
  const signature = hmac.toString(CryptoJS.enc.Hex);
  
  return signature;
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
  
  // Dialog state
  const [dialogVisible, setDialogVisible] = useState(false);
  const [dialogTitle, setDialogTitle] = useState('');
  const [dialogMessage, setDialogMessage] = useState('');
  const [dialogType, setDialogType] = useState<'success' | 'error' | 'warning' | 'info'>('info');

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
      setDialogTitle('Error');
      setDialogMessage('Please enter a registration number');
      setDialogType('error');
      setDialogVisible(true);
      return;
    }

    if (!APP_SECRET || !API_BASE_URL) {
      setDialogTitle('Configuration Error');
      setDialogMessage('API is not properly configured');
      setDialogType('error');
      setDialogVisible(true);
      return;
    }

    setIsProcessing(true);

    try {
      // First check if already attended and get student info
      const checkResponse = await sendSignedPost(`${API_BASE_URL}/check_attendance`, { reg_no: trimmedRegNo });
      
      // Extract student info from check response
      const studentName = checkResponse.name || 'Student';
      const studentYear = checkResponse.year || 'N/A';
      const studentDept = checkResponse.department || 'N/A';
      
      // Backend returns status: "attended" or "not attended"
      if (checkResponse.status === "attended") {
        const attendedTime = checkResponse.attended_at || 'earlier';
        setDialogTitle('Already Checked In');
        setDialogMessage(`Name: ${studentName}\nReg No: ${trimmedRegNo}\nYear: ${studentYear}\nDepartment: ${studentDept}\n\nAlready checked in at ${attendedTime}`);
        setDialogType('warning');
        setDialogVisible(true);
        setRegNo('');
      } else {
        // Mark attendance (status is "not attended")
        const markResponse = await sendSignedPost(`${API_BASE_URL}/mark_attendance`, { reg_no: trimmedRegNo });
        
        // Backend returns status: "success" for successful marking
        if (markResponse.status === "success") {
          // Use student info from check response, timestamp from mark response
          const timestamp = markResponse.attended_at || 'Just now';
          
          setDialogTitle('✓ Check-in Successful');
          setDialogMessage(`Name: ${studentName}\nReg No: ${trimmedRegNo}\nYear: ${studentYear}\nDepartment: ${studentDept}\nTime: ${timestamp}`);
          setDialogType('success');
          setDialogVisible(true);
          setLastAdded(trimmedRegNo);
          setRegNo('');
          fetchTotalAttendees();
        }
      }
    } catch (error: any) {
      setDialogTitle('Error');
      setDialogMessage(error.message || 'Failed to process check-in');
      setDialogType('error');
      setDialogVisible(true);
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
            keyboardType="numeric"
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

      {/* Themed Dialog */}
      <ThemedDialog
        visible={dialogVisible}
        title={dialogTitle}
        message={dialogMessage}
        type={dialogType}
        onClose={() => setDialogVisible(false)}
      />
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
