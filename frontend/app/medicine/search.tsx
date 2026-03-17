import React, { useState } from 'react';
import { View, Text, StyleSheet, SafeAreaView, TouchableOpacity, TextInput, FlatList, ActivityIndicator, Alert, Linking } from 'react-native';
import { useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import api from '../../utils/api';
import { COLORS } from '../../utils/colors';

interface Pharmacy {
  id: string;
  name: string;
  medicine: string;
  in_stock: boolean;
  distance: number;
  address: string;
  phone: string;
  price: number;
  open_24_7: boolean;
}

export default function MedicineSearchScreen() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [pharmacies, setPharmacies] = useState<Pharmacy[]>([]);
  const [loading, setLoading] = useState(false);

  const searchMedicine = async () => {
    if (!searchQuery.trim()) {
      Alert.alert('Error', 'Please enter a medicine name');
      return;
    }
    setLoading(true);
    try {
      const response = await api.get('/api/medicine/search', {
        params: { name: searchQuery, lat: 40.7128, lng: -74.0060 },
      });
      setPharmacies(response.data.pharmacies || []);
    } catch (error) {
      Alert.alert('Error', 'Failed to search medicine');
    } finally {
      setLoading(false);
    }
  };

  const renderPharmacy = ({ item }: { item: Pharmacy }) => (
    <View style={styles.pharmacyCard}>
      <View style={styles.cardHeader}>
        <View style={styles.pharmacyInfo}>
          <Text style={styles.pharmacyName}>{item.name}</Text>
          <View style={styles.addressRow}>
            <MaterialCommunityIcons name="map-marker" size={14} color={COLORS.gray} />
            <Text style={styles.addressText}>{item.address}</Text>
          </View>
          <Text style={styles.distanceText}>{item.distance} km away</Text>
        </View>
        {item.open_24_7 && (
          <View style={styles.badge24}>
            <Text style={styles.badge24Text}>24/7</Text>
          </View>
        )}
      </View>
      <View style={styles.divider} />
      <View style={styles.detailsRow}>
        <View style={styles.stockInfo}>
          <MaterialCommunityIcons name={item.in_stock ? 'check-circle' : 'close-circle'} size={20} color={item.in_stock ? COLORS.green : COLORS.red} />
          <Text style={[styles.stockText, { color: item.in_stock ? COLORS.green : COLORS.red }]}>{item.in_stock ? 'In Stock' : 'Out of Stock'}</Text>
        </View>
        <Text style={styles.priceText}>${item.price.toFixed(2)}</Text>
      </View>
      <View style={styles.actionButtons}>
        <TouchableOpacity style={styles.callBtn} onPress={() => Linking.openURL(`tel:${item.phone}`)}>
          <MaterialCommunityIcons name="phone" size={18} color={COLORS.white} />
          <Text style={styles.callBtnText}>Call</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.directionBtn} onPress={() => Alert.alert('Directions', 'Opening maps...')}>
          <MaterialCommunityIcons name="directions" size={18} color={COLORS.primary} />
          <Text style={styles.directionBtnText}>Directions</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <MaterialCommunityIcons name="arrow-left" size={24} color={COLORS.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Medicine Search</Text>
        <View style={{ width: 40 }} />
      </View>
      <View style={styles.searchContainer}>
        <MaterialCommunityIcons name="magnify" size={24} color={COLORS.gray} />
        <TextInput style={styles.searchInput} placeholder="Enter medicine name..." value={searchQuery} onChangeText={setSearchQuery} onSubmitEditing={searchMedicine} />
        <TouchableOpacity style={styles.searchButton} onPress={searchMedicine}>
          <Text style={styles.searchButtonText}>Search</Text>
        </TouchableOpacity>
      </View>
      {loading ? (
        <ActivityIndicator size="large" color={COLORS.primary} style={{ marginTop: 50 }} />
      ) : pharmacies.length === 0 ? (
        <View style={styles.emptyState}>
          <MaterialCommunityIcons name="pill" size={80} color={COLORS.gray} />
          <Text style={styles.emptyTitle}>Search for Medicine</Text>
          <Text style={styles.emptySubtitle}>Enter medicine name to find nearby pharmacies</Text>
        </View>
      ) : (
        <FlatList data={pharmacies} renderItem={renderPharmacy} keyExtractor={(item) => item.id} contentContainerStyle={styles.listContent} />
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
  searchContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.white, margin: 16, padding: 12, borderRadius: 12, gap: 8, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4, elevation: 3 },
  searchInput: { flex: 1, fontSize: 16, color: COLORS.text },
  searchButton: { backgroundColor: COLORS.primary, paddingHorizontal: 20, paddingVertical: 10, borderRadius: 8 },
  searchButtonText: { color: COLORS.white, fontWeight: '600' },
  listContent: { padding: 16 },
  pharmacyCard: { backgroundColor: COLORS.white, borderRadius: 16, padding: 16, marginBottom: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4, elevation: 3 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 },
  pharmacyInfo: { flex: 1 },
  pharmacyName: { fontSize: 18, fontWeight: 'bold', color: COLORS.text },
  addressRow: { flexDirection: 'row', alignItems: 'center', marginTop: 4, gap: 4 },
  addressText: { fontSize: 13, color: COLORS.textSecondary },
  distanceText: { fontSize: 12, color: COLORS.gray, marginTop: 2 },
  badge24: { backgroundColor: COLORS.green, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12 },
  badge24Text: { color: COLORS.white, fontSize: 12, fontWeight: 'bold' },
  divider: { height: 1, backgroundColor: COLORS.border, marginVertical: 12 },
  detailsRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  stockInfo: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  stockText: { fontSize: 14, fontWeight: '600' },
  priceText: { fontSize: 20, fontWeight: 'bold', color: COLORS.primary },
  actionButtons: { flexDirection: 'row', gap: 12 },
  callBtn: { flex: 1, flexDirection: 'row', backgroundColor: COLORS.primary, padding: 12, borderRadius: 12, alignItems: 'center', justifyContent: 'center', gap: 6 },
  callBtnText: { color: COLORS.white, fontWeight: '600' },
  directionBtn: { flex: 1, flexDirection: 'row', backgroundColor: COLORS.white, padding: 12, borderRadius: 12, alignItems: 'center', justifyContent: 'center', gap: 6, borderWidth: 1.5, borderColor: COLORS.primary },
  directionBtnText: { color: COLORS.primary, fontWeight: '600' },
  emptyState: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 40 },
  emptyTitle: { fontSize: 20, fontWeight: 'bold', color: COLORS.text, marginTop: 16 },
  emptySubtitle: { fontSize: 14, color: COLORS.textSecondary, marginTop: 8, textAlign: 'center' },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.text,
    marginTop: 20,
  },
  subtitle: {
    fontSize: 16,
    color: COLORS.textSecondary,
    marginTop: 8,
  },
});
