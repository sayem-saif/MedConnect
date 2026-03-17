import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Linking,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import api from '../../utils/api';
import { COLORS } from '../../utils/colors';

interface AmbulanceData {
  _id: string;
  driver_name: string;
  driver_phone: string;
  vehicle_number: string;
  current_latitude: number;
  current_longitude: number;
  pickup_latitude: number;
  pickup_longitude: number;
  pickup_address: string;
  eta_minutes: number;
  status: string;
  patient_name: string;
  patient_condition: string;
  emergency_level: string;
}

export default function AmbulanceTrackScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams();

  const [ambulance, setAmbulance] = useState<AmbulanceData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAmbulanceData();
    const interval = setInterval(fetchAmbulanceData, 5000);
    return () => clearInterval(interval);
  }, [id]);

  const fetchAmbulanceData = async () => {
    try {
      const response = await api.get(`/api/ambulance/${id}`);
      setAmbulance(response.data);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching ambulance:', error);
      setLoading(false);
    }
  };

  const handleCall = (phone: string) => {
    Linking.openURL(`tel:${phone}`);
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  if (!ambulance) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <MaterialCommunityIcons name="arrow-left" size={24} color={COLORS.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Ambulance Tracking</Text>
        </View>
        <View style={styles.centerContainer}>
          <Text style={styles.errorText}>Ambulance not found</Text>
        </View>
      </SafeAreaView>
    );
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'on_way': return COLORS.warning;
      case 'arrived': return COLORS.success;
      default: return COLORS.textSecondary;
    }
  };

  const getEmergencyColor = (level: string) => {
    switch (level) {
      case 'critical': return '#e74c3c';
      case 'high': return COLORS.warning;
      case 'medium': return '#f39c12';
      default: return COLORS.primary;
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <MaterialCommunityIcons name="arrow-left" size={24} color={COLORS.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Live Ambulance Tracking</Text>
        <View style={styles.headerRight} />
      </View>

      {/* Map placeholder for web */}
      <View style={styles.mapPlaceholder}>
        <MaterialCommunityIcons name="ambulance" size={80} color={COLORS.primary} />
        <Text style={styles.mapPlaceholderText}>
          Map view is available on mobile app
        </Text>
        <Text style={styles.coordinatesText}>
          Current Location: {ambulance.current_latitude.toFixed(6)}, {ambulance.current_longitude.toFixed(6)}
        </Text>
        <Text style={styles.coordinatesText}>
          Pickup Location: {ambulance.pickup_latitude.toFixed(6)}, {ambulance.pickup_longitude.toFixed(6)}
        </Text>
      </View>

      {/* Info Card */}
      <View style={styles.infoCard}>
        {/* ETA */}
        <View style={styles.etaContainer}>
          <MaterialCommunityIcons name="clock-outline" size={32} color={COLORS.primary} />
          <View style={styles.etaContent}>
            <Text style={styles.etaLabel}>Estimated Arrival</Text>
            <Text style={styles.etaTime}>{ambulance.eta_minutes} minutes</Text>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: getStatusColor(ambulance.status) }]}>
            <Text style={styles.statusText}>{ambulance.status.replace('_', ' ')}</Text>
          </View>
        </View>

        {/* Driver Info */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Driver Information</Text>
          <View style={styles.infoRow}>
            <MaterialCommunityIcons name="account" size={20} color={COLORS.textSecondary} />
            <Text style={styles.infoText}>{ambulance.driver_name}</Text>
          </View>
          <View style={styles.infoRow}>
            <MaterialCommunityIcons name="car" size={20} color={COLORS.textSecondary} />
            <Text style={styles.infoText}>{ambulance.vehicle_number}</Text>
          </View>
          <TouchableOpacity 
            style={styles.callButton}
            onPress={() => handleCall(ambulance.driver_phone)}
          >
            <MaterialCommunityIcons name="phone" size={20} color={COLORS.white} />
            <Text style={styles.callButtonText}>Call Driver</Text>
          </TouchableOpacity>
        </View>

        {/* Patient Info */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Patient Details</Text>
          <View style={styles.infoRow}>
            <MaterialCommunityIcons name="account-heart" size={20} color={COLORS.textSecondary} />
            <Text style={styles.infoText}>{ambulance.patient_name}</Text>
          </View>
          <View style={styles.infoRow}>
            <MaterialCommunityIcons name="medical-bag" size={20} color={COLORS.textSecondary} />
            <Text style={styles.infoText}>{ambulance.patient_condition}</Text>
          </View>
          <View style={styles.infoRow}>
            <MaterialCommunityIcons name="alert" size={20} color={getEmergencyColor(ambulance.emergency_level)} />
            <Text style={[styles.infoText, { color: getEmergencyColor(ambulance.emergency_level) }]}>
              {ambulance.emergency_level.toUpperCase()} Priority
            </Text>
          </View>
        </View>

        {/* Pickup Location */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Pickup Location</Text>
          <View style={styles.locationRow}>
            <MaterialCommunityIcons name="map-marker" size={20} color={COLORS.primary} />
            <Text style={styles.addressText}>{ambulance.pickup_address}</Text>
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  headerRight: {
    width: 40,
  },
  mapPlaceholder: {
    height: 300,
    backgroundColor: COLORS.lightGray,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  mapPlaceholderText: {
    fontSize: 16,
    color: COLORS.textSecondary,
    marginTop: 16,
    textAlign: 'center',
  },
  coordinatesText: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginTop: 8,
  },
  infoCard: {
    flex: 1,
    backgroundColor: COLORS.white,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 16,
    marginTop: -20,
  },
  etaContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: COLORS.lightGray,
    borderRadius: 12,
    marginBottom: 16,
  },
  etaContent: {
    flex: 1,
    marginLeft: 12,
  },
  etaLabel: {
    fontSize: 14,
    color: COLORS.textSecondary,
  },
  etaTime: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.primary,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  statusText: {
    color: COLORS.white,
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 12,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  infoText: {
    fontSize: 14,
    color: COLORS.text,
    marginLeft: 12,
  },
  callButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.success,
    padding: 12,
    borderRadius: 8,
    marginTop: 8,
  },
  callButtonText: {
    color: COLORS.white,
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 8,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  addressText: {
    flex: 1,
    fontSize: 14,
    color: COLORS.text,
    marginLeft: 12,
    lineHeight: 20,
  },
  errorText: {
    fontSize: 16,
    color: COLORS.textSecondary,
  },
});
