import React, { useState } from 'react';
import {
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useAuth } from '../contexts/AuthContext';
import { useHospital } from '../contexts/HospitalContext';
import api from '../utils/api';
import { COLORS } from '../utils/colors';

export default function AboutScreen() {
  const router = useRouter();
  const { login } = useAuth();
  const { setSelectedHospital, setSelectedLocation } = useHospital();
  const { width } = useWindowDimensions();
  const isDesktop = width >= 1100;
  const fontFamily = Platform.OS === 'web' ? 'Segoe UI' : undefined;

  const [isLogin, setIsLogin] = useState(true);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);

  const handleAuthSubmit = async () => {
    if (!email || !password || (!isLogin && !name)) {
      Alert.alert('Error', 'Please fill all required fields.');
      return;
    }

    setLoading(true);
    try {
      if (isLogin) {
        const response = await api.post('/api/auth/login', { email, password });
        if (response.data?.success) {
          await login(response.data.user);
          const preferences = response.data.user?.preferences;
          if (preferences?.selected_hospital && preferences?.selected_location) {
            await setSelectedHospital(preferences.selected_hospital);
            await setSelectedLocation(preferences.selected_location);
            router.replace('/(tabs)/home');
          } else {
            router.replace('/location/select');
          }
        }
      } else {
        const response = await api.post('/api/auth/register', {
          name,
          email,
          password,
          phone,
          role: 'patient',
        });
        if (response.data?.success) {
          await login(response.data.user);
          router.replace('/location/select');
        }
      }
    } catch (error: any) {
      const message =
        error?.response?.data?.detail || error?.message || 'Authentication failed. Please try again.';
      Alert.alert('Error', message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.flex1}>
        <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
          <View style={styles.heroCard}>
            <Text style={[styles.brand, { fontFamily }]}>MedConnect</Text>
            <Text style={[styles.headline, { fontFamily }]}>Every Hospital Connected At Your Step</Text>
            <Text style={[styles.copy, { fontFamily }]}> 
              Discover verified hospitals, live bed capacity, and emergency support in one platform.
              Sign in now and continue to location selection for nearby care options.
            </Text>
            <View style={styles.featureList}>
              <Text style={[styles.featureItem, { fontFamily }]}>Verified hospital network</Text>
              <Text style={[styles.featureItem, { fontFamily }]}>Real-time ICU, CCU and oxygen insights</Text>
              <Text style={[styles.featureItem, { fontFamily }]}>Fast patient-first emergency journey</Text>
            </View>
          </View>

          <View style={[styles.responsiveContainer, isDesktop && styles.desktopContainer]}>
            <View style={styles.aboutCard}>
              <Text style={[styles.sectionTitle, { fontFamily }]}>Why Patients Use MedConnect</Text>
              <Text style={[styles.aboutCopy, { fontFamily }]}> 
                We help patients compare nearby hospitals before booking, reduce emergency delays,
                and make better care decisions with clearer live capacity information.
              </Text>
              <View style={styles.pointRow}>
                <MaterialCommunityIcons name="check-circle-outline" size={20} color="#0F4C81" />
                <Text style={[styles.pointText, { fontFamily }]}>Search by country, state and city after login</Text>
              </View>
              <View style={styles.pointRow}>
                <MaterialCommunityIcons name="check-circle-outline" size={20} color="#0F4C81" />
                <Text style={[styles.pointText, { fontFamily }]}>Switch hospitals anytime from profile</Text>
              </View>
              <View style={styles.pointRow}>
                <MaterialCommunityIcons name="check-circle-outline" size={20} color="#0F4C81" />
                <Text style={[styles.pointText, { fontFamily }]}>Built for mobile and laptop screens</Text>
              </View>
            </View>

            <View style={styles.authCard}>
              <Text style={[styles.sectionTitle, { fontFamily }]}>Get Started</Text>
              <View style={styles.toggleContainer}>
                <TouchableOpacity
                  style={[styles.toggleButton, isLogin && styles.toggleButtonActive]}
                  onPress={() => setIsLogin(true)}
                >
                  <Text style={[styles.toggleText, isLogin && styles.toggleTextActive, { fontFamily }]}>Login</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.toggleButton, !isLogin && styles.toggleButtonActive]}
                  onPress={() => setIsLogin(false)}
                >
                  <Text style={[styles.toggleText, !isLogin && styles.toggleTextActive, { fontFamily }]}>Sign Up</Text>
                </TouchableOpacity>
              </View>

              {!isLogin && (
                <View style={styles.inputContainer}>
                  <TextInput
                    style={[styles.input, { fontFamily }]}
                    placeholder="Full Name"
                    value={name}
                    onChangeText={setName}
                    autoCapitalize="words"
                  />
                </View>
              )}

              <View style={styles.inputContainer}>
                <TextInput
                  style={[styles.input, { fontFamily }]}
                  placeholder="Email"
                  value={email}
                  onChangeText={setEmail}
                  autoCapitalize="none"
                  keyboardType="email-address"
                />
              </View>

              <View style={styles.inputContainer}>
                <TextInput
                  style={[styles.input, { fontFamily }]}
                  placeholder="Password"
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry
                />
              </View>

              {!isLogin && (
                <View style={styles.inputContainer}>
                  <TextInput
                    style={[styles.input, { fontFamily }]}
                    placeholder="Phone Number (Optional)"
                    value={phone}
                    onChangeText={setPhone}
                    keyboardType="phone-pad"
                  />
                </View>
              )}

              <TouchableOpacity style={styles.submitButton} onPress={handleAuthSubmit} disabled={loading}>
                {loading ? (
                  <ActivityIndicator size="small" color={COLORS.white} />
                ) : (
                  <Text style={[styles.submitText, { fontFamily }]}>{isLogin ? 'Login and Continue' : 'Create Account and Continue'}</Text>
                )}
              </TouchableOpacity>

              <Text style={[styles.noteText, { fontFamily }]}>After successful authentication, you will select your location and view nearby hospitals.</Text>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  flex1: { flex: 1 },
  container: { flex: 1, backgroundColor: '#F3F7FA' },
  scroll: { flex: 1 },
  content: { padding: 16, paddingBottom: 24, maxWidth: 1240, width: '100%', alignSelf: 'center' },
  heroCard: {
    backgroundColor: '#0F4C81',
    borderRadius: 14,
    padding: 18,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#0C3D67',
  },
  brand: { color: '#D2E8F8', fontSize: 13, fontWeight: '700', letterSpacing: 1.2 },
  headline: { color: COLORS.white, fontSize: 28, fontWeight: '800', marginTop: 8, lineHeight: 34 },
  copy: { color: '#E7F1F9', fontSize: 15, marginTop: 8, lineHeight: 22 },
  featureList: { marginTop: 10 },
  featureItem: { color: '#E7F1F9', fontSize: 13, fontWeight: '600', marginBottom: 3 },
  responsiveContainer: {
    width: '100%',
    alignSelf: 'center',
    gap: 12,
  },
  desktopContainer: {
    maxWidth: 1180,
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  aboutCard: {
    backgroundColor: COLORS.white,
    borderRadius: 14,
    padding: 14,
    flex: 1,
    borderWidth: 1,
    borderColor: '#D7E2EC',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  authCard: {
    backgroundColor: COLORS.white,
    borderRadius: 14,
    padding: 14,
    flex: 1.4,
    borderWidth: 1,
    borderColor: '#D7E2EC',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  sectionTitle: { fontSize: 22, fontWeight: '800', color: '#1B2A35', marginBottom: 8 },
  aboutCopy: { fontSize: 14, color: '#4A5B69', lineHeight: 20, marginBottom: 10 },
  pointRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 6 },
  pointText: { color: '#2E3F4C', fontSize: 13, fontWeight: '600' },
  toggleContainer: {
    flexDirection: 'row',
    backgroundColor: '#EEF3F8',
    borderRadius: 10,
    padding: 4,
    marginBottom: 10,
  },
  toggleButton: { flex: 1, borderRadius: 8, paddingVertical: 8, alignItems: 'center' },
  toggleButtonActive: { backgroundColor: '#0F4C81' },
  toggleText: { fontSize: 14, fontWeight: '700', color: '#5B6C7D' },
  toggleTextActive: { color: '#FFFFFF' },
  inputContainer: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#CCD9E6',
    borderRadius: 10,
    marginBottom: 8,
    paddingHorizontal: 12,
  },
  input: { height: 44, fontSize: 14, color: '#1F2F3A' },
  submitButton: {
    backgroundColor: '#0F4C81',
    borderRadius: 10,
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
  },
  submitText: { color: '#FFFFFF', fontSize: 14, fontWeight: '700' },
  noteText: { fontSize: 12, color: '#5D6E7D', marginTop: 10, lineHeight: 18 },
});
