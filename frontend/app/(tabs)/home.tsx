import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  Linking,
  Platform,
  useWindowDimensions,
} from 'react-native';
import { useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useAuth } from '../../contexts/AuthContext';
import { useHospital } from '../../contexts/HospitalContext';
import { COLORS } from '../../utils/colors';

interface ActionCard {
  id: string;
  title: string;
  icon: string;
  color: string;
  route?: string;
  action?: () => void;
}

export default function HomeScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const { selectedHospital, selectedLocation } = useHospital();
  const { width } = useWindowDimensions();
  const fontFamily = Platform.OS === 'web' ? 'Segoe UI' : undefined;
  const isDesktop = width >= 1100;

  const emergencyCall = () => {
    Linking.openURL('tel:911');
  };

  const actions: ActionCard[] = [
    {
      id: '1',
      title: 'Book Bed',
      icon: 'bed',
      color: COLORS.primary,
      route: '/beds/search',
    },
    {
      id: '2',
      title: 'Call Ambulance',
      icon: 'ambulance',
      color: COLORS.red,
      route: '/ambulance/request',
    },
    {
      id: '3',
      title: 'AI Symptom Checker',
      icon: 'robot',
      color: COLORS.secondary,
      route: '/symptoms/check',
    },
    {
      id: '4',
      title: 'Find Doctor',
      icon: 'doctor',
      color: COLORS.green,
      route: '/doctors/search',
    },
    {
      id: '5',
      title: 'Blood Availability',
      icon: 'water',
      color: COLORS.red,
      route: '/blood/search',
    },
    {
      id: '6',
      title: 'Medicine Search',
      icon: 'pill',
      color: COLORS.orange,
      route: '/medicine/search',
    },
  ];

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={[styles.greeting, { fontFamily }]}>Hello, {user?.name}</Text>
          <Text style={[styles.headerSubtitle, { fontFamily }]}>How can we help you today?</Text>
        </View>
        <TouchableOpacity style={styles.notificationButton}>
          <MaterialCommunityIcons name="bell" size={24} color={COLORS.text} />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[styles.scrollContent, isDesktop && styles.desktopContent]}
        showsVerticalScrollIndicator={false}
      >
        {/* Selected Hospital Card */}
        {selectedHospital && (
          <View style={styles.hospitalCard}>
            <View style={styles.hospitalCardHeader}>
              <MaterialCommunityIcons name="hospital-building" size={32} color={COLORS.primary} />
              <View style={styles.hospitalInfo}>
                <Text style={[styles.hospitalLabel, { fontFamily }]}>Your Hospital</Text>
                <Text style={[styles.hospitalName, { fontFamily }]}>{selectedHospital.name}</Text>
                <Text style={[styles.hospitalLocation, { fontFamily }]}> 
                  {selectedLocation?.city}, {selectedLocation?.state}
                </Text>
              </View>
            </View>
          </View>
        )}

        {/* Emergency Button */}
        <TouchableOpacity style={styles.emergencyButton} onPress={emergencyCall}>
          <MaterialCommunityIcons name="phone-alert" size={32} color={COLORS.white} />
          <Text style={[styles.emergencyText, { fontFamily }]}>EMERGENCY CALL</Text>
          <Text style={[styles.emergencySubtext, { fontFamily }]}>Tap to call 911</Text>
        </TouchableOpacity>

        {/* Quick Actions */}
        <Text style={[styles.sectionTitle, { fontFamily }]}>Quick Actions</Text>
        <View style={styles.actionsGrid}>
          {actions.map((action) => (
            <TouchableOpacity
              key={action.id}
              style={styles.actionCard}
              onPress={() => {
                if (action.route) {
                  router.push(action.route as any);
                } else if (action.action) {
                  action.action();
                }
              }}
            >
              <View style={[styles.actionIconContainer, { backgroundColor: action.color }]}>
                <MaterialCommunityIcons
                  name={action.icon as any}
                  size={32}
                  color={COLORS.white}
                />
              </View>
              <Text style={[styles.actionTitle, { fontFamily }]}>{action.title}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Info Cards */}
        <View style={styles.infoCard}>
          <MaterialCommunityIcons name="information" size={24} color={COLORS.primary} />
          <View style={styles.infoContent}>
            <Text style={[styles.infoTitle, { fontFamily }]}>24/7 Support Available</Text>
            <Text style={[styles.infoText, { fontFamily }]}> 
              Get instant access to hospital beds, ambulance services, and medical assistance.
            </Text>
          </View>
        </View>

        <View style={styles.infoCard}>
          <MaterialCommunityIcons name="shield-check" size={24} color={COLORS.green} />
          <View style={styles.infoContent}>
            <Text style={[styles.infoTitle, { fontFamily }]}>Verified Hospitals</Text>
            <Text style={[styles.infoText, { fontFamily }]}> 
              All hospitals and services are verified and regularly updated for accuracy.
            </Text>
          </View>
        </View>
      </ScrollView>
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
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  greeting: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  headerSubtitle: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginTop: 4,
  },
  notificationButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: COLORS.lightGray,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
  },
  desktopContent: {
    maxWidth: 1080,
    width: '100%',
    alignSelf: 'center',
  },
  hospitalCard: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    borderWidth: 2,
    borderColor: COLORS.primary,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  hospitalCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  hospitalInfo: {
    flex: 1,
    marginLeft: 12,
  },
  hospitalLabel: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginBottom: 4,
  },
  hospitalName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  hospitalLocation: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  emergencyButton: {
    backgroundColor: COLORS.red,
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    marginBottom: 24,
    shadowColor: COLORS.red,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  emergencyText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.white,
    marginTop: 12,
  },
  emergencySubtext: {
    fontSize: 14,
    color: COLORS.white,
    opacity: 0.9,
    marginTop: 4,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: 16,
  },
  actionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 20,
  },
  actionCard: {
    width: '48%',
    backgroundColor: COLORS.white,
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 3,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#E2E8EF',
  },
  actionIconContainer: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  actionTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.text,
    textAlign: 'center',
  },
  infoCard: {
    flexDirection: 'row',
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  infoContent: {
    flex: 1,
    marginLeft: 12,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 4,
  },
  infoText: {
    fontSize: 14,
    color: COLORS.textSecondary,
    lineHeight: 20,
  },
});
