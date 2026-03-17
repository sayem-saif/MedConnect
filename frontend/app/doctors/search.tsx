import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  ScrollView,
  TextInput,
  FlatList,
  ActivityIndicator,
  Modal,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useAuth } from '../../contexts/AuthContext';
import api from '../../utils/api';
import { COLORS } from '../../utils/colors';

interface Doctor {
  _id: string;
  name: string;
  specialization: string;
  hospital: string;
  experience: number;
  rating: number;
  reviews: number;
  availability: string;
  consultation_fee: number;
  qualifications: string[];
  phone: string;
  available_slots: string[];
}

export default function DoctorSearchScreen() {
  const router = useRouter();
  const { user } = useAuth();
  
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSpecialization, setSelectedSpecialization] = useState('');
  const [selectedDoctor, setSelectedDoctor] = useState<Doctor | null>(null);
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState('');
  const [bookingLoading, setBookingLoading] = useState(false);

  const specializations = [
    'All',
    'Cardiologist',
    'Neurologist',
    'Pediatrician',
    'Orthopedic',
    'Dermatologist',
    'Gynecologist',
    'Psychiatrist',
    'General Physician',
  ];

  useEffect(() => {
    searchDoctors();
  }, [selectedSpecialization]);

  const searchDoctors = async () => {
    setLoading(true);
    try {
      const params: any = {};
      if (selectedSpecialization && selectedSpecialization !== 'All') {
        params.specialization = selectedSpecialization;
      }
      if (searchQuery) {
        params.search = searchQuery;
      }

      const response = await api.get('/api/doctors/search', { params });
      setDoctors(response.data.doctors || []);
    } catch (error) {
      console.error('Failed to search doctors:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleBookAppointment = (doctor: Doctor) => {
    setSelectedDoctor(doctor);
    setShowBookingModal(true);
  };

  const confirmBooking = async () => {
    if (!selectedSlot) {
      Alert.alert('Error', 'Please select a time slot');
      return;
    }

    setBookingLoading(true);
    try {
      const response = await api.post('/api/appointments/book', {
        user_id: user?._id,
        doctor_id: selectedDoctor?._id,
        doctor_name: selectedDoctor?.name,
        specialization: selectedDoctor?.specialization,
        hospital: selectedDoctor?.hospital,
        appointment_time: selectedSlot,
        consultation_fee: selectedDoctor?.consultation_fee,
      });

      if (response.data.success) {
        Alert.alert(
          'Success',
          'Appointment booked successfully! You will receive a confirmation shortly.',
          [
            {
              text: 'OK',
              onPress: () => {
                setShowBookingModal(false);
                setSelectedSlot('');
              },
            },
          ]
        );
      }
    } catch (error: any) {
      Alert.alert('Error', error.response?.data?.detail || 'Failed to book appointment');
    } finally {
      setBookingLoading(false);
    }
  };

  const renderDoctor = ({ item }: { item: Doctor }) => (
    <TouchableOpacity
      style={styles.doctorCard}
      onPress={() => handleBookAppointment(item)}
    >
      <View style={styles.doctorHeader}>
        <View style={styles.doctorAvatar}>
          <MaterialCommunityIcons name="doctor" size={32} color={COLORS.white} />
        </View>
        <View style={styles.doctorInfo}>
          <Text style={styles.doctorName}>Dr. {item.name}</Text>
          <Text style={styles.specialization}>{item.specialization}</Text>
          <View style={styles.ratingRow}>
            <MaterialCommunityIcons name="star" size={16} color={COLORS.orange} />
            <Text style={styles.rating}>
              {item.rating} ({item.reviews} reviews)
            </Text>
          </View>
        </View>
        <View
          style={[
            styles.availabilityBadge,
            {
              backgroundColor:
                item.availability === 'Available'
                  ? COLORS.greenLight
                  : COLORS.orangeLight,
            },
          ]}
        >
          <Text
            style={[
              styles.availabilityText,
              {
                color:
                  item.availability === 'Available' ? COLORS.green : COLORS.orange,
              },
            ]}
          >
            {item.availability}
          </Text>
        </View>
      </View>

      <View style={styles.doctorDetails}>
        <View style={styles.detailItem}>
          <MaterialCommunityIcons name="hospital-building" size={16} color={COLORS.gray} />
          <Text style={styles.detailText}>{item.hospital}</Text>
        </View>
        <View style={styles.detailItem}>
          <MaterialCommunityIcons name="briefcase" size={16} color={COLORS.gray} />
          <Text style={styles.detailText}>{item.experience} years experience</Text>
        </View>
        <View style={styles.detailItem}>
          <MaterialCommunityIcons name="cash" size={16} color={COLORS.gray} />
          <Text style={styles.detailText}>${item.consultation_fee} consultation</Text>
        </View>
      </View>

      <View style={styles.qualifications}>
        {item.qualifications.map((qual, index) => (
          <View key={index} style={styles.qualificationBadge}>
            <Text style={styles.qualificationText}>{qual}</Text>
          </View>
        ))}
      </View>

      <TouchableOpacity
        style={styles.bookButton}
        onPress={() => handleBookAppointment(item)}
      >
        <MaterialCommunityIcons name="calendar-clock" size={20} color={COLORS.white} />
        <Text style={styles.bookButtonText}>Book Appointment</Text>
      </TouchableOpacity>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <MaterialCommunityIcons name="arrow-left" size={24} color={COLORS.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Find Doctor</Text>
        <View style={{ width: 40 }} />
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <MaterialCommunityIcons name="magnify" size={24} color={COLORS.gray} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search by name or hospital..."
          value={searchQuery}
          onChangeText={setSearchQuery}
          onSubmitEditing={searchDoctors}
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity onPress={() => {
            setSearchQuery('');
            searchDoctors();
          }}>
            <MaterialCommunityIcons name="close-circle" size={20} color={COLORS.gray} />
          </TouchableOpacity>
        )}
      </View>

      {/* Specialization Filter */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.filterContainer}
        contentContainerStyle={styles.filterContent}
      >
        {specializations.map((spec) => (
          <TouchableOpacity
            key={spec}
            style={[
              styles.filterChip,
              selectedSpecialization === spec && styles.filterChipActive,
            ]}
            onPress={() =>
              setSelectedSpecialization(spec === 'All' ? '' : spec)
            }
          >
            <Text
              style={[
                styles.filterChipText,
                selectedSpecialization === spec && styles.filterChipTextActive,
              ]}
            >
              {spec}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Results Count */}
      <View style={styles.resultsHeader}>
        <Text style={styles.resultsText}>
          {doctors.length} {doctors.length === 1 ? 'doctor' : 'doctors'} found
        </Text>
        <TouchableOpacity onPress={searchDoctors}>
          <MaterialCommunityIcons name="refresh" size={24} color={COLORS.primary} />
        </TouchableOpacity>
      </View>

      {/* Doctors List */}
      {loading ? (
        <ActivityIndicator size="large" color={COLORS.primary} style={{ marginTop: 50 }} />
      ) : doctors.length === 0 ? (
        <View style={styles.emptyState}>
          <MaterialCommunityIcons name="doctor" size={80} color={COLORS.gray} />
          <Text style={styles.emptyTitle}>No Doctors Found</Text>
          <Text style={styles.emptySubtitle}>
            Try adjusting your search or filters
          </Text>
        </View>
      ) : (
        <FlatList
          data={doctors}
          renderItem={renderDoctor}
          keyExtractor={(item) => item._id}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        />
      )}

      {/* Booking Modal */}
      <Modal
        visible={showBookingModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowBookingModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Book Appointment</Text>
              <TouchableOpacity onPress={() => setShowBookingModal(false)}>
                <MaterialCommunityIcons name="close" size={24} color={COLORS.text} />
              </TouchableOpacity>
            </View>

            {selectedDoctor && (
              <ScrollView showsVerticalScrollIndicator={false}>
                <View style={styles.modalDoctorInfo}>
                  <View style={styles.modalDoctorAvatar}>
                    <MaterialCommunityIcons name="doctor" size={40} color={COLORS.white} />
                  </View>
                  <View>
                    <Text style={styles.modalDoctorName}>Dr. {selectedDoctor.name}</Text>
                    <Text style={styles.modalSpecialization}>
                      {selectedDoctor.specialization}
                    </Text>
                    <Text style={styles.modalHospital}>{selectedDoctor.hospital}</Text>
                  </View>
                </View>

                <Text style={styles.sectionLabel}>Select Time Slot</Text>
                <View style={styles.slotsContainer}>
                  {selectedDoctor.available_slots.map((slot, index) => (
                    <TouchableOpacity
                      key={index}
                      style={[
                        styles.slotButton,
                        selectedSlot === slot && styles.slotButtonActive,
                      ]}
                      onPress={() => setSelectedSlot(slot)}
                    >
                      <MaterialCommunityIcons
                        name="clock-outline"
                        size={18}
                        color={
                          selectedSlot === slot ? COLORS.white : COLORS.primary
                        }
                      />
                      <Text
                        style={[
                          styles.slotText,
                          selectedSlot === slot && styles.slotTextActive,
                        ]}
                      >
                        {slot}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>

                <View style={styles.feeCard}>
                  <Text style={styles.feeLabel}>Consultation Fee</Text>
                  <Text style={styles.feeAmount}>
                    ${selectedDoctor.consultation_fee}
                  </Text>
                </View>

                <TouchableOpacity
                  style={styles.confirmButton}
                  onPress={confirmBooking}
                  disabled={bookingLoading}
                >
                  {bookingLoading ? (
                    <ActivityIndicator color={COLORS.white} />
                  ) : (
                    <>
                      <MaterialCommunityIcons
                        name="check-circle"
                        size={24}
                        color={COLORS.white}
                      />
                      <Text style={styles.confirmButtonText}>Confirm Booking</Text>
                    </>
                  )}
                </TouchableOpacity>
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16, backgroundColor: COLORS.white, borderBottomWidth: 1, borderBottomColor: COLORS.border },
  backButton: { width: 40, height: 40, borderRadius: 20, backgroundColor: COLORS.lightGray, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontSize: 18, fontWeight: 'bold', color: COLORS.text },
  searchContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.white, margin: 16, padding: 12, borderRadius: 12, borderWidth: 1, borderColor: COLORS.border, gap: 8 },
  searchInput: { flex: 1, fontSize: 16, color: COLORS.text },
  filterContainer: { maxHeight: 50, marginBottom: 8 },
  filterContent: { paddingHorizontal: 16, gap: 10 },
  filterChip: { paddingHorizontal: 16, paddingVertical: 10, borderRadius: 20, backgroundColor: COLORS.white, borderWidth: 1, borderColor: COLORS.border },
  filterChipActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  filterChipText: { fontSize: 14, fontWeight: '600', color: COLORS.textSecondary },
  filterChipTextActive: { color: COLORS.white },
  resultsHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12 },
  resultsText: { fontSize: 16, fontWeight: '600', color: COLORS.text },
  listContent: { padding: 16, paddingTop: 8 },
  doctorCard: { backgroundColor: COLORS.white, borderRadius: 16, padding: 16, marginBottom: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4, elevation: 3 },
  doctorHeader: { flexDirection: 'row', marginBottom: 12 },
  doctorAvatar: { width: 60, height: 60, borderRadius: 30, backgroundColor: COLORS.primary, alignItems: 'center', justifyContent: 'center' },
  doctorInfo: { flex: 1, marginLeft: 12 },
  doctorName: { fontSize: 18, fontWeight: 'bold', color: COLORS.text },
  specialization: { fontSize: 14, color: COLORS.textSecondary, marginTop: 2 },
  ratingRow: { flexDirection: 'row', alignItems: 'center', marginTop: 4, gap: 4 },
  rating: { fontSize: 12, color: COLORS.textSecondary },
  availabilityBadge: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12, height: 28 },
  availabilityText: { fontSize: 12, fontWeight: '600' },
  doctorDetails: { marginBottom: 12, gap: 8 },
  detailItem: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  detailText: { fontSize: 14, color: COLORS.textSecondary },
  qualifications: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 12 },
  qualificationBadge: { backgroundColor: COLORS.lightGray, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  qualificationText: { fontSize: 12, color: COLORS.text },
  bookButton: { flexDirection: 'row', backgroundColor: COLORS.primary, padding: 12, borderRadius: 12, alignItems: 'center', justifyContent: 'center', gap: 8 },
  bookButtonText: { color: COLORS.white, fontSize: 16, fontWeight: '600' },
  emptyState: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 40 },
  emptyTitle: { fontSize: 20, fontWeight: 'bold', color: COLORS.text, marginTop: 16 },
  emptySubtitle: { fontSize: 14, color: COLORS.textSecondary, marginTop: 8, textAlign: 'center' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0, 0, 0, 0.5)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: COLORS.white, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, maxHeight: '80%' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  modalTitle: { fontSize: 20, fontWeight: 'bold', color: COLORS.text },
  modalDoctorInfo: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.lightGray, padding: 16, borderRadius: 12, marginBottom: 20, gap: 12 },
  modalDoctorAvatar: { width: 64, height: 64, borderRadius: 32, backgroundColor: COLORS.primary, alignItems: 'center', justifyContent: 'center' },
  modalDoctorName: { fontSize: 18, fontWeight: 'bold', color: COLORS.text },
  modalSpecialization: { fontSize: 14, color: COLORS.textSecondary, marginTop: 2 },
  modalHospital: { fontSize: 12, color: COLORS.gray, marginTop: 2 },
  sectionLabel: { fontSize: 16, fontWeight: '600', color: COLORS.text, marginBottom: 12 },
  slotsContainer: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 20 },
  slotButton: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 10, borderRadius: 12, borderWidth: 1.5, borderColor: COLORS.primary, gap: 6 },
  slotButtonActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  slotText: { fontSize: 14, fontWeight: '600', color: COLORS.primary },
  slotTextActive: { color: COLORS.white },
  feeCard: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: COLORS.primaryLight, padding: 16, borderRadius: 12, marginBottom: 20 },
  feeLabel: { fontSize: 16, fontWeight: '600', color: COLORS.text },
  feeAmount: { fontSize: 24, fontWeight: 'bold', color: COLORS.primary },
  confirmButton: { flexDirection: 'row', backgroundColor: COLORS.primary, padding: 16, borderRadius: 12, alignItems: 'center', justifyContent: 'center', gap: 8 },
  confirmButtonText: { color: COLORS.white, fontSize: 18, fontWeight: 'bold' },
});
