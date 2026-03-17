import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  SafeAreaView,
  ActivityIndicator,
  TextInput,
} from 'react-native';
import { useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import api from '../../utils/api';
import { COLORS, STATUS_COLORS } from '../../utils/colors';

interface Hospital {
  _id: string;
  name: string;
  address: string;
  distance?: number;
  available_icu_beds: number;
  available_nicu_beds: number;
  available_general_beds: number;
  total_icu_beds: number;
  total_nicu_beds: number;
  total_general_beds: number;
  status: 'available' | 'limited' | 'full';
  phone: string;
}

export default function BedSearchScreen() {
  const router = useRouter();
  const [hospitals, setHospitals] = useState<Hospital[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedBedType, setSelectedBedType] = useState<string>('');
  const [searchCity, setSearchCity] = useState('');

  useEffect(() => {
    fetchHospitals();
  }, [selectedBedType, searchCity]);

  const fetchHospitals = async () => {
    try {
      setLoading(true);
      const params: any = {};
      if (selectedBedType) params.bed_type = selectedBedType;
      if (searchCity) params.city = searchCity;

      const response = await api.get('/api/hospitals', { params });
      setHospitals(response.data);
    } catch (error) {
      console.error('Failed to fetch hospitals:', error);
    } finally {
      setLoading(false);
    }
  };

  const bedTypes = [
    { label: 'All', value: '' },
    { label: 'ICU', value: 'ICU' },
    { label: 'NICU', value: 'NICU' },
    { label: 'General', value: 'General' },
  ];

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'available':
        return 'circle';
      case 'limited':
        return 'circle';
      case 'full':
        return 'circle';
      default:
        return 'circle';
    }
  };

  const renderHospital = ({ item }: { item: Hospital }) => (
    <TouchableOpacity
      style={styles.hospitalCard}
      onPress={() => router.push(`/beds/details?id=${item._id}`)}
    >
      <View style={styles.hospitalHeader}>
        <View style={styles.hospitalInfo}>
          <Text style={styles.hospitalName}>{item.name}</Text>
          <View style={styles.addressContainer}>
            <MaterialCommunityIcons name="map-marker" size={14} color={COLORS.gray} />
            <Text style={styles.addressText}>{item.address}</Text>
          </View>
          {item.distance !== undefined && (
            <Text style={styles.distanceText}>{item.distance} km away</Text>
          )}
        </View>
        <View style={styles.statusContainer}>
          <MaterialCommunityIcons
            name={getStatusIcon(item.status)}
            size={16}
            color={STATUS_COLORS[item.status]}
          />
          <Text style={[styles.statusText, { color: STATUS_COLORS[item.status] }]}>
            {item.status}
          </Text>
        </View>
      </View>

      <View style={styles.bedsContainer}>
        <View style={styles.bedItem}>
          <MaterialCommunityIcons name="bed" size={20} color={COLORS.primary} />
          <View>
            <Text style={styles.bedLabel}>ICU</Text>
            <Text style={styles.bedCount}>
              {item.available_icu_beds}/{item.total_icu_beds}
            </Text>
          </View>
        </View>

        <View style={styles.bedItem}>
          <MaterialCommunityIcons name="baby-carriage" size={20} color={COLORS.secondary} />
          <View>
            <Text style={styles.bedLabel}>NICU</Text>
            <Text style={styles.bedCount}>
              {item.available_nicu_beds}/{item.total_nicu_beds}
            </Text>
          </View>
        </View>

        <View style={styles.bedItem}>
          <MaterialCommunityIcons name="hospital-bed" size={20} color={COLORS.green} />
          <View>
            <Text style={styles.bedLabel}>General</Text>
            <Text style={styles.bedCount}>
              {item.available_general_beds}/{item.total_general_beds}
            </Text>
          </View>
        </View>
      </View>

      <TouchableOpacity style={styles.bookButton}>
        <Text style={styles.bookButtonText}>View Details & Book</Text>
        <MaterialCommunityIcons name="chevron-right" size={20} color={COLORS.white} />
      </TouchableOpacity>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <MaterialCommunityIcons name="arrow-left" size={24} color={COLORS.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Find Hospital Bed</Text>
        <View style={{ width: 24 }} />
      </View>

      {/* Search */}
      <View style={styles.searchContainer}>
        <MaterialCommunityIcons name="magnify" size={20} color={COLORS.gray} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search by city..."
          value={searchCity}
          onChangeText={setSearchCity}
        />
      </View>

      {/* Bed Type Filter */}
      <View style={styles.filterContainer}>
        {bedTypes.map((type) => (
          <TouchableOpacity
            key={type.value}
            style={[
              styles.filterChip,
              selectedBedType === type.value && styles.filterChipActive,
            ]}
            onPress={() => setSelectedBedType(type.value)}
          >
            <Text
              style={[
                styles.filterText,
                selectedBedType === type.value && styles.filterTextActive,
              ]}
            >
              {type.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Hospitals List */}
      {loading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
        </View>
      ) : hospitals.length === 0 ? (
        <View style={styles.emptyContainer}>
          <MaterialCommunityIcons name="hospital-building" size={64} color={COLORS.gray} />
          <Text style={styles.emptyTitle}>No Hospitals Found</Text>
          <Text style={styles.emptyText}>Try adjusting your search filters</Text>
        </View>
      ) : (
        <FlatList
          data={hospitals}
          renderItem={renderHospital}
          keyExtractor={(item) => item._id}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        />
      )}
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
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    margin: 16,
    marginBottom: 8,
    paddingHorizontal: 16,
    borderRadius: 12,
    height: 48,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  searchInput: {
    flex: 1,
    marginLeft: 12,
    fontSize: 16,
    color: COLORS.text,
  },
  filterContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    marginBottom: 16,
    gap: 8,
  },
  filterChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  filterChipActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  filterText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text,
  },
  filterTextActive: {
    color: COLORS.white,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.text,
    marginTop: 16,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    color: COLORS.textSecondary,
    textAlign: 'center',
  },
  listContent: {
    padding: 16,
  },
  hospitalCard: {
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
  hospitalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  hospitalInfo: {
    flex: 1,
  },
  hospitalName: {
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
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  bedsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  bedItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  bedLabel: {
    fontSize: 12,
    color: COLORS.textSecondary,
  },
  bedCount: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  bookButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.primary,
    borderRadius: 12,
    paddingVertical: 12,
    gap: 8,
  },
  bookButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.white,
  },
});
