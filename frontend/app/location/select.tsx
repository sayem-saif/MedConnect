import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Platform,
  useWindowDimensions,
} from 'react-native';
import { useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Picker } from '@react-native-picker/picker';
import { useHospital } from '../../contexts/HospitalContext';
import { useAuth } from '../../contexts/AuthContext';
import api from '../../utils/api';
import { COLORS } from '../../utils/colors';
import {
  COUNTRIES,
  getStatesByCountry,
  getCitiesByCountryAndState,
  getCityCoordinates,
} from '../../utils/locationData';

interface Hospital {
  _id: string;
  name: string;
  address: string;
  city: string;
  state: string;
  country: string;
  phone: string;
  email: string;
  total_icu_beds: number;
  available_icu_beds: number;
  total_nicu_beds: number;
  available_nicu_beds: number;
  total_general_beds: number;
  available_general_beds: number;
  total_ccu_beds?: number;
  available_ccu_beds?: number;
  total_oxygen_beds?: number;
  available_oxygen_beds?: number;
  total_non_oxygen_beds?: number;
  available_non_oxygen_beds?: number;
  live_availability?: {
    oxygen_supply_available: boolean;
    icu: { available: number; total: number };
    ccu: { available: number; total: number };
    nicu: { available: number; total: number };
    general_ward: { available: number; total: number };
    oxygen_ward: { available: number; total: number };
    non_oxygen_ward: { available: number; total: number };
    last_updated: string;
  };
  distance?: number;
}

type SortMode = 'nearest' | 'maxBeds' | 'balanced';

