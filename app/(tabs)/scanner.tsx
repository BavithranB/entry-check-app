import ThemedDialog from '@/components/themed-dialog';
import { useTheme } from '@/contexts/ThemeContext';
import { Ionicons } from '@expo/vector-icons';
import { Camera, CameraView } from 'expo-camera';
import Constants from 'expo-constants';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

const API_BASE_URL_RAW = Constants.expoConfig?.extra?.apiBaseUrl;
const API_BASE_URL = API_BASE_URL_RAW?.replace('http://', 'https://');

/**
 * Mark attendance with encrypted ID
 */
async function markAttendance(encryptedId: string) {
  try {
    const response = await fetch(`${API_BASE_URL}/attendance_mark`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ encrypted_id: encryptedId }),
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
      throw new Error(data.detail || data.message || `Request failed with status ${response.status}`);
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
  const [lastScannedName, setLastScannedName] = useState('');
  const [cameraActive, setCameraActive] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [totalAttendees, setTotalAttendees] = useState(0);
  
  // Dialog state
  const [dialogVisible, setDialogVisible] = useState(false);
  const [dialogTitle, setDialogTitle] = useState('');
  const [dialogMessage, setDialogMessage] = useState('');
  const [dialogType, setDialogType] = useState<'success' | 'error' | 'warning' | 'info'>('info');
  const [studentDetails, setStudentDetails] = useState<any>(null);

  useEffect(() => {
    const getCameraPermissions = async () => {
      const { status } = await Camera.requestCameraPermissionsAsync();
      setHasPermission(status === 'granted');
    };

    getCameraPermissions();
  }, []);

  const handleBarCodeScanned = async ({ type, data }: { type: string; data: string }) => {
    if (isProcessing || scanned) return;
    
    setScanned(true);
    setIsProcessing(true);
    
    try {
      if (!API_BASE_URL) {
        setDialogTitle('Configuration Error');
        setDialogMessage('API is not properly configured');
        setDialogType('error');
        setDialogVisible(true);
        setIsProcessing(false);
        return;
      }

      const response = await markAttendance(data);
      
      // Store student details for display
      const details = {
        name: response.name || 'N/A',
        dept: response.dept || 'N/A',
        year: response.year || 'N/A',
        sec: response.sec || 'N/A',
        eventName: response.event_name || 'Event',
      };
      setStudentDetails(details);
      setLastScannedName(details.name);

      if (response.status === "already scanned") {
        setDialogTitle('Already Checked In');
        setDialogMessage(response.message || 'This QR code has already been scanned');
        setDialogType('warning');
        setDialogVisible(true);
      } else if (response.status === "success") {
        setDialogTitle('✓ Check-in Successful');
        setDialogMessage(response.message || 'Attendance marked successfully');
        setDialogType('success');
        setDialogVisible(true);
        setTotalAttendees(prev => prev + 1);
      } else {
        setDialogTitle('Unknown Status');
        setDialogMessage(response.message || 'Unknown response from server');
        setDialogType('info');
        setDialogVisible(true);
      }
      
      setIsProcessing(false);
    } catch (error: any) {
      setDialogTitle('Error');
      setDialogMessage(error.message || 'Failed to process check-in');
      setDialogType('error');
      setDialogVisible(true);
      setIsProcessing(false);
      setStudentDetails(null);
    }
  };

  const handleDialogClose = () => {
    setDialogVisible(false);
    setStudentDetails(null);
    resetScanner();
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
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={[styles.permissionText, { color: colors.text }]}>
          Requesting camera permission...
        </Text>
      </View>
    );
  }

  if (hasPermission === false) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <Ionicons name="camera-off-outline" size={64} color={colors.textTertiary} />
        <Text style={[styles.permissionText, { color: colors.text }]}>
          No access to camera
        </Text>
        <Text style={[styles.permissionSubtext, { color: colors.textSecondary }]}>
          Please grant camera permission in settings
        </Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <View style={styles.headerTextContainer}>
          <Text style={[styles.title, { color: colors.text }]}>Event Check-in</Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
            Scan QR Code to Mark Attendance
          </Text>
        </View>
        <Image 
          source={require('../../assets/images/CL-Halloween.png')} 
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
              
              {!isProcessing && !scanned && (
                <View style={styles.scanPrompt}>
                  <Ionicons name="scan-outline" size={32} color="#fff" />
                  <Text style={styles.scanPromptText}>
                    Position QR code within the frame
                  </Text>
                </View>
              )}

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
            <Ionicons name="camera-outline" size={64} color={colors.textTertiary} />
            <Text style={[styles.cameraOffText, { color: colors.textSecondary }]}>
              Camera is off
            </Text>
            <Text style={[styles.cameraOffSubtext, { color: colors.textTertiary }]}>
              Tap "Start Scanning" to begin
            </Text>
          </View>
        )}
      </View>

      <View style={[styles.footer, { backgroundColor: colors.card, borderTopColor: colors.border }]}>
        <TouchableOpacity 
          style={[
            styles.toggleButton, 
            { backgroundColor: cameraActive ? colors.error : colors.primary }
          ]}
          onPress={toggleCamera}
          disabled={isProcessing}
        >
          <Ionicons 
            name={cameraActive ? 'stop-circle' : 'play-circle'} 
            size={24} 
            color="#fff" 
          />
          <Text style={styles.toggleButtonText}>
            {cameraActive ? 'Stop Scanning' : 'Start Scanning'}
          </Text>
        </TouchableOpacity>

        {lastScannedName && (
          <View style={[styles.lastScannedContainer, { backgroundColor: colors.backgroundSecondary }]}>
            <Ionicons name="checkmark-circle" size={20} color={colors.success} />
            <Text style={[styles.lastScannedText, { color: colors.textSecondary }]} numberOfLines={1}>
              Last scanned: {lastScannedName}
            </Text>
          </View>
        )}

        <View style={styles.statsContainer}>
          <View style={[styles.statsCard, { backgroundColor: colors.backgroundSecondary }]}>
            <Text style={[styles.statsNumber, { color: colors.primary }]}>
              {totalAttendees}
            </Text>
            <Text style={[styles.statsLabel, { color: colors.textSecondary }]}>
              Scanned on This Device
            </Text>
          </View>
        </View>
      </View>

      {/* Custom Dialog with Student Details */}
      {dialogVisible && studentDetails && (
        <View style={styles.customDialogOverlay}>
          <View style={[styles.customDialog, { backgroundColor: colors.card }]}>
            {/* Header with Icon */}
            <View style={[
              styles.dialogHeader,
              { backgroundColor: dialogType === 'warning' ? 'rgba(251, 191, 36, 0.1)' : 'rgba(34, 197, 94, 0.1)' }
            ]}>
              <Ionicons 
                name={dialogType === 'warning' ? 'warning' : 'checkmark-circle'} 
                size={64} 
                color={dialogType === 'warning' ? '#fbbf24' : '#22c55e'} 
              />
            </View>

            {/* Title */}
            <Text style={[styles.dialogTitle, { color: colors.text }]}>
              {dialogTitle}
            </Text>

            {/* Student Details Card */}
            <View style={[styles.detailsCard, { backgroundColor: colors.backgroundSecondary }]}>
              <View style={styles.detailRow}>
                <Ionicons name="person" size={20} color={colors.primary} />
                <View style={styles.detailContent}>
                  <Text style={[styles.detailLabel, { color: colors.textTertiary }]}>Name</Text>
                  <Text style={[styles.detailValue, { color: colors.text }]}>{studentDetails.name}</Text>
                </View>
              </View>

              <View style={[styles.detailRow, styles.detailRowBorder, { borderTopColor: colors.border }]}>
                <Ionicons name="school" size={20} color={colors.primary} />
                <View style={styles.detailContent}>
                  <Text style={[styles.detailLabel, { color: colors.textTertiary }]}>Department</Text>
                  <Text style={[styles.detailValue, { color: colors.text }]}>{studentDetails.dept}</Text>
                </View>
              </View>

              <View style={[styles.detailRow, styles.detailRowBorder, { borderTopColor: colors.border }]}>
                <Ionicons name="calendar" size={20} color={colors.primary} />
                <View style={styles.detailContent}>
                  <Text style={[styles.detailLabel, { color: colors.textTertiary }]}>Year & Section</Text>
                  <Text style={[styles.detailValue, { color: colors.text }]}>
                    Year {studentDetails.year} - Section {studentDetails.sec}
                  </Text>
                </View>
              </View>

              <View style={[styles.detailRow, styles.detailRowBorder, { borderTopColor: colors.border }]}>
                <Ionicons name="trophy" size={20} color={colors.primary} />
                <View style={styles.detailContent}>
                  <Text style={[styles.detailLabel, { color: colors.textTertiary }]}>Event</Text>
                  <Text style={[styles.detailValue, { color: colors.text }]}>{studentDetails.eventName}</Text>
                </View>
              </View>
            </View>

            {/* Message */}
            <Text style={[styles.dialogMessage, { color: colors.textSecondary }]}>
              {dialogMessage}
            </Text>

            {/* Close Button */}
            <TouchableOpacity 
              style={[styles.dialogButton, { backgroundColor: colors.primary }]}
              onPress={handleDialogClose}
            >
              <Text style={styles.dialogButtonText}>Continue</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* Fallback Dialog (for errors without student details) */}
      {dialogVisible && !studentDetails && (
        <ThemedDialog
          visible={true}
          title={dialogTitle}
          message={dialogMessage}
          type={dialogType}
          onClose={handleDialogClose}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  permissionText: {
    fontSize: 18,
    fontWeight: '600',
    marginTop: 16,
  },
  permissionSubtext: {
    fontSize: 14,
    marginTop: 8,
    textAlign: 'center',
    paddingHorizontal: 32,
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
    fontSize: 18,
    fontWeight: '600',
  },
  cameraOffSubtext: {
    marginTop: 8,
    fontSize: 14,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
  },
  overlayFrame: {
    width: 250,
    height: 250,
    borderWidth: 2,
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
    borderTopWidth: 3,
    borderLeftWidth: 3,
    borderTopLeftRadius: 8,
  },
  cornerTopRight: {
    top: '35%',
    right: '15%',
    borderTopWidth: 3,
    borderRightWidth: 3,
    borderTopRightRadius: 8,
  },
  cornerBottomLeft: {
    bottom: '35%',
    left: '15%',
    borderBottomWidth: 3,
    borderLeftWidth: 3,
    borderBottomLeftRadius: 8,
  },
  cornerBottomRight: {
    bottom: '35%',
    right: '15%',
    borderBottomWidth: 3,
    borderRightWidth: 3,
    borderBottomRightRadius: 8,
  },
  scanPrompt: {
    position: 'absolute',
    bottom: '25%',
    alignItems: 'center',
  },
  scanPromptText: {
    color: '#fff',
    marginTop: 12,
    fontSize: 14,
    fontWeight: '500',
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
    fontWeight: '600',
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
    borderRadius: 12,
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
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  lastScannedText: {
    marginLeft: 8,
    fontSize: 14,
    flex: 1,
  },
  statsContainer: {
    alignItems: 'center',
  },
  statsCard: {
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 12,
    alignItems: 'center',
    minWidth: 200,
  },
  statsNumber: {
    fontSize: 42,
    fontWeight: 'bold',
  },
  statsLabel: {
    fontSize: 14,
    marginTop: 4,
    fontWeight: '500',
    textAlign: 'center',
  },
  // Custom Dialog Styles
  customDialogOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  customDialog: {
    width: '100%',
    maxWidth: 400,
    borderRadius: 16,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  dialogHeader: {
    alignItems: 'center',
    padding: 20,
    borderRadius: 12,
    marginBottom: 20,
  },
  dialogTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 20,
  },
  detailsCard: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
  },
  detailRowBorder: {
    borderTopWidth: 1,
  },
  detailContent: {
    marginLeft: 12,
    flex: 1,
  },
  detailLabel: {
    fontSize: 12,
    fontWeight: '500',
    marginBottom: 4,
  },
  detailValue: {
    fontSize: 16,
    fontWeight: '600',
  },
  dialogMessage: {
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 20,
  },
  dialogButton: {
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  dialogButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});