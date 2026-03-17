import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  TextInput,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useAuth } from '../../contexts/AuthContext';
import api from '../../utils/api';
import { COLORS } from '../../utils/colors';

export default function AmbulanceRequestScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);

  // Form fields
  const [patientName, setPatientName] = useState(user?.name || '');
  const [pickupAddress, setPickupAddress] = useState('');
  const [condition, setCondition] = useState('');
  const [emergencyLevel, setEmergencyLevel] = useState('High');

  const emergencyLevels = ['Critical', 'High', 'Medium'];

  const handleRequest = async () => {
    if (!patientName || !pickupAddress || !condition) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    setLoading(true);
    try {
      // Mock location for demo (in real app, use expo-location)
      const response = await api.post('/api/ambulance/request', {
        user_id: user?._id,
        pickup_latitude: 40.7128,
        pickup_longitude: -74.0060,
        pickup_address: pickupAddress,
        patient_name: patientName,
        patient_condition: condition,
        emergency_level: emergencyLevel,
      });

      if (response.data.success) {
        Alert.alert(
          'Ambulance Dispatched!',
          `Your ambulance is on the way. ETA: ${response.data.ambulance.eta_minutes} minutes`,
          [
            {
              text: 'Track Ambulance',
              onPress: () => router.replace(`/ambulance/track?id=${response.data.ambulance._id}`),
            },
          ]
        );
      }
    } catch (error: any) {
      Alert.alert(
        'Error',
        error.response?.data?.detail || 'Failed to request ambulance. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <MaterialCommunityIcons name="arrow-left" size={24} color={COLORS.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Request Ambulance</Text>
        <View style={{ width: 40 }} />
      </View>

      {/* Emergency Banner */}
      <View style={styles.emergencyBanner}>
        <MaterialCommunityIcons name="ambulance" size={32} color={COLORS.white} />
        <Text style={styles.emergencyText}>Emergency Response</Text>
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.formContainer}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Patient Name */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Patient Name *</Text>
            <View style={styles.inputContainer}>
              <MaterialCommunityIcons name="account" size={20} color={COLORS.gray} />
              <TextInput
                style={styles.input}
                placeholder="Enter patient name"
                value={patientName}
                onChangeText={setPatientName}
              />
            </View>
          </View>

          {/* Pickup Address */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Pickup Address *</Text>
            <View style={styles.inputContainer}>
              <MaterialCommunityIcons name="map-marker" size={20} color={COLORS.gray} />
              <TextInput
                style={styles.input}
                placeholder="Enter pickup location"
                value={pickupAddress}
                onChangeText={setPickupAddress}
                multiline
              />
            </View>
          </View>

          {/* Patient Condition */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Patient Condition *</Text>
            <View style={styles.inputContainer}>
              <MaterialCommunityIcons name="clipboard-text" size={20} color={COLORS.gray} />
              <TextInput
                style={styles.input}
                placeholder="Describe the condition"
                value={condition}
                onChangeText={setCondition}
                multiline
                numberOfLines={3}
              />
            </View>
          </View>

          {/* Emergency Level */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Emergency Level *</Text>
            <View style={styles.levelContainer}>
              {emergencyLevels.map((level) => (
                <TouchableOpacity
                  key={level}
                  style={[
                    styles.levelButton,
                    emergencyLevel === level && styles.levelButtonActive,
                  ]}
                  onPress={() => setEmergencyLevel(level)}
                >
                  <Text
                    style={[
                      styles.levelText,
                      emergencyLevel === level && styles.levelTextActive,
                    ]}
                  >
                    {level}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Info Box */}
          <View style={styles.infoBox}>
            <MaterialCommunityIcons name="information" size={20} color={COLORS.primary} />
            <Text style={styles.infoText}>
              An ambulance will be dispatched immediately upon request confirmation.
            </Text>
          </View>

          {/* Request Button */}
          <TouchableOpacity
            style={styles.requestButton}
            onPress={handleRequest}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color={COLORS.white} />
            ) : (
              <>
                <MaterialCommunityIcons name="ambulance" size={24} color={COLORS.white} />
                <Text style={styles.requestButtonText}>Request Ambulance Now</Text>
              </>
            )}
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.lightGray,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  emergencyBanner: {
    backgroundColor: COLORS.red,
    padding: 20,
    alignItems: 'center',
  },
  emergencyText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.white,
    marginTop: 8,
  },
  formContainer: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
  },
  inputGroup: {
    marginBottom: 24,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 8,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: COLORS.text,
  },
  levelContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  levelButton: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 12,
    backgroundColor: COLORS.white,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: COLORS.border,
  },
  levelButtonActive: {
    backgroundColor: COLORS.red,
    borderColor: COLORS.red,
  },
  levelText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text,
  },
  levelTextActive: {
    color: COLORS.white,
  },
  infoBox: {
    flexDirection: 'row',
    backgroundColor: '#E3F2FD',
    padding: 16,
    borderRadius: 12,
    gap: 12,
    marginBottom: 24,
  },
  infoText: {
    flex: 1,
    fontSize: 14,
    color: COLORS.text,
    lineHeight: 20,
  },
  requestButton: {
    flexDirection: 'row',
    backgroundColor: COLORS.red,
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    shadowColor: COLORS.red,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  requestButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.white,
  },
});