export default function LocationSelectionScreen() {
  const router = useRouter();
  const { setSelectedHospital, setSelectedLocation } = useHospital();
  const { user } = useAuth();
  const { width } = useWindowDimensions();
  const fontFamily = Platform.OS === 'web' ? 'Segoe UI' : undefined;

  const [country, setCountry] = useState('');
  const [state, setState] = useState('');
  const [city, setCity] = useState('');
  const [hospitals, setHospitals] = useState<Hospital[]>([]);
  const [loading, setLoading] = useState(false);
  const [showHospitals, setShowHospitals] = useState(false);
  const [sortMode, setSortMode] = useState<SortMode>('nearest');

  const availableStates = getStatesByCountry(country);
  const availableCities = getCitiesByCountryAndState(country, state);

  const getTotalAvailableBeds = (hospital: Hospital) => {
    const icu = hospital.live_availability?.icu?.available ?? hospital.available_icu_beds ?? 0;
    const ccu = hospital.live_availability?.ccu?.available ?? hospital.available_ccu_beds ?? 0;
    const nicu = hospital.live_availability?.nicu?.available ?? hospital.available_nicu_beds ?? 0;
    const general = hospital.live_availability?.general_ward?.available ?? hospital.available_general_beds ?? 0;
    const oxygen = hospital.live_availability?.oxygen_ward?.available ?? hospital.available_oxygen_beds ?? 0;
    const nonOxygen = hospital.live_availability?.non_oxygen_ward?.available ?? hospital.available_non_oxygen_beds ?? 0;
    return icu + ccu + nicu + general + oxygen + nonOxygen;
  };

  const sortHospitals = (list: Hospital[]) => {
    return [...list].sort((a, b) => {
      const distanceA = typeof a.distance === 'number' ? a.distance : Number.MAX_SAFE_INTEGER;
      const distanceB = typeof b.distance === 'number' ? b.distance : Number.MAX_SAFE_INTEGER;
      const bedsA = getTotalAvailableBeds(a);
      const bedsB = getTotalAvailableBeds(b);

      if (sortMode === 'nearest') {
        if (distanceA !== distanceB) return distanceA - distanceB;
        return bedsB - bedsA;
      }

      if (sortMode === 'maxBeds') {
        if (bedsA !== bedsB) return bedsB - bedsA;
        return distanceA - distanceB;
      }

      // Balanced score prefers both higher bed availability and lower distance.
      const scoreA = bedsA * 2 - distanceA;
      const scoreB = bedsB * 2 - distanceB;
      if (scoreA !== scoreB) return scoreB - scoreA;
      return distanceA - distanceB;
    });
  };

  const groupedHospitals = useMemo(() => {
    const criticalCare = hospitals.filter((hospital) => {
      const icu = hospital.live_availability?.icu?.available ?? hospital.available_icu_beds ?? 0;
      const ccu = hospital.live_availability?.ccu?.available ?? hospital.available_ccu_beds ?? 0;
      const nicu = hospital.live_availability?.nicu?.available ?? hospital.available_nicu_beds ?? 0;
      return icu > 0 || ccu > 0 || nicu > 0;
    });

    const criticalIds = new Set(criticalCare.map((hospital) => hospital._id));
    const oxygenSupport = hospitals.filter((hospital) => {
      if (criticalIds.has(hospital._id)) return false;
      const oxygenAvailable = hospital.live_availability?.oxygen_supply_available;
      const oxygenBeds = hospital.live_availability?.oxygen_ward?.available ?? hospital.available_oxygen_beds ?? 0;
      return Boolean(oxygenAvailable) || oxygenBeds > 0;
    });

    const oxygenIds = new Set(oxygenSupport.map((hospital) => hospital._id));
    const generalAvailability = hospitals.filter(
      (hospital) => !criticalIds.has(hospital._id) && !oxygenIds.has(hospital._id)
    );

    return {
      criticalCare: sortHospitals(criticalCare),
      oxygenSupport: sortHospitals(oxygenSupport),
      generalAvailability: sortHospitals(generalAvailability),
    };
  }, [hospitals, sortMode]);

  useEffect(() => {
    if (city) {
      fetchHospitals();
    }
  }, [city]);

  const fetchHospitals = async () => {
    setLoading(true);
    try {
      const coordinates = getCityCoordinates(city);
      const response = await api.get('/api/hospitals', {
        params: {
          city,
          state,
          country,
          lat: coordinates?.lat,
          lng: coordinates?.lng,
        },
      });
      setHospitals(response.data);
      setShowHospitals(true);
    } catch (error) {
      console.error('Failed to fetch hospitals:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectHospital = async (hospital: Hospital) => {
    const selectedLoc = { country, state, city };
    await setSelectedLocation(selectedLoc);
    await setSelectedHospital(hospital);

    if (user?._id) {
      try {
        await api.put(`/api/users/${user._id}/preferences`, {
          selected_hospital: hospital,
          selected_location: selectedLoc,
        });
      } catch (error) {
        console.error('Failed to save user preferences:', error);
      }
    }

    router.replace('/(tabs)/home');
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <MaterialCommunityIcons name="hospital-marker" size={48} color={COLORS.primary} />
        <Text style={[styles.title, { fontFamily }]}>Select Your Location</Text>
        <Text style={[styles.subtitle, { fontFamily }]}>Choose your area to find nearby hospitals</Text>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false} contentContainerStyle={styles.contentContainer}>
        <View style={[styles.responsiveContainer, width >= 980 && styles.responsiveDesktop]}>
          <View style={styles.selectionCard}>
            <Text style={[styles.selectionCardTitle, { fontFamily }]}>Location Steps</Text>
            <View style={styles.selectionMetaRow}>
              <Text style={[styles.selectionMeta, { fontFamily }]}>Country: {country || 'Not selected'}</Text>
              <Text style={[styles.selectionMeta, { fontFamily }]}>State: {state || 'Not selected'}</Text>
              <Text style={[styles.selectionMeta, { fontFamily }]}>City: {city || 'Not selected'}</Text>
            </View>

            {/* Country Selection */}
            <View style={styles.pickerContainer}>
              <Text style={[styles.label, { fontFamily }]}>Step 1: Country</Text>
              <View style={styles.pickerWrapper}>
                <MaterialCommunityIcons name="earth" size={20} color={COLORS.gray} />
                <Picker
                  selectedValue={country}
                  onValueChange={(value) => {
                    setCountry(value);
                    setState('');
                    setCity('');
                    setShowHospitals(false);
                  }}
                  style={styles.picker}
                >
                  <Picker.Item label="Select Country" value="" />
                  {COUNTRIES.map((c) => (
                    <Picker.Item key={c} label={c} value={c} />
                  ))}
                </Picker>
              </View>
            </View>

            {/* State Selection */}
            {country && (
              <View style={styles.pickerContainer}>
                <Text style={[styles.label, { fontFamily }]}>Step 2: State / Province</Text>
                <View style={styles.pickerWrapper}>
                  <MaterialCommunityIcons name="map" size={20} color={COLORS.gray} />
                  <Picker
                    selectedValue={state}
                    onValueChange={(value) => {
                      setState(value);
                      setCity('');
                      setShowHospitals(false);
                    }}
                    style={styles.picker}
                    enabled={availableStates.length > 0}
                  >
                    <Picker.Item label="Select State/Province" value="" />
                    {availableStates.map((s) => (
                      <Picker.Item key={s} label={s} value={s} />
                    ))}
                  </Picker>
                </View>
              </View>
            )}

            {/* City Selection */}
            {state && (
              <View style={styles.pickerContainer}>
                <Text style={[styles.label, { fontFamily }]}>Step 3: City</Text>
                <View style={styles.pickerWrapper}>
                  <MaterialCommunityIcons name="city" size={20} color={COLORS.gray} />
                  <Picker
                    selectedValue={city}
                    onValueChange={setCity}
                    style={styles.picker}
                    enabled={availableCities.length > 0}
                  >
                    <Picker.Item label="Select City" value="" />
                    {availableCities.length > 0 ? (
                      availableCities.map((c) => (
                        <Picker.Item key={c} label={c} value={c} />
                      ))
                    ) : (
                      <Picker.Item label="No cities available" value="" />
                    )}
                  </Picker>
                </View>
              </View>
            )}
          </View>

          {/* Loading State */}
          {loading && (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={COLORS.primary} />
              <Text style={[styles.loadingText, { fontFamily }]}>Finding hospitals...</Text>
            </View>
          )}

        {/* Hospitals List */}
        {showHospitals && !loading && (
          <View style={styles.hospitalsSection}>
            <Text style={[styles.sectionTitle, { fontFamily }]}>
              {hospitals.length} Hospital{hospitals.length !== 1 ? 's' : ''} Found
            </Text>

            <View style={styles.sortRow}>
              <Text style={[styles.sortLabel, { fontFamily }]}>Sort By</Text>
              <View style={styles.sortButtonsWrap}>
                <TouchableOpacity
                  style={[styles.sortButton, sortMode === 'nearest' && styles.sortButtonActive]}
                  onPress={() => setSortMode('nearest')}
                >
                  <Text style={[styles.sortButtonText, sortMode === 'nearest' && styles.sortButtonTextActive, { fontFamily }]}>Nearest</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.sortButton, sortMode === 'maxBeds' && styles.sortButtonActive]}
                  onPress={() => setSortMode('maxBeds')}
                >
                  <Text style={[styles.sortButtonText, sortMode === 'maxBeds' && styles.sortButtonTextActive, { fontFamily }]}>Max Beds</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.sortButton, sortMode === 'balanced' && styles.sortButtonActive]}
                  onPress={() => setSortMode('balanced')}
                >
                  <Text style={[styles.sortButtonText, sortMode === 'balanced' && styles.sortButtonTextActive, { fontFamily }]}>Balanced</Text>
                </TouchableOpacity>
              </View>
            </View>

            {hospitals.length === 0 ? (
              <View style={styles.emptyState}>
                <MaterialCommunityIcons name="hospital-building" size={60} color={COLORS.gray} />
                <Text style={[styles.emptyText, { fontFamily }]}>No hospitals found in this area</Text>
              </View>
            ) : (
              <>
                {groupedHospitals.criticalCare.length > 0 && (
                  <View style={styles.groupSection}>
                    <Text style={[styles.groupTitle, { fontFamily }]}>Critical Care Ready</Text>
                    {groupedHospitals.criticalCare.map((hospital) => (
                      <TouchableOpacity
                        key={hospital._id}
                        style={styles.hospitalCard}
                        onPress={() => handleSelectHospital(hospital)}
                      >
                        <View style={styles.hospitalHeader}>
                          <MaterialCommunityIcons name="hospital-building" size={34} color={COLORS.primary} />
                          <View style={styles.hospitalInfo}>
                            <Text style={[styles.hospitalName, { fontFamily }]}>{hospital.name}</Text>
                            <Text style={[styles.hospitalAddress, { fontFamily }]}>{hospital.address}</Text>
                            <Text style={[styles.hospitalContact, { fontFamily }]}>{hospital.phone}</Text>
                            {typeof hospital.distance === 'number' && (
                              <Text style={[styles.hospitalContact, { fontFamily }]}>Distance: {hospital.distance.toFixed(1)} km</Text>
                            )}
                          </View>
                          <MaterialCommunityIcons name="chevron-right" size={22} color={COLORS.gray} />
                        </View>

                        <View style={styles.bedsInfo}>
                          <View style={styles.bedItem}><Text style={[styles.bedLabel, { fontFamily }]}>ICU</Text><Text style={[styles.bedCount, { fontFamily }]}>{hospital.available_icu_beds}/{hospital.total_icu_beds}</Text></View>
                          <View style={styles.bedItem}><Text style={[styles.bedLabel, { fontFamily }]}>NICU</Text><Text style={[styles.bedCount, { fontFamily }]}>{hospital.available_nicu_beds}/{hospital.total_nicu_beds}</Text></View>
                          <View style={styles.bedItem}><Text style={[styles.bedLabel, { fontFamily }]}>CCU</Text><Text style={[styles.bedCount, { fontFamily }]}>{hospital.live_availability?.ccu?.available ?? hospital.available_ccu_beds ?? 0}/{hospital.live_availability?.ccu?.total ?? hospital.total_ccu_beds ?? 0}</Text></View>
                          <View style={styles.bedItem}><Text style={[styles.bedLabel, { fontFamily }]}>General</Text><Text style={[styles.bedCount, { fontFamily }]}>{hospital.available_general_beds}/{hospital.total_general_beds}</Text></View>
                        </View>
                        <View style={styles.oxygenRow}>
                          <Text style={[styles.oxygenText, { fontFamily }]}>Oxygen Supply: {hospital.live_availability?.oxygen_supply_available ? 'Available' : 'Limited / Not Available'}</Text>
                          <Text style={[styles.oxygenText, { fontFamily }]}>Oxygen Beds: {hospital.live_availability?.oxygen_ward?.available ?? hospital.available_oxygen_beds ?? 0}/{hospital.live_availability?.oxygen_ward?.total ?? hospital.total_oxygen_beds ?? 0}</Text>
                          <Text style={[styles.oxygenText, { fontFamily }]}>Non-Oxygen Beds: {hospital.live_availability?.non_oxygen_ward?.available ?? hospital.available_non_oxygen_beds ?? 0}/{hospital.live_availability?.non_oxygen_ward?.total ?? hospital.total_non_oxygen_beds ?? 0}</Text>
                        </View>
                      </TouchableOpacity>
                    ))}
                  </View>
                )}

                {groupedHospitals.oxygenSupport.length > 0 && (
                  <View style={styles.groupSection}>
                    <Text style={[styles.groupTitle, { fontFamily }]}>Oxygen Support</Text>
                    {groupedHospitals.oxygenSupport.map((hospital) => (
                      <TouchableOpacity key={hospital._id} style={styles.hospitalCard} onPress={() => handleSelectHospital(hospital)}>
                        <View style={styles.hospitalHeader}>
                          <MaterialCommunityIcons name="hospital-building" size={34} color={COLORS.primary} />
                          <View style={styles.hospitalInfo}>
                            <Text style={[styles.hospitalName, { fontFamily }]}>{hospital.name}</Text>
                            <Text style={[styles.hospitalAddress, { fontFamily }]}>{hospital.address}</Text>
                            <Text style={[styles.hospitalContact, { fontFamily }]}>{hospital.phone}</Text>
                            {typeof hospital.distance === 'number' && (
                              <Text style={[styles.hospitalContact, { fontFamily }]}>Distance: {hospital.distance.toFixed(1)} km</Text>
                            )}
                          </View>
                          <MaterialCommunityIcons name="chevron-right" size={22} color={COLORS.gray} />
                        </View>
                        <View style={styles.oxygenRow}>
                          <Text style={[styles.oxygenText, { fontFamily }]}>Oxygen Supply: {hospital.live_availability?.oxygen_supply_available ? 'Available' : 'Limited / Not Available'}</Text>
                          <Text style={[styles.oxygenText, { fontFamily }]}>Oxygen Beds: {hospital.live_availability?.oxygen_ward?.available ?? hospital.available_oxygen_beds ?? 0}/{hospital.live_availability?.oxygen_ward?.total ?? hospital.total_oxygen_beds ?? 0}</Text>
                        </View>
                      </TouchableOpacity>
                    ))}
                  </View>
                )}

                {groupedHospitals.generalAvailability.length > 0 && (
                  <View style={styles.groupSection}>
                    <Text style={[styles.groupTitle, { fontFamily }]}>General Availability</Text>
                    {groupedHospitals.generalAvailability.map((hospital) => (
                      <TouchableOpacity key={hospital._id} style={styles.hospitalCard} onPress={() => handleSelectHospital(hospital)}>
                        <View style={styles.hospitalHeader}>
                          <MaterialCommunityIcons name="hospital-building" size={34} color={COLORS.primary} />
                          <View style={styles.hospitalInfo}>
                            <Text style={[styles.hospitalName, { fontFamily }]}>{hospital.name}</Text>
                            <Text style={[styles.hospitalAddress, { fontFamily }]}>{hospital.address}</Text>
                            <Text style={[styles.hospitalContact, { fontFamily }]}>{hospital.phone}</Text>
                            {typeof hospital.distance === 'number' && (
                              <Text style={[styles.hospitalContact, { fontFamily }]}>Distance: {hospital.distance.toFixed(1)} km</Text>
                            )}
                          </View>
                          <MaterialCommunityIcons name="chevron-right" size={22} color={COLORS.gray} />
                        </View>
                        <View style={styles.bedsInfo}>
                          <View style={styles.bedItem}><Text style={[styles.bedLabel, { fontFamily }]}>General</Text><Text style={[styles.bedCount, { fontFamily }]}>{hospital.available_general_beds}/{hospital.total_general_beds}</Text></View>
                          <View style={styles.bedItem}><Text style={[styles.bedLabel, { fontFamily }]}>Non-Oxygen</Text><Text style={[styles.bedCount, { fontFamily }]}>{hospital.live_availability?.non_oxygen_ward?.available ?? hospital.available_non_oxygen_beds ?? 0}/{hospital.live_availability?.non_oxygen_ward?.total ?? hospital.total_non_oxygen_beds ?? 0}</Text></View>
                        </View>
                      </TouchableOpacity>
                    ))}
                  </View>
                )}
              </>
            )}
          </View>
        )}
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F3F7FA' },
  header: { alignItems: 'center', padding: 24, paddingTop: 48, backgroundColor: '#FFFFFF', borderBottomWidth: 1, borderBottomColor: '#D7E2EC' },
  title: { fontSize: 30, fontWeight: '800', color: '#1B2A35', marginTop: 14 },
  subtitle: { fontSize: 16, color: '#566977', marginTop: 8, textAlign: 'center' },
  content: { flex: 1 },
  contentContainer: { padding: 20, paddingBottom: 10 },
  responsiveContainer: { width: '100%', maxWidth: 960, alignSelf: 'center' },
  responsiveDesktop: { paddingHorizontal: 12 },
  selectionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#D7E2EC',
    padding: 12,
    marginBottom: 12,
  },
  selectionCardTitle: { fontSize: 16, fontWeight: '700', color: '#1B2A35', marginBottom: 8 },
  selectionMetaRow: {
    backgroundColor: '#F6FAFC',
    borderWidth: 1,
    borderColor: '#E2E8EF',
    borderRadius: 8,
    padding: 8,
    marginBottom: 10,
    gap: 4,
  },
  selectionMeta: { fontSize: 12, color: '#4F6270', fontWeight: '600' },
  pickerContainer: { marginBottom: 10 },
  label: { fontSize: 14, fontWeight: '700', color: '#2A3F4E', marginBottom: 8 },
  pickerWrapper: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFFFFF', borderRadius: 10, borderWidth: 1, borderColor: '#CCD9E6', paddingLeft: 12 },
  picker: { flex: 1, height: 50 },
  loadingContainer: { alignItems: 'center', padding: 40 },
  loadingText: { fontSize: 16, color: '#566977', marginTop: 16 },
  hospitalsSection: { marginTop: 16 },
  sectionTitle: { fontSize: 24, fontWeight: '800', color: '#1B2A35', marginBottom: 16 },
  sortRow: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#D7E2EC',
    borderRadius: 10,
    padding: 10,
    marginBottom: 10,
  },
  sortLabel: { fontSize: 12, fontWeight: '700', color: '#4F6270', marginBottom: 8 },
  sortButtonsWrap: { flexDirection: 'row', gap: 8 },
  sortButton: {
    borderWidth: 1,
    borderColor: '#CCD9E6',
    borderRadius: 8,
    paddingVertical: 6,
    paddingHorizontal: 10,
    backgroundColor: '#FFFFFF',
  },
  sortButtonActive: { backgroundColor: '#0F4C81', borderColor: '#0F4C81' },
  sortButtonText: { fontSize: 12, color: '#415260', fontWeight: '700' },
  sortButtonTextActive: { color: '#FFFFFF' },
  groupSection: { marginBottom: 12 },
  groupTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#1B2A35',
    backgroundColor: '#EEF3F8',
    borderWidth: 1,
    borderColor: '#D7E2EC',
    borderRadius: 8,
    paddingVertical: 6,
    paddingHorizontal: 10,
    marginBottom: 8,
  },
  hospitalCard: { backgroundColor: '#FFFFFF', borderRadius: 12, padding: 12, marginBottom: 10, borderWidth: 1, borderColor: '#D7E2EC' },
  hospitalHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  hospitalInfo: { flex: 1, marginLeft: 12 },
  hospitalName: { fontSize: 15, fontWeight: '700', color: '#1B2A35' },
  hospitalAddress: { fontSize: 13, color: '#566977', marginTop: 3 },
  hospitalContact: { fontSize: 12, color: '#6D7E8D', marginTop: 2 },
  bedsInfo: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', paddingTop: 10, borderTopWidth: 1, borderTopColor: '#D7E2EC' },
  bedItem: { width: '48%', alignItems: 'center', backgroundColor: '#F7FAFC', borderRadius: 8, paddingVertical: 6, marginBottom: 8 },
  bedLabel: { fontSize: 12, color: '#566977' },
  bedCount: { fontSize: 14, fontWeight: '700', color: '#0F4C81', marginTop: 3 },
  oxygenRow: { borderTopWidth: 1, borderTopColor: '#D7E2EC', marginTop: 4, paddingTop: 8 },
  oxygenText: { fontSize: 12, color: '#0F4C81', fontWeight: '600', marginBottom: 2 },
  emptyState: { alignItems: 'center', padding: 40 },
  emptyText: { fontSize: 16, color: '#566977', marginTop: 12 },
});
