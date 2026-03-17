import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useAuth } from '../../contexts/AuthContext';
import { useHospital } from '../../contexts/HospitalContext';
import api from '../../utils/api';
import { COLORS } from '../../utils/colors';

export default function LoginScreen() {
  const router = useRouter();
  const { login } = useAuth();
  const { setSelectedHospital, setSelectedLocation } = useHospital();
  const [isLogin, setIsLogin] = useState(true);
  const role = 'patient';
  const [loading, setLoading] = useState(false);

  // Form fields
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('');
  const fontFamily = Platform.OS === 'web' ? 'Segoe UI' : undefined;

  const handleSubmit = async () => {
    if (!email || !password || (!isLogin && !name)) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    setLoading(true);
    try {
      if (isLogin) {
        console.log('Attempting login with:', { email });
        const response = await api.post('/api/auth/login', { email, password });
        console.log('Login response:', response.data);
        if (response.data.success) {
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
        console.log('Attempting register with:', { name, email, phone });
        const response = await api.post('/api/auth/register', {
          name,
          email,
          password,
          role,
          phone,
        });
        console.log('Register response:', response.data);
        if (response.data.success) {
          await login(response.data.user);
          router.replace('/location/select');
        }
      }
    } catch (error: any) {
      console.error('Auth error:', error);
      console.error('Error response:', error.response?.data);
      console.error('Error message:', error.message);
      const errorMsg = error.response?.data?.detail 
        || error.message 
        || 'An error occurred. Please try again.';
      Alert.alert('Error', errorMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.pageWrap}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.iconContainer}>
            <MaterialCommunityIcons name="hospital-box" size={60} color={COLORS.white} />
          </View>
          <Text style={[styles.title, { fontFamily }]}>MedConnect</Text>
          <Text style={[styles.subtitle, { fontFamily }]}>Patient Login & Registration</Text>
        </View>

        {/* Form Card */}
        <View style={styles.formCard}>
          {/* Toggle Login/Register */}
          <View style={styles.toggleContainer}>
            <TouchableOpacity
              style={[styles.toggleButton, isLogin && styles.toggleButtonActive]}
              onPress={() => setIsLogin(true)}
            >
              <Text style={[styles.toggleText, isLogin && styles.toggleTextActive, { fontFamily }]}>
                Login
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.toggleButton, !isLogin && styles.toggleButtonActive]}
              onPress={() => setIsLogin(false)}
            >
              <Text style={[styles.toggleText, !isLogin && styles.toggleTextActive, { fontFamily }]}>
                Register
              </Text>
            </TouchableOpacity>
          </View>

          {!isLogin && (
            <View style={styles.roleContainer}>
              <Text style={[styles.label, { fontFamily }]}>Account Type</Text>
              <View style={styles.roleButtons}>
                <View style={[styles.roleButton, styles.roleButtonActive]}>
                  <MaterialCommunityIcons name="account" size={24} color={COLORS.white} />
                  <Text style={[styles.roleButtonText, styles.roleButtonTextActive, { fontFamily }]}>Patient</Text>
                </View>
              </View>
            </View>
          )}

          {/* Form Fields */}
          {!isLogin && (
            <View style={styles.inputContainer}>
              <MaterialCommunityIcons
                name="account"
                size={20}
                color={COLORS.gray}
                style={styles.inputIcon}
              />
              <TextInput
                style={styles.input}
                placeholder="Full Name"
                value={name}
                onChangeText={setName}
                autoCapitalize="words"
              />
            </View>
          )}

          <View style={styles.inputContainer}>
            <MaterialCommunityIcons
              name="email"
              size={20}
              color={COLORS.gray}
              style={styles.inputIcon}
            />
            <TextInput
              style={styles.input}
              placeholder="Email"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
            />
          </View>

          <View style={styles.inputContainer}>
            <MaterialCommunityIcons
              name="lock"
              size={20}
              color={COLORS.gray}
              style={styles.inputIcon}
            />
            <TextInput
              style={styles.input}
              placeholder="Password"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
            />
          </View>

          {!isLogin && (
            <View style={styles.inputContainer}>
              <MaterialCommunityIcons
                name="phone"
                size={20}
                color={COLORS.gray}
                style={styles.inputIcon}
              />
              <TextInput
                style={styles.input}
                placeholder="Phone Number (Optional)"
                value={phone}
                onChangeText={setPhone}
                keyboardType="phone-pad"
              />
            </View>
          )}

          {/* Submit Button */}
          <TouchableOpacity
            style={styles.submitButton}
            onPress={handleSubmit}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color={COLORS.white} />
            ) : (
              <Text style={styles.submitButtonText}>
                {isLogin ? 'Login' : 'Register'}
              </Text>
            )}
          </TouchableOpacity>

          {/* Demo Accounts */}
          <View style={styles.demoContainer}>
            <Text style={[styles.demoTitle, { fontFamily }]}>Demo Login Credentials</Text>
            <View style={styles.demoAccountCard}>
              <Text style={[styles.demoLabel, { fontFamily }]}>Patient Account:</Text>
              <Text style={[styles.demoEmail, { fontFamily }]}>demo@medconnect.com</Text>
              <Text style={[styles.demoPassword, { fontFamily }]}>Demo@123</Text>
            </View>
            <View style={styles.demoAccountCard}>
              <Text style={[styles.demoLabel, { fontFamily }]}>Staff Account (future use):</Text>
              <Text style={[styles.demoEmail, { fontFamily }]}>admin@medconnect.com</Text>
              <Text style={[styles.demoPassword, { fontFamily }]}>Staff@123</Text>
            </View>
          </View>
        </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F3F7FA',
  },
  scrollContent: {
    flexGrow: 1,
    paddingVertical: 24,
  },
  pageWrap: {
    width: '100%',
    maxWidth: 560,
    alignSelf: 'center',
    paddingHorizontal: 16,
  },
  header: {
    alignItems: 'center',
    paddingTop: 16,
    paddingBottom: 18,
  },
  iconContainer: {
    width: 92,
    height: 92,
    backgroundColor: '#0F4C81',
    borderRadius: 46,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  title: {
    fontSize: 34,
    fontWeight: '800',
    color: '#1B2A35',
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 16,
    color: '#566977',
  },
  formCard: {
    backgroundColor: COLORS.white,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#D7E2EC',
    padding: 24,
  },
  toggleContainer: {
    flexDirection: 'row',
    backgroundColor: '#EEF3F8',
    borderRadius: 12,
    padding: 4,
    marginBottom: 24,
  },
  toggleButton: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderRadius: 8,
  },
  toggleButtonActive: {
    backgroundColor: '#0F4C81',
  },
  toggleText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#6D7E8D',
  },
  toggleTextActive: {
    color: COLORS.white,
  },
  roleContainer: {
    marginBottom: 24,
  },
  label: {
    fontSize: 14,
    fontWeight: '700',
    color: '#2A3F4E',
    marginBottom: 12,
  },
  roleButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  roleButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#0F4C81',
    gap: 8,
  },
  roleButtonActive: {
    backgroundColor: '#0F4C81',
  },
  roleButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.primary,
  },
  roleButtonTextActive: {
    color: COLORS.white,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#CCD9E6',
    paddingHorizontal: 16,
    marginBottom: 16,
    height: 56,
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: COLORS.text,
  },
  submitButton: {
    backgroundColor: '#0F4C81',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 8,
    shadowColor: '#0F4C81',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.18,
    shadowRadius: 6,
    elevation: 5,
  },
  submitButtonText: {
    fontSize: 17,
    fontWeight: '700',
    color: COLORS.white,
  },
  demoContainer: {
    marginTop: 24,
    padding: 16,
    backgroundColor: '#F4F8FB',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#D7E2EC',
  },
  demoTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1B2A35',
    marginBottom: 12,
    textAlign: 'center',
  },
  demoAccountCard: {
    backgroundColor: COLORS.white,
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
    borderLeftWidth: 3,
    borderLeftColor: '#0F4C81',
  },
  demoLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#566977',
    marginBottom: 4,
  },
  demoEmail: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0F4C81',
    marginBottom: 2,
  },
  demoPassword: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1B2A35',
  },
});
