import React, { useEffect } from 'react';
import { View, StyleSheet, Image, ActivityIndicator } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useAuth } from '../contexts/AuthContext';
import { useHospital } from '../contexts/HospitalContext';
import { COLORS } from '../utils/colors';

export default function SplashScreen() {
  const router = useRouter();
  const { user, isLoading } = useAuth();
  const { isHospitalSelected } = useHospital();

  useEffect(() => {
    if (!isLoading) {
      const timer = setTimeout(() => {
        if (!user) {
          router.replace('/about');
        } else if (!isHospitalSelected) {
          router.replace('/location/select');
        } else {
          router.replace('/(tabs)/home');
        }
      }, 2000);

      return () => clearTimeout(timer);
    }
  }, [user, isLoading, isHospitalSelected, router]);

  if (isLoading) {
    return null;
  }

  return (
    <View style={styles.container}>
      <View style={styles.logoContainer}>
        <View style={styles.logo}>
          <MaterialCommunityIcons name="hospital-box" size={80} color={COLORS.primary} />
        </View>
      </View>
      <ActivityIndicator size="large" color={COLORS.primary} style={styles.loader} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 40,
  },
  logo: {
    width: 120,
    height: 120,
    backgroundColor: COLORS.white,
    borderRadius: 60,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  logoImage: {
    width: 80,
    height: 80,
  },
  loader: {
    marginTop: 20,
  },
});
