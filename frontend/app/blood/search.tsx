import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  SafeAreaView,
  ActivityIndicator,
  Alert,
  Linking,
} from 'react-native';
import { useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import api from '../../utils/api';
import { COLORS } from '../../utils/colors';

interface BloodBank {
  id: string;
  name: string;
  blood_type: string;
  units_available: number;
  distance: number;
  address: string;
  phone: string;
  status: string;
}

export default function BloodSearchScreen() {
  const router = useRouter();
  const [bloodBanks, setBloodBanks] = useState<BloodBank[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedBloodType, setSelectedBloodType] = useState<string>('');
  const [selectedUrgency, setSelectedUrgency] = useState<string>('High');

  const bloodTypes = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];
  const urgencyLevels = ['Critical', 'High', 'Medium'];

  const searchBlood = async () => {
    if (!selectedBloodType) {
      Alert.alert('Error', 'Please select a blood type');
      return;
    }

    setLoading(true);
    try {
      const response = await api.post('/api/blood/search', {
        blood_type: selectedBloodType,
        latitude: 40.7128,
        longitude: -74.0060,
        urgency: selectedUrgency,
      });

      setBloodBanks(response.data.blood_banks);
    } catch (error) {
      Alert.alert('Error', 'Failed to search blood banks. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleCall = (phone: string) => {
    Linking.openURL(`tel:${phone}`);
  };

  const renderBloodBank = ({ item }: { item: BloodBank }) => (
    <View style={styles.bloodBankCard}>
      <View style={styles.cardHeader}>
        <View style={styles.bankInfo}>
          <Text style={styles.bankName}>{item.name}</Text>
          <View style={styles.addressContainer}>
            <MaterialCommunityIcons name="map-marker" size={14} color={COLORS.gray} />
            <Text style={styles.addressText}>{item.address}</Text>
          </View>
          <Text style={styles.distanceText}>{item.distance} km away</Text>
        </View>
        <View style={styles.availabilityBadge}>
          <MaterialCommunityIcons name="water" size={24} color={COLORS.red} />
          <Text style={styles.bloodType}>{item.blood_type}</Text>
        </View>
      </View>

      <View style={styles.divider} />

      <View style={styles.detailsRow}>
        <View style={styles.unitsContainer}>
          <Text style={styles.unitsLabel}>Units Available</Text>
          <Text style={styles.unitsCount}>{item.units_available}</Text>
        </View>

        <TouchableOpacity
          style={styles.callButton}
          onPress={() => handleCall(item.phone)}
        >
          <MaterialCommunityIcons name="phone" size={20} color={COLORS.white} />
          <Text style={styles.callButtonText}>Call Now</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <MaterialCommunityIcons name="arrow-left" size={24} color={COLORS.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Blood Availability</Text>
        <View style={{ width: 40 }} />
      </View>

      {/* Blood Type Selection */}
      <View style={styles.selectionContainer}>
        <Text style={styles.sectionTitle}>Select Blood Type</Text>
        <View style={styles.bloodTypeGrid}>
          {bloodTypes.map((type) => (
            <TouchableOpacity
              key={type}
              style={[
                styles.bloodTypeButton,
                selectedBloodType === type && styles.bloodTypeButtonActive,
              ]}
              onPress={() => setSelectedBloodType(type)}
            >
              <Text
                style={[
                  styles.bloodTypeText,
                  selectedBloodType === type && styles.bloodTypeTextActive,
                ]}
              >
                {type}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={[styles.sectionTitle, { marginTop: 16 }]}>Urgency Level</Text>
        <View style={styles.urgencyContainer}>
          {urgencyLevels.map((level) => (
            <TouchableOpacity
              key={level}
              style={[
                styles.urgencyButton,
                selectedUrgency === level && styles.urgencyButtonActive,
              ]}
              onPress={() => setSelectedUrgency(level)}
            >
              <Text
                style={[
                  styles.urgencyText,
                  selectedUrgency === level && styles.urgencyTextActive,
                ]}
              >
                {level}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <TouchableOpacity style={styles.searchButton} onPress={searchBlood}>
          <MaterialCommunityIcons name="magnify" size={24} color={COLORS.white} />
          <Text style={styles.searchButtonText}>Search Blood Banks</Text>
        </TouchableOpacity>
      </View>

      {/* Results */}
      {loading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
        </View>
      ) : bloodBanks.length > 0 ? (
        <FlatList
          data={bloodBanks}
          renderItem={renderBloodBank}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        />
      ) : null}
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
  selectionContainer: {
    backgroundColor: COLORS.white,
    padding: 20,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 12,
  },
  bloodTypeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  bloodTypeButton: {
    width: '21%',
    aspectRatio: 1,
    borderRadius: 12,
    backgroundColor: COLORS.lightGray,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: COLORS.border,
  },
  bloodTypeButtonActive: {
    backgroundColor: COLORS.red,
    borderColor: COLORS.red,
  },
  bloodTypeText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  bloodTypeTextActive: {
    color: COLORS.white,
  },
  urgencyContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  urgencyButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: COLORS.lightGray,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: COLORS.border,
  },
  urgencyButtonActive: {
    backgroundColor: COLORS.orange,
    borderColor: COLORS.orange,
  },
  urgencyText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text,
  },
  urgencyTextActive: {
    color: COLORS.white,
  },
  searchButton: {
    flexDirection: 'row',
    backgroundColor: COLORS.primary,
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 20,
    gap: 8,
  },
  searchButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.white,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContent: {
    padding: 16,
  },
  bloodBankCard: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  bankInfo: {
    flex: 1,
  },
  bankName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: 8,
  },
  addressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 4,
  },
  addressText: {
    fontSize: 14,
    color: COLORS.textSecondary,
    flex: 1,
  },
  distanceText: {
    fontSize: 12,
    color: COLORS.primary,
    fontWeight: '600',
  },
  availabilityBadge: {
    alignItems: 'center',
    gap: 4,
  },
  bloodType: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.red,
  },
  divider: {
    height: 1,
    backgroundColor: COLORS.border,
    marginBottom: 16,
  },
  detailsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  unitsContainer: {
    flex: 1,
  },
  unitsLabel: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginBottom: 4,
  },
  unitsCount: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  callButton: {
    flexDirection: 'row',
    backgroundColor: COLORS.green,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
    gap: 8,
  },
  callButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.white,
  },
});
