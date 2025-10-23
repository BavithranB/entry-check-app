import { View, Text, TextInput, TouchableOpacity, StyleSheet, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/contexts/ThemeContext';

export default function ManualEntryScreen() {
  const { colors } = useTheme();

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
          <Text style={[styles.label, { color: colors.textSecondary }]}>Roll Number</Text>
          <TextInput
            style={[
              styles.input, 
              { 
                backgroundColor: colors.card, 
                borderColor: colors.border,
                color: colors.text
              }
            ]}
            placeholder="Enter roll number"
            placeholderTextColor={colors.textTertiary}
          />
          <TouchableOpacity style={[styles.button, { backgroundColor: colors.primary }]}>
            <Ionicons name="add" size={20} color="white" />
            <Text style={styles.buttonText}>Add Entry</Text>
          </TouchableOpacity>
        </View>

        <View style={[styles.lastAddedContainer, { backgroundColor: colors.backgroundTertiary }]}>
          <Ionicons name="time-outline" size={20} color={colors.textTertiary} />
          <Text style={[styles.lastAddedText, { color: colors.textSecondary }]}>
            Last added: 310624104039
          </Text>
        </View>

        <View style={[styles.statsContainer, { backgroundColor: colors.backgroundSecondary }]}>
          <Text style={[styles.statsNumber, { color: colors.text }]}>247</Text>
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
