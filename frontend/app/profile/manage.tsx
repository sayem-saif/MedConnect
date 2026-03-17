import React, { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  Platform,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useAuth } from '../../contexts/AuthContext';
import api from '../../utils/api';
import { COLORS } from '../../utils/colors';

type ProfileData = Record<string, any>;

const LABELS: Record<string, string> = {
  full_name: 'Full Name',
  date_of_birth: 'Date of Birth',
  gender: 'Gender',
  address: 'Address',
  blood_group: 'Blood Group',
  allergies: 'Allergies',
  chronic_conditions: 'Chronic Conditions',
  current_medications: 'Current Medications',
  emergency_name: 'Emergency Contact Name',
  emergency_phone: 'Emergency Contact Phone',
  emergency_relation: 'Relationship',
  insurance_provider: 'Insurance Provider',
  policy_number: 'Policy Number',
  policy_expiry: 'Policy Expiry',
  notifications_enabled: 'Enable Notifications',
  sms_alerts: 'SMS Alerts',
  marketing_messages: 'Marketing Messages',
  profile_visibility: 'Profile Visibility',
  two_factor_enabled: 'Enable 2FA',
  support_topic: 'Support Topic',
  support_message: 'Support Message',
};

const SECTION_FIELDS: Record<string, { key: string; type?: 'boolean' }[]> = {
  personal_information: [
    { key: 'full_name' },
    { key: 'date_of_birth' },
    { key: 'gender' },
    { key: 'address' },
  ],
  medical_records: [
    { key: 'blood_group' },
    { key: 'allergies' },
    { key: 'chronic_conditions' },
    { key: 'current_medications' },
  ],
  emergency_contacts: [
    { key: 'emergency_name' },
    { key: 'emergency_phone' },
    { key: 'emergency_relation' },
  ],
  insurance_information: [
    { key: 'insurance_provider' },
    { key: 'policy_number' },
    { key: 'policy_expiry' },
  ],
  notifications: [
    { key: 'notifications_enabled', type: 'boolean' },
    { key: 'sms_alerts', type: 'boolean' },
    { key: 'marketing_messages', type: 'boolean' },
  ],
  privacy_security: [
    { key: 'profile_visibility' },
    { key: 'two_factor_enabled', type: 'boolean' },
  ],
  help_support: [
    { key: 'support_topic' },
    { key: 'support_message' },
  ],
};

export default function ProfileManageScreen() {
  const router = useRouter();
  const { section = 'personal_information', title = 'Profile Section' } = useLocalSearchParams<{
    section?: string;
    title?: string;
  }>();
  const { user } = useAuth();
  const fontFamily = Platform.OS === 'web' ? 'Segoe UI' : undefined;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState<ProfileData>({});

  const activeSection = String(section);
  const activeFields = useMemo(() => SECTION_FIELDS[activeSection] || [], [activeSection]);

  useEffect(() => {
    const loadSectionData = async () => {
      if (!user?._id) return;
      setLoading(true);
      try {
        const response = await api.get(`/api/users/${user._id}/profile`);
        const sectionData = response.data?.profile?.[activeSection] || {};
        setFormData(sectionData);
      } catch (error) {
        console.error('Failed to load profile section:', error);
      } finally {
        setLoading(false);
      }
    };

    loadSectionData();
  }, [user?._id, activeSection]);

  const saveSection = async () => {
    if (!user?._id) {
      Alert.alert('Error', 'User not found. Please login again.');
      return;
    }

    setSaving(true);
    try {
      await api.put(`/api/users/${user._id}/profile-section`, {
        section: activeSection,
        data: formData,
      });
      Alert.alert('Saved', 'Your information has been saved.');
      router.back();
    } catch (error: any) {
      Alert.alert('Error', error?.response?.data?.detail || 'Failed to save information.');
    } finally {
      setSaving(false);
    }
  };

  const updateField = (key: string, value: any) => {
    setFormData((prev) => ({ ...prev, [key]: value }));
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={[styles.headerTitle, { fontFamily }]}>{String(title)}</Text>
        <Text style={[styles.headerSubtitle, { fontFamily }]}>Update your details and save changes.</Text>
      </View>

      {loading ? (
        <View style={styles.loaderWrap}>
          <ActivityIndicator size="large" color={COLORS.primary} />
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.content}>
          {activeFields.map((field) => (
            <View style={styles.fieldWrap} key={field.key}>
              <Text style={[styles.label, { fontFamily }]}>{LABELS[field.key] || field.key}</Text>
              {field.type === 'boolean' ? (
                <Switch
                  value={Boolean(formData[field.key])}
                  onValueChange={(v) => updateField(field.key, v)}
                  trackColor={{ false: '#CCD9E6', true: '#0F4C81' }}
                />
              ) : (
                <TextInput
                  style={[styles.input, { fontFamily }]}
                  value={String(formData[field.key] || '')}
                  onChangeText={(v) => updateField(field.key, v)}
                  placeholder={`Enter ${LABELS[field.key] || field.key}`}
                />
              )}
            </View>
          ))}

          <TouchableOpacity style={styles.saveButton} onPress={saveSection} disabled={saving}>
            {saving ? <ActivityIndicator color={COLORS.white} /> : <Text style={[styles.saveText, { fontFamily }]}>Save Changes</Text>}
          </TouchableOpacity>
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F3F7FA' },
  header: {
    padding: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#D7E2EC',
    backgroundColor: COLORS.white,
  },
  headerTitle: { fontSize: 21, fontWeight: '800', color: '#1B2A35' },
  headerSubtitle: { fontSize: 12, color: '#5B6C7D', marginTop: 4 },
  loaderWrap: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  content: { padding: 14, maxWidth: 760, width: '100%', alignSelf: 'center' },
  fieldWrap: {
    backgroundColor: COLORS.white,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#D7E2EC',
    padding: 10,
    marginBottom: 8,
  },
  label: { fontSize: 12, fontWeight: '700', color: '#2A3F4E', marginBottom: 6 },
  input: {
    borderWidth: 1,
    borderColor: '#CCD9E6',
    borderRadius: 7,
    backgroundColor: '#FFFFFF',
    height: 40,
    paddingHorizontal: 10,
    color: '#1B2A35',
    fontSize: 14,
  },
  saveButton: {
    marginTop: 8,
    backgroundColor: '#0F4C81',
    borderRadius: 8,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveText: { color: COLORS.white, fontWeight: '700', fontSize: 14 },
});
