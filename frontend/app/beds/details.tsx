import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Alert,
  ActivityIndicator,
  Linking,
  Modal,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as DocumentPicker from 'expo-document-picker';
import QRCode from 'react-native-qrcode-svg';
import { useAuth } from '../../contexts/AuthContext';
import api from '../../utils/api';
import { COLORS, STATUS_COLORS } from '../../utils/colors';

interface Hospital {
  _id: string;
  name: string;
  address: string;
  city: string;
  phone: string;
  email: string;
  emergency_contact: string;
  available_icu_beds: number;
  available_nicu_beds: number;
  available_general_beds: number;
  total_icu_beds: number;
  total_nicu_beds: number;
  total_general_beds: number;
  status: string;
  accepts_insurance: boolean;
}

export default function HospitalDetailsScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const { user } = useAuth();
  
  const [hospital, setHospital] = useState<Hospital | null>(null);
  const [loading, setLoading] = useState(true);
  const [bookingLoading, setBookingLoading] = useState(false);
  
  // Booking form state
  const [selectedBedType, setSelectedBedType] = useState('ICU');
  const [patientName, setPatientName] = useState(user?.name || '');
  const [patientAge, setPatientAge] = useState('');
  const [emergencyLevel, setEmergencyLevel] = useState('High');
  const [medicalCondition, setMedicalCondition] = useState('');
  const [documents, setDocuments] = useState<any[]>([]);
  const [insuranceNumber, setInsuranceNumber] = useState('');
  
  // Modal states
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [bookingDetails, setBookingDetails] = useState<any>(null);

  useEffect(() => {
    fetchHospital();
  }, [id]);

  const fetchHospital = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/api/hospitals/${id}`);
      setHospital(response.data);
    } catch (error) {
      Alert.alert('Error', 'Failed to load hospital details');
      router.back();
    } finally {
      setLoading(false);
    }
  };

  const handleCall = (phone: string) => {
    Linking.openURL(`tel:${phone}`);
  };

  const handlePickDocument = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ['application/pdf', 'image/*'],
        copyToCacheDirectory: true,
      });
      
      if (result.assets && result.assets[0]) {
        setDocuments([...documents, result.assets[0]]);
        Alert.alert('Success', 'Document added successfully');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to pick document');
    }
  };

  const removeDocument = (index: number) => {
    setDocuments(documents.filter((_, i) => i !== index));
  };

  const handleBookBed = async () => {
    if (!patientName || !patientAge || !medicalCondition) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    setBookingLoading(true);
    try {
      const response = await api.post('/api/bookings', {
        user_id: user?._id,
        hospital_id: id,
        hospital_name: hospital?.name,
        bed_type: selectedBedType,
        patient_name: patientName,
        patient_age: parseInt(patientAge),
        emergency_level: emergencyLevel,
        medical_condition: medicalCondition,
        insurance_number: insuranceNumber || null,
        documents: documents.map(doc => doc.name),
      });

      if (response.data.success) {
        setBookingDetails(response.data.booking);
        setShowBookingModal(false);
        setShowSuccessModal(true);
      }
    } catch (error: any) {
      Alert.alert('Error', error.response?.data?.detail || 'Failed to book bed');
    } finally {
      setBookingLoading(false);
    }
  };

  const getBedAvailability = (type: string) => {
    if (!hospital) return { available: 0, total: 0 };
    switch (type) {
      case 'ICU':
        return { available: hospital.available_icu_beds, total: hospital.total_icu_beds };
      case 'NICU':
        return { available: hospital.available_nicu_beds, total: hospital.total_nicu_beds };
      case 'General':
        return { available: hospital.available_general_beds, total: hospital.total_general_beds };
      default:
        return { available: 0, total: 0 };
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <ActivityIndicator size="large" color={COLORS.primary} style={{ marginTop: 50 }} />
      </SafeAreaView>
    );
  }

  if (!hospital) return null;

  const bedTypes = ['ICU', 'NICU', 'General'];
  const emergencyLevels = ['Critical', 'High', 'Medium', 'Low'];

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <MaterialCommunityIcons name="arrow-left" size={24} color={COLORS.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Hospital Details</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Hospital Info Card */}
        <View style={styles.infoCard}>
          <View style={styles.hospitalHeader}>
            <MaterialCommunityIcons name="hospital-building" size={48} color={COLORS.primary} />
            <View style={styles.hospitalTitleContainer}>
              <Text style={styles.hospitalName}>{hospital.name}</Text>
              <View style={styles.statusBadge}>
                <MaterialCommunityIcons
                  name="circle"
                  size={12}
                  color={STATUS_COLORS[hospital.status] || COLORS.gray}
                />
                <Text style={[styles.statusText, { color: STATUS_COLORS[hospital.status] }]}>
                  {hospital.status}
                </Text>
              </View>
            </View>
          </View>

          <View style={styles.contactRow}>
            <MaterialCommunityIcons name="map-marker" size={18} color={COLORS.gray} />
            <Text style={styles.contactText}>{hospital.address}, {hospital.city}</Text>
          </View>

          <View style={styles.actionButtons}>
            <TouchableOpacity
              style={[styles.actionButton, { backgroundColor: COLORS.primary }]}
              onPress={() => handleCall(hospital.phone)}
            >
              <MaterialCommunityIcons name="phone" size={20} color={COLORS.white} />
              <Text style={styles.actionButtonText}>Call</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.actionButton, { backgroundColor: COLORS.secondary }]}
              onPress={() => Linking.openURL(`mailto:${hospital.email}`)}
            >
              <MaterialCommunityIcons name="email" size={20} color={COLORS.white} />
              <Text style={styles.actionButtonText}>Email</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.actionButton, { backgroundColor: COLORS.red }]}
              onPress={() => handleCall(hospital.emergency_contact)}
            >
              <MaterialCommunityIcons name="phone-alert" size={20} color={COLORS.white} />
              <Text style={styles.actionButtonText}>Emergency</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Bed Availability */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Bed Availability</Text>
          
          <View style={styles.bedGrid}>
            <View style={styles.bedCard}>
              <MaterialCommunityIcons name="bed" size={32} color={COLORS.primary} />
              <Text style={styles.bedLabel}>ICU Beds</Text>
              <Text style={styles.bedCount}>
                {hospital.available_icu_beds}/{hospital.total_icu_beds}
              </Text>
              <Text style={styles.bedStatus}>
                {hospital.available_icu_beds > 0 ? 'Available' : 'Full'}
              </Text>
            </View>

            <View style={styles.bedCard}>
              <MaterialCommunityIcons name="baby-carriage" size={32} color={COLORS.secondary} />
              <Text style={styles.bedLabel}>NICU Beds</Text>
              <Text style={styles.bedCount}>
                {hospital.available_nicu_beds}/{hospital.total_nicu_beds}
              </Text>
              <Text style={styles.bedStatus}>
                {hospital.available_nicu_beds > 0 ? 'Available' : 'Full'}
              </Text>
            </View>

            <View style={styles.bedCard}>
              <MaterialCommunityIcons name="hospital-bed" size={32} color={COLORS.green} />
              <Text style={styles.bedLabel}>General Beds</Text>
              <Text style={styles.bedCount}>
                {hospital.available_general_beds}/{hospital.total_general_beds}
              </Text>
              <Text style={styles.bedStatus}>
                {hospital.available_general_beds > 0 ? 'Available' : 'Full'}
              </Text>
            </View>
          </View>
        </View>

        {/* Facilities */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Facilities</Text>
          <View style={styles.facilitiesList}>
            <View style={styles.facilityItem}>
              <MaterialCommunityIcons name="check-circle" size={20} color={COLORS.green} />
              <Text style={styles.facilityText}>24/7 Emergency Services</Text>
            </View>
            <View style={styles.facilityItem}>
              <MaterialCommunityIcons
                name={hospital.accepts_insurance ? 'check-circle' : 'close-circle'}
                size={20}
                color={hospital.accepts_insurance ? COLORS.green : COLORS.red}
              />
              <Text style={styles.facilityText}>Insurance Accepted</Text>
            </View>
            <View style={styles.facilityItem}>
              <MaterialCommunityIcons name="check-circle" size={20} color={COLORS.green} />
              <Text style={styles.facilityText}>Advanced Medical Equipment</Text>
            </View>
            <View style={styles.facilityItem}>
              <MaterialCommunityIcons name="check-circle" size={20} color={COLORS.green} />
              <Text style={styles.facilityText}>Qualified Medical Staff</Text>
            </View>
          </View>
        </View>

        {/* Book Bed Button */}
        <TouchableOpacity
          style={styles.bookButton}
          onPress={() => setShowBookingModal(true)}
        >
          <MaterialCommunityIcons name="calendar-check" size={24} color={COLORS.white} />
          <Text style={styles.bookButtonText}>Book Bed Now</Text>
        </TouchableOpacity>

        <View style={{ height: 20 }} />
      </ScrollView>

      {/* Booking Modal */}
      <Modal
        visible={showBookingModal}
        animationType="slide"
        transparent={false}
        onRequestClose={() => setShowBookingModal(false)}
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setShowBookingModal(false)}>
              <MaterialCommunityIcons name="close" size={24} color={COLORS.text} />
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Book Bed</Text>
            <View style={{ width: 24 }} />
          </View>

          <ScrollView style={styles.modalContent} showsVerticalScrollIndicator={false}>
            {/* Bed Type Selection */}
            <Text style={styles.label}>Bed Type *</Text>
            <View style={styles.bedTypeContainer}>
              {bedTypes.map((type) => {
                const availability = getBedAvailability(type);
                const isAvailable = availability.available > 0;
                return (
                  <TouchableOpacity
                    key={type}
                    style={[
                      styles.bedTypeButton,
                      selectedBedType === type && styles.bedTypeButtonActive,
                      !isAvailable && styles.bedTypeButtonDisabled,
                    ]}
                    onPress={() => isAvailable && setSelectedBedType(type)}
                    disabled={!isAvailable}
                  >
                    <Text
                      style={[
                        styles.bedTypeText,
                        selectedBedType === type && styles.bedTypeTextActive,
                        !isAvailable && styles.bedTypeTextDisabled,
                      ]}
                    >
                      {type}
                    </Text>
                    <Text style={styles.bedAvailText}>
                      {availability.available}/{availability.total}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Patient Name */}
            <Text style={styles.label}>Patient Name *</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter patient name"
              value={patientName}
              onChangeText={setPatientName}
            />

            {/* Patient Age */}
            <Text style={styles.label}>Patient Age *</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter age"
              value={patientAge}
              onChangeText={setPatientAge}
              keyboardType="numeric"
            />

            {/* Emergency Level */}
            <Text style={styles.label}>Emergency Level *</Text>
            <View style={styles.emergencyContainer}>
              {emergencyLevels.map((level) => (
                <TouchableOpacity
                  key={level}
                  style={[
                    styles.emergencyButton,
                    emergencyLevel === level && styles.emergencyButtonActive,
                  ]}
                  onPress={() => setEmergencyLevel(level)}
                >
                  <Text
                    style={[
                      styles.emergencyText,
                      emergencyLevel === level && styles.emergencyTextActive,
                    ]}
                  >
                    {level}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Medical Condition */}
            <Text style={styles.label}>Medical Condition *</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="Describe the medical condition"
              value={medicalCondition}
              onChangeText={setMedicalCondition}
              multiline
              numberOfLines={4}
            />

            {/* Insurance Number */}
            <Text style={styles.label}>Insurance Number (Optional)</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter insurance number"
              value={insuranceNumber}
              onChangeText={setInsuranceNumber}
            />

            {/* Documents */}
            <Text style={styles.label}>Medical Documents</Text>
            <TouchableOpacity style={styles.uploadButton} onPress={handlePickDocument}>
              <MaterialCommunityIcons name="file-upload" size={24} color={COLORS.primary} />
              <Text style={styles.uploadText}>Upload Document</Text>
            </TouchableOpacity>

            {documents.length > 0 && (
              <View style={styles.documentsList}>
                {documents.map((doc, index) => (
                  <View key={index} style={styles.documentItem}>
                    <MaterialCommunityIcons name="file-document" size={20} color={COLORS.primary} />
                    <Text style={styles.documentName} numberOfLines={1}>
                      {doc.name}
                    </Text>
                    <TouchableOpacity onPress={() => removeDocument(index)}>
                      <MaterialCommunityIcons name="close-circle" size={20} color={COLORS.red} />
                    </TouchableOpacity>
                  </View>
                ))}
              </View>
            )}

            {/* Token Payment Info */}
            <View style={styles.tokenInfo}>
              <MaterialCommunityIcons name="information" size={20} color={COLORS.primary} />
              <Text style={styles.tokenInfoText}>
                A refundable token of $50 will be charged for booking confirmation
              </Text>
            </View>

            {/* Submit Button */}
            <TouchableOpacity
              style={styles.submitButton}
              onPress={handleBookBed}
              disabled={bookingLoading}
            >
              {bookingLoading ? (
                <ActivityIndicator color={COLORS.white} />
              ) : (
                <>
                  <MaterialCommunityIcons name="check" size={24} color={COLORS.white} />
                  <Text style={styles.submitButtonText}>Confirm Booking</Text>
                </>
              )}
            </TouchableOpacity>

            <View style={{ height: 40 }} />
          </ScrollView>
        </SafeAreaView>
      </Modal>

      {/* Success Modal */}
      <Modal
        visible={showSuccessModal}
        animationType="fade"
        transparent={true}
        onRequestClose={() => {
          setShowSuccessModal(false);
          router.replace('/(tabs)/bookings');
        }}
      >
        <View style={styles.successOverlay}>
          <View style={styles.successCard}>
            <MaterialCommunityIcons name="check-circle" size={64} color={COLORS.green} />
            <Text style={styles.successTitle}>Booking Confirmed!</Text>
            <Text style={styles.successSubtitle}>
              Your bed has been successfully booked
            </Text>

            {bookingDetails && (
              <>
                <View style={styles.qrContainer}>
                  <QRCode
                    value={JSON.stringify({
                      bookingId: bookingDetails._id,
                      hospitalName: hospital.name,
                      patientName: patientName,
                      queueNumber: bookingDetails.queue_number,
                    })}
                    size={200}
                  />
                </View>

                <View style={styles.bookingInfo}>
                  <Text style={styles.queueLabel}>Your Queue Number</Text>
                  <Text style={styles.queueNumberLarge}>{bookingDetails.queue_number}</Text>
                  <Text style={styles.waitTime}>
                    Estimated Wait: {bookingDetails.estimated_wait_time || 15} minutes
                  </Text>
                </View>
              </>
            )}

            <TouchableOpacity
              style={styles.doneButton}
              onPress={() => {
                setShowSuccessModal(false);
                router.replace('/(tabs)/bookings');
              }}
            >
              <Text style={styles.doneButtonText}>View My Bookings</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
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
  scrollView: {
    flex: 1,
  },
  infoCard: {
    backgroundColor: COLORS.white,
    margin: 16,
    marginBottom: 8,
    padding: 20,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  hospitalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  hospitalTitleContainer: {
    marginLeft: 16,
    flex: 1,
  },
  hospitalName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: 4,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  statusText: {
    fontSize: 14,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  contactRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 16,
    gap: 8,
  },
  contactText: {
    fontSize: 14,
    color: COLORS.textSecondary,
    flex: 1,
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    borderRadius: 12,
    gap: 6,
  },
  actionButtonText: {
    color: COLORS.white,
    fontSize: 14,
    fontWeight: '600',
  },
  sectionCard: {
    backgroundColor: COLORS.white,
    marginHorizontal: 16,
    marginBottom: 8,
    padding: 20,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: 16,
  },
  bedGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  bedCard: {
    flex: 1,
    backgroundColor: COLORS.lightGray,
    padding: 12,
    borderRadius: 12,
    alignItems: 'center',
  },
  bedLabel: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginTop: 8,
    textAlign: 'center',
  },
  bedCount: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.text,
    marginTop: 4,
  },
  bedStatus: {
    fontSize: 11,
    color: COLORS.green,
    marginTop: 2,
  },
  facilitiesList: {
    gap: 12,
  },
  facilityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  facilityText: {
    fontSize: 14,
    color: COLORS.text,
  },
  bookButton: {
    flexDirection: 'row',
    backgroundColor: COLORS.primary,
    marginHorizontal: 16,
    marginTop: 8,
    padding: 18,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  bookButtonText: {
    color: COLORS.white,
    fontSize: 18,
    fontWeight: 'bold',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  modalContent: {
    flex: 1,
    padding: 16,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
    marginTop: 16,
    marginBottom: 8,
  },
  bedTypeContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  bedTypeButton: {
    flex: 1,
    padding: 12,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: COLORS.border,
    alignItems: 'center',
  },
  bedTypeButtonActive: {
    borderColor: COLORS.primary,
    backgroundColor: COLORS.primaryLight,
  },
  bedTypeButtonDisabled: {
    opacity: 0.5,
  },
  bedTypeText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.textSecondary,
  },
  bedTypeTextActive: {
    color: COLORS.primary,
  },
  bedTypeTextDisabled: {
    color: COLORS.gray,
  },
  bedAvailText: {
    fontSize: 11,
    color: COLORS.gray,
    marginTop: 4,
  },
  input: {
    backgroundColor: COLORS.white,
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    fontSize: 16,
    color: COLORS.text,
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  emergencyContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  emergencyButton: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: COLORS.border,
  },
  emergencyButtonActive: {
    borderColor: COLORS.red,
    backgroundColor: COLORS.redLight,
  },
  emergencyText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.textSecondary,
  },
  emergencyTextActive: {
    color: COLORS.red,
  },
  uploadButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.white,
    padding: 16,
    borderRadius: 12,
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: COLORS.primary,
    gap: 8,
  },
  uploadText: {
    fontSize: 16,
    color: COLORS.primary,
    fontWeight: '600',
  },
  documentsList: {
    marginTop: 12,
    gap: 8,
  },
  documentItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    padding: 12,
    borderRadius: 12,
    gap: 12,
  },
  documentName: {
    flex: 1,
    fontSize: 14,
    color: COLORS.text,
  },
  tokenInfo: {
    flexDirection: 'row',
    backgroundColor: COLORS.primaryLight,
    padding: 16,
    borderRadius: 12,
    marginTop: 20,
    gap: 12,
  },
  tokenInfoText: {
    flex: 1,
    fontSize: 14,
    color: COLORS.text,
    lineHeight: 20,
  },
  submitButton: {
    flexDirection: 'row',
    backgroundColor: COLORS.primary,
    marginTop: 24,
    padding: 18,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  submitButtonText: {
    color: COLORS.white,
    fontSize: 18,
    fontWeight: 'bold',
  },
  successOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  successCard: {
    backgroundColor: COLORS.white,
    borderRadius: 24,
    padding: 32,
    width: '100%',
    maxWidth: 400,
    alignItems: 'center',
  },
  successTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.text,
    marginTop: 16,
  },
  successSubtitle: {
    fontSize: 16,
    color: COLORS.textSecondary,
    marginTop: 8,
    textAlign: 'center',
  },
  qrContainer: {
    marginTop: 24,
    padding: 20,
    backgroundColor: COLORS.white,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: COLORS.border,
  },
  bookingInfo: {
    marginTop: 24,
    alignItems: 'center',
    width: '100%',
  },
  queueLabel: {
    fontSize: 14,
    color: COLORS.textSecondary,
  },
  queueNumberLarge: {
    fontSize: 48,
    fontWeight: 'bold',
    color: COLORS.primary,
    marginTop: 8,
  },
  waitTime: {
    fontSize: 16,
    color: COLORS.textSecondary,
    marginTop: 8,
  },
  doneButton: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: 12,
    marginTop: 24,
    width: '100%',
  },
  doneButtonText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
  },
});

