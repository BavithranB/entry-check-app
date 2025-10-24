import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { CameraView, Camera } from 'expo-camera';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/contexts/ThemeContext';
import * as Crypto from 'expo-crypto';
import Constants from 'expo-constants';

// Access environment variables from expo-constants
const APP_SECRET = Constants.expoConfig?.extra?.appSecret;
const API_BASE_URL_RAW = Constants.expoConfig?.extra?.apiBaseUrl;

// Ensure HTTPS is used to avoid CORS redirect issues
const API_BASE_URL = API_BASE_URL_RAW?.replace('http://', 'https://');

/**
 * Create an HMAC-SHA256 signature exactly like backend logic.
 */
async function createSignature(body: string, timestamp: string) {
  const message = body + timestamp + APP_SECRET;
  const hash = await Crypto.digestStringAsync(
    Crypto.CryptoDigestAlgorithm.SHA256,
    message
  );
  return hash;
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

export default function ScannerScreen() {
  const { colors } = useTheme();
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [scanned, setScanned] = useState(false);
  const [lastScanned, setLastScanned] = useState('');
  const [cameraActive, setCameraActive] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [totalAttendees, setTotalAttendees] = useState(0);

  useEffect(() => {
    const getCameraPermissions = async () => {
      const { status } = await Camera.requestCameraPermissionsAsync();
      setHasPermission(status === 'granted');
    };

    getCameraPermissions();
    fetchTotalAttendees();
  }, []);

  const fetchTotalAttendees = async () => {
    try {
      if (!APP_SECRET || !API_BASE_URL) {
        console.error('API configuration missing');
        return;
      }

      const response = await sendSignedPost(`${API_BASE_URL}/stats`, {});
      setTotalAttendees(response.total || 0);
    } catch (error: any) {
      console.error('Failed to fetch total attendees:', error.message);
    }
  };

  const checkAttendance = async (regno: string) => {
    try {
      const response = await sendSignedPost(`${API_BASE_URL}/check_attendance`, { regno });
      return response;
    } catch (error) {
      throw error;
    }
  };

  const markAttendance = async (regno: string) => {
    try {
      const response = await sendSignedPost(`${API_BASE_URL}/mark_attendance`, { regno });
      return response;
    } catch (error) {
      throw error;
    }
  };

  const handleBarCodeScanned = async ({ type, data }: { type: string; data: string }) => {
    if (isProcessing) return;
    
    setScanned(true);
    setIsProcessing(true);
    setLastScanned(data);
    setCameraActive(false);
    
    try {
      if (!APP_SECRET || !API_BASE_URL) {
        Alert.alert('Configuration Error', 'API is not properly configured');
        resetScanner();
        return;
      }

      // First check if already attended
      const checkResponse = await checkAttendance(data);
      
      if (checkResponse.attended) {
        Alert.alert(
          'Already Checked In',
          `${checkResponse.name || data} has already checked in.`,
          [
            {
              text: 'OK',
              onPress: () => resetScanner(),
            },
          ]
        );
      } else {
        // Mark attendance
        const markResponse = await markAttendance(data);
        
        Alert.alert(
          'Check-in Successful',
          `${markResponse.name || data} has been checked in successfully!`,
          [
            {
              text: 'OK',
              onPress: () => {
                fetchTotalAttendees();
                resetScanner();
              },
            },
          ]
        );
      }
    } catch (error: any) {
      Alert.alert(
        'Error',
        error.message || 'Failed to process check-in',
        [
          {
            text: 'OK',
            onPress: () => resetScanner(),
          },
        ]
      );
    } finally {
      setIsProcessing(false);
    }
  };

  const resetScanner = () => {
    setScanned(false);
    setCameraActive(true);
  };

  const toggleCamera = () => {
    setCameraActive(!cameraActive);
    if (scanned) {
      setScanned(false);
    }
  };

  if (hasPermission === null) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <Text style={{ color: colors.text }}>Requesting camera permission</Text>
      </View>
    );
  }
  if (hasPermission === false) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <Text style={{ color: colors.text }}>No access to camera</Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <View>
          <Text style={[styles.title, { color: colors.text }]}>Event Check-in</Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>Barcode Scanner</Text>
        </View>
        <Image 
          source={require('../../assets/images/talentia_logo_version_gold.png')} 
          style={styles.logo}
          resizeMode="contain"
        />
      </View>

      <View style={styles.scannerContainer}>
        {cameraActive ? (
          <CameraView
            onBarcodeScanned={scanned ? undefined : handleBarCodeScanned}
            barcodeScannerSettings={{
              barcodeTypes: ['qr', 'pdf417', 'upc_e', 'upc_a', 'code39', 'code128', 'ean8', 'ean13', 'code93', 'codabar', 'itf14'],
            }}
            style={styles.camera}
          >
            <View style={styles.overlay}>
              <View style={[styles.overlayFrame, { borderColor: 'rgba(255, 255, 255, 0.3)' }]} />
              <View style={styles.overlayCorners}>
                <View style={[styles.corner, styles.cornerTopLeft, { borderColor: colors.primary }]} />
                <View style={[styles.corner, styles.cornerTopRight, { borderColor: colors.primary }]} />
                <View style={[styles.corner, styles.cornerBottomLeft, { borderColor: colors.primary }]} />
                <View style={[styles.corner, styles.cornerBottomRight, { borderColor: colors.primary }]} />
              </View>
              {isProcessing && (
                <View style={styles.processingOverlay}>
                  <ActivityIndicator size="large" color={colors.primary} />
                  <Text style={styles.processingText}>Processing...</Text>
                </View>
              )}
            </View>
          </CameraView>
        ) : (
          <View style={[styles.camera, styles.cameraInactive, { backgroundColor: colors.backgroundSecondary }]}>
            <Ionicons name="camera-off" size={48} color={colors.textTertiary} />
            <Text style={[styles.cameraOffText, { color: colors.textSecondary }]}>
              Camera is off
            </Text>
          </View>
        )}

        <TouchableOpacity 
          style={[styles.toggleButton, { backgroundColor: colors.primary }]}
          onPress={toggleCamera}
          disabled={isProcessing}
        >
          <Ionicons 
            name={cameraActive ? 'stop' : 'camera'} 
            size={24} 
            color="#fff" 
          />
          <Text style={styles.toggleButtonText}>
            {cameraActive ? 'Stop Scanning' : 'Start Scanning'}
          </Text>
        </TouchableOpacity>
      </View>

      <View style={[styles.footer, { backgroundColor: colors.card }]}>
        {lastScanned && (
          <View style={[styles.lastScannedContainer, { backgroundColor: colors.backgroundSecondary }]}>
            <Ionicons name="time-outline" size={20} color={colors.textSecondary} />
            <Text style={[styles.lastScannedText, { color: colors.textSecondary }]}>
              Last scanned: {lastScanned}
            </Text>
          </View>
        )}
      </View>

      <View style={styles.statsContainer}>
        <Text style={[styles.statsNumber, { color: colors.text }]}>{totalAttendees}</Text>
        <Text style={[styles.statsLabel, { color: colors.textSecondary }]}>Total Attendees</Text>
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
    width: 100,
    height: 80,
  },
  scannerContainer: {
    flex: 1,
    position: 'relative',
    backgroundColor: '#000',
  },
  camera: {
    flex: 1,
    width: '100%',
  },
  cameraInactive: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  cameraOffText: {
    marginTop: 16,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
  },
  overlayFrame: {
    width: 250,
    height: 250,
    borderWidth: 1,
    borderRadius: 12,
  },
  overlayCorners: {
    ...StyleSheet.absoluteFillObject,
  },
  corner: {
    position: 'absolute',
    width: 30,
    height: 30,
  },
  cornerTopLeft: {
    top: '35%',
    left: '15%',
    borderTopWidth: 2,
    borderLeftWidth: 2,
    borderTopLeftRadius: 8,
  },
  cornerTopRight: {
    top: '35%',
    right: '15%',
    borderTopWidth: 2,
    borderRightWidth: 2,
    borderTopRightRadius: 8,
  },
  cornerBottomLeft: {
    bottom: '35%',
    left: '15%',
    borderBottomWidth: 2,
    borderLeftWidth: 2,
    borderBottomLeftRadius: 8,
  },
  cornerBottomRight: {
    bottom: '35%',
    right: '15%',
    borderBottomWidth: 2,
    borderRightWidth: 2,
    borderBottomRightRadius: 8,
  },
  processingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  processingText: {
    color: '#fff',
    marginTop: 16,
    fontSize: 16,
  },
  footer: {
    padding: 20,
    borderTopWidth: 1,
  },
  toggleButton: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
    borderRadius: 8,
    marginBottom: 16,
  },
  toggleButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  lastScannedContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    borderRadius: 8,
  },
  lastScannedText: {
    marginLeft: 8,
  },
  statsContainer: {
    alignItems: 'center',
    marginBottom: 30,
  },
  statsNumber: {
    fontSize: 36,
    fontWeight: 'bold',
  },
  statsLabel: {
    fontSize: 16,
  },
});