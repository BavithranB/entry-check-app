import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity, Alert } from 'react-native';
import { CameraView, Camera } from 'expo-camera';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/contexts/ThemeContext';

export default function ScannerScreen() {
  const { colors } = useTheme();
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [scanned, setScanned] = useState(false);
  const [lastScanned, setLastScanned] = useState('');
  const [cameraActive, setCameraActive] = useState(true);

  useEffect(() => {
    const getCameraPermissions = async () => {
      const { status } = await Camera.requestCameraPermissionsAsync();
      setHasPermission(status === 'granted');
    };

    getCameraPermissions();
  }, []);

  const handleBarCodeScanned = ({ type, data }: { type: string; data: string }) => {
    setScanned(true);
    setLastScanned(data);
    setCameraActive(false);
    
    // Show alert with scanned data
    Alert.alert(
      'Barcode Scanned',
      `Type: ${type}\nData: ${data}`,
      [
        {
          text: 'OK',
          onPress: () => {
            setScanned(false);
            setCameraActive(true);
          },
        },
      ]
    );
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
            <Ionicons name="time-outline" size={20} color="#666" />
            <Text style={[styles.lastScannedText, { color: colors.textSecondary }]}>
              Last scanned: {lastScanned}
            </Text>
          </View>
        )}
      </View>

      <View style={styles.statsContainer}>
        <Text style={styles.statsNumber}>247</Text>
        <Text style={styles.statsLabel}>Total Attendees</Text>
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
    color: '#000',
  },
  statsLabel: {
    fontSize: 16,
    color: '#666',
  },
});
