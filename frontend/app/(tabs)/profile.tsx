import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  Platform,
  useWindowDimensions,
} from 'react-native';
import { useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useAuth } from '../../contexts/AuthContext';
import { useHospital } from '../../contexts/HospitalContext';
import { COLORS } from '../../utils/colors';

interface ProfileOption {
  id: string;
  title: string;
  icon: string;
  section: string;
}

export default function ProfileScreen() {
  const router = useRouter();
  const { user, logout } = useAuth();
  const { selectedHospital, selectedLocation, clearSelection } = useHospital();
  const { width } = useWindowDimensions();
  const fontFamily = Platform.OS === 'web' ? 'Segoe UI' : undefined;
  const isDesktop = width >= 1024;

  const performLogout = async () => {
    await clearSelection();
    await logout();
    router.replace('/about');
  };

  const handleLogout = async () => {
    try {
      if (Platform.OS === 'web') {
        const shouldLogout = globalThis.confirm('Are you sure you want to logout?');
        if (!shouldLogout) return;
        await performLogout();
        return;
      }

      await performLogout();
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  const handleChangeHospital = async () => {
    await clearSelection();
    router.replace('/location/select');
  };

  const options: ProfileOption[] = [
    {
      id: '1',
      title: 'Personal Information',
      icon: 'account-circle',
      section: 'personal_information',
    },
    {
      id: '2',
      title: 'Medical Records',
      icon: 'file-document',
      section: 'medical_records',
    },
    {
      id: '3',
      title: 'Emergency Contacts',
      icon: 'phone-alert',
      section: 'emergency_contacts',
    },
    {
      id: '4',
      title: 'Insurance Information',
      icon: 'shield-check',
      section: 'insurance_information',
    },
    {
      id: '5',
      title: 'Notifications',
      icon: 'bell',
      section: 'notifications',
    },
    {
      id: '6',
      title: 'Privacy & Security',
      icon: 'lock',
      section: 'privacy_security',
    },
    {
      id: '7',
      title: 'Help & Support',
      icon: 'help-circle',
      section: 'help_support',
    },
  ];

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={[styles.headerTitle, { fontFamily }]}>Profile</Text>
      </View>

      <ScrollView
        contentContainerStyle={[styles.scrollContent, isDesktop && styles.desktopContent]}
        showsVerticalScrollIndicator={false}
      >
        {/* User Info Card */}
        <View style={styles.userCard}>
          <View style={styles.avatarContainer}>
            <MaterialCommunityIcons name="account" size={48} color={COLORS.white} />
          </View>
          <View style={styles.userInfo}>
            <Text style={styles.userName}>{user?.name}</Text>
            <Text style={[styles.userEmail, { fontFamily }]}>{user?.email}</Text>
            <View style={styles.roleBadge}>
              <Text style={[styles.roleText, { fontFamily }]}> 
                {user?.role === 'hospital_staff' ? 'Hospital Staff' : 'Patient'}
              </Text>
            </View>
          </View>
        </View>

        {/* Options */}
        <View style={styles.optionsContainer}>
          {options.map((option) => (
            <TouchableOpacity
              key={option.id}
              style={styles.optionItem}
              onPress={() => router.push({ pathname: '/profile/manage', params: { section: option.section, title: option.title } })}
            >
              <View style={styles.optionLeft}>
                <View style={styles.optionIconContainer}>
                  <MaterialCommunityIcons
                    name={option.icon as any}
                    size={24}
                    color={COLORS.primary}
                  />
                </View>
                <Text style={[styles.optionTitle, { fontFamily }]}>{option.title}</Text>
              </View>
              <MaterialCommunityIcons name="chevron-right" size={24} color={COLORS.gray} />
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.hospitalSwitchCard}>
          <Text style={[styles.switchTitle, { fontFamily }]}>Current Hospital Selection</Text>
          <Text style={[styles.switchName, { fontFamily }]}>{selectedHospital?.name || 'No hospital selected'}</Text>
          <Text style={[styles.switchLocation, { fontFamily }]}> 
            {selectedLocation ? `${selectedLocation.city}, ${selectedLocation.state}, ${selectedLocation.country}` : 'Select location to continue booking services'}
          </Text>
          <TouchableOpacity style={styles.switchButton} onPress={handleChangeHospital}>
            <Text style={[styles.switchButtonText, { fontFamily }]}>Change Hospital</Text>
          </TouchableOpacity>
        </View>

        {/* Logout Button */}
        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <MaterialCommunityIcons name="logout" size={24} color={COLORS.red} />
          <Text style={[styles.logoutText, { fontFamily }]}>Logout</Text>
        </TouchableOpacity>

        {/* App Version */}
        <Text style={[styles.versionText, { fontFamily }]}>MedConnect v1.0.0</Text>
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
    padding: 20,
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  scrollContent: {
    padding: 20,
  },
  desktopContent: {
    width: '100%',
    maxWidth: 980,
    alignSelf: 'center',
  },
  userCard: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  avatarContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: 4,
  },
  userEmail: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginBottom: 8,
  },
  roleBadge: {
    backgroundColor: COLORS.lightGray,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  roleText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.primary,
  },
  optionsContainer: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  optionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  optionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  optionIconContainer: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: COLORS.lightGray,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  optionTitle: {
    fontSize: 14,
    color: COLORS.text,
    fontWeight: '600',
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: 16,
    gap: 8,
    borderWidth: 1,
    borderColor: COLORS.red,
    marginBottom: 24,
  },
  logoutText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.red,
  },
  versionText: {
    textAlign: 'center',
    fontSize: 12,
    color: COLORS.textSecondary,
    marginBottom: 20,
  },
  hospitalSwitchCard: {
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: 16,
  },
  switchTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.textSecondary,
  },
  switchName: {
    fontSize: 17,
    fontWeight: '700',
    color: COLORS.text,
    marginTop: 6,
  },
  switchLocation: {
    fontSize: 13,
    color: COLORS.textSecondary,
    marginTop: 4,
  },
  switchButton: {
    marginTop: 12,
    backgroundColor: COLORS.primary,
    borderRadius: 8,
    paddingVertical: 10,
    alignItems: 'center',
  },
  switchButtonText: {
    fontSize: 14,
    color: COLORS.white,
    fontWeight: '700',
  },
});
