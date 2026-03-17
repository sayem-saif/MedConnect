import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  RefreshControl,
  Animated,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import api from '../../utils/api';
import { COLORS } from '../../utils/colors';

interface QueueStatus {
  success: boolean;
  queue_number: string;
  queue_position: number;
  patients_ahead: number;
  estimated_wait_minutes: number;
  status: string;
  current_serving: string;
}

export default function QueueTrackingScreen() {
  const router = useRouter();
  const { bookingId } = useLocalSearchParams();

  const [queueStatus, setQueueStatus] = useState<QueueStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const pulseAnim = useState(new Animated.Value(1))[0];

  useEffect(() => {
    fetchQueueStatus();
    
    // Auto-refresh every 30 seconds
    const interval = setInterval(() => {
      fetchQueueStatus(true);
    }, 30000);

    // Pulse animation for current serving token
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.1,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    ).start();

    return () => clearInterval(interval);
  }, [bookingId]);

  const fetchQueueStatus = async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const response = await api.get(`/api/queue/${bookingId}`);
      setQueueStatus(response.data);
    } catch (error) {
      console.error('Failed to fetch queue status:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchQueueStatus();
  };

  const getStatusColor = (position: number) => {
    if (position === 1) return COLORS.green;
    if (position <= 3) return COLORS.orange;
    return COLORS.primary;
  };

  const getStatusMessage = (position: number) => {
    if (position === 1) return "Your turn is next!";
    if (position === 2) return "Almost there! You're up in 2 turns";
    if (position <= 5) return "You'll be called soon";
    return "Please wait for your turn";
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <ActivityIndicator size="large" color={COLORS.primary} style={{ marginTop: 50 }} />
      </SafeAreaView>
    );
  }

  if (!queueStatus) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorState}>
          <MaterialCommunityIcons name="alert-circle" size={60} color={COLORS.red} />
          <Text style={styles.errorText}>Unable to load queue status</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <MaterialCommunityIcons name="arrow-left" size={24} color={COLORS.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Queue Status</Text>
        <TouchableOpacity onPress={() => fetchQueueStatus()} style={styles.refreshButton}>
          <MaterialCommunityIcons name="refresh" size={24} color={COLORS.primary} />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[COLORS.primary]} />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* Current Serving Token */}
        <View style={styles.currentServingCard}>
          <Text style={styles.currentServingLabel}>Now Serving</Text>
          <Animated.View style={[styles.currentTokenContainer, { transform: [{ scale: pulseAnim }] }]}>
            <MaterialCommunityIcons name="ticket" size={32} color={COLORS.white} />
            <Text style={styles.currentToken}>{queueStatus.current_serving || 'A-01'}</Text>
          </Animated.View>
          <View style={styles.statusIndicator}>
            <View style={styles.pulsingDot} />
            <Text style={styles.statusText}>In Progress</Text>
          </View>
        </View>

        {/* Your Token Card */}
        <View style={[styles.yourTokenCard, { borderColor: getStatusColor(queueStatus.queue_position) }]}>
          <View style={styles.tokenHeader}>
            <MaterialCommunityIcons name="account-circle" size={32} color={COLORS.primary} />
            <View style={styles.tokenHeaderText}>
              <Text style={styles.yourTokenLabel}>Your Token</Text>
              <Text style={styles.tokenStatus}>{getStatusMessage(queueStatus.queue_position)}</Text>
            </View>
          </View>

          <View style={styles.tokenNumberContainer}>
            <Text style={[styles.yourTokenNumber, { color: getStatusColor(queueStatus.queue_position) }]}>
              {queueStatus.queue_number}
            </Text>
          </View>

          <View style={styles.positionInfo}>
            <View style={styles.infoBox}>
              <MaterialCommunityIcons name="format-list-numbered" size={24} color={COLORS.primary} />
              <Text style={styles.infoLabel}>Position</Text>
              <Text style={styles.infoValue}>{queueStatus.queue_position}</Text>
            </View>

            <View style={styles.dividerVertical} />

            <View style={styles.infoBox}>
              <MaterialCommunityIcons name="account-group" size={24} color={COLORS.orange} />
              <Text style={styles.infoLabel}>People Ahead</Text>
              <Text style={styles.infoValue}>{queueStatus.patients_ahead}</Text>
            </View>

            <View style={styles.dividerVertical} />

            <View style={styles.infoBox}>
              <MaterialCommunityIcons name="clock-outline" size={24} color={COLORS.green} />
              <Text style={styles.infoLabel}>Est. Wait</Text>
              <Text style={styles.infoValue}>{queueStatus.estimated_wait_minutes} min</Text>
            </View>
          </View>
        </View>

        {/* Queue Timeline */}
        <View style={styles.timelineCard}>
          <Text style={styles.timelineTitle}>Queue Progress</Text>

          {/* Current Serving */}
          <View style={styles.timelineItem}>
            <View style={[styles.timelineDot, { backgroundColor: COLORS.green }]} />
            <View style={styles.timelineContent}>
              <Text style={styles.timelineLabel}>Currently Being Served</Text>
              <Text style={styles.timelineToken}>{queueStatus.current_serving || 'A-01'}</Text>
            </View>
          </View>

          {/* People Ahead */}
          {queueStatus.patients_ahead > 0 && (
            <View style={styles.timelineItem}>
              <View style={[styles.timelineDot, { backgroundColor: COLORS.orange }]} />
              <View style={styles.timelineContent}>
                <Text style={styles.timelineLabel}>Waiting</Text>
                <Text style={styles.timelineToken}>
                  {queueStatus.patients_ahead} patient{queueStatus.patients_ahead > 1 ? 's' : ''} ahead
                </Text>
              </View>
            </View>
          )}

          {/* Your Turn */}
          <View style={styles.timelineItem}>
            <View style={[styles.timelineDot, { backgroundColor: COLORS.primary }]}>
              <MaterialCommunityIcons name="account" size={16} color={COLORS.white} />
            </View>
            <View style={styles.timelineContent}>
              <Text style={[styles.timelineLabel, { color: COLORS.primary, fontWeight: 'bold' }]}>
                Your Turn
              </Text>
              <Text style={styles.timelineToken}>{queueStatus.queue_number}</Text>
            </View>
          </View>
        </View>

        {/* Instructions */}
        <View style={styles.instructionsCard}>
          <MaterialCommunityIcons name="information-outline" size={24} color={COLORS.primary} />
          <View style={styles.instructionsContent}>
            <Text style={styles.instructionsTitle}>Important Instructions</Text>
            <Text style={styles.instructionText}>
              - Please stay near the waiting area{'\n'}
              - You will be notified when it's your turn{'\n'}
              - Have your documents ready{'\n'}
              - If you miss your turn, you may need to wait again
            </Text>
          </View>
        </View>

        {/* Emergency Contact */}
        <TouchableOpacity style={styles.emergencyButton}>
          <MaterialCommunityIcons name="phone-alert" size={24} color={COLORS.white} />
          <Text style={styles.emergencyText}>Contact Reception</Text>
        </TouchableOpacity>

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16, backgroundColor: COLORS.white, borderBottomWidth: 1, borderBottomColor: COLORS.border },
  backButton: { width: 40, height: 40, borderRadius: 20, backgroundColor: COLORS.lightGray, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontSize: 18, fontWeight: 'bold', color: COLORS.text },
  refreshButton: { width: 40, height: 40, borderRadius: 20, backgroundColor: COLORS.primaryLight, alignItems: 'center', justifyContent: 'center' },
  content: { flex: 1, padding: 16 },
  currentServingCard: { backgroundColor: COLORS.primary, borderRadius: 20, padding: 24, alignItems: 'center', marginBottom: 16, shadowColor: COLORS.primary, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 6 },
  currentServingLabel: { color: COLORS.white, fontSize: 16, opacity: 0.9, marginBottom: 16 },
  currentTokenContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.2)', paddingHorizontal: 32, paddingVertical: 16, borderRadius: 16, gap: 12 },
  currentToken: { fontSize: 48, fontWeight: 'bold', color: COLORS.white },
  statusIndicator: { flexDirection: 'row', alignItems: 'center', marginTop: 16, gap: 8 },
  pulsingDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: COLORS.greenLight },
  statusText: { color: COLORS.white, fontSize: 14 },
  yourTokenCard: { backgroundColor: COLORS.white, borderRadius: 20, padding: 24, marginBottom: 16, borderWidth: 3, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 8, elevation: 5 },
  tokenHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 20, gap: 12 },
  tokenHeaderText: { flex: 1 },
  yourTokenLabel: { fontSize: 16, color: COLORS.textSecondary },
  tokenStatus: { fontSize: 14, color: COLORS.primary, marginTop: 4, fontWeight: '600' },
  tokenNumberContainer: { alignItems: 'center', marginBottom: 24 },
  yourTokenNumber: { fontSize: 56, fontWeight: 'bold' },
  positionInfo: { flexDirection: 'row', justifyContent: 'space-around' },
  infoBox: { alignItems: 'center', flex: 1 },
  infoLabel: { fontSize: 12, color: COLORS.textSecondary, marginTop: 8 },
  infoValue: { fontSize: 20, fontWeight: 'bold', color: COLORS.text, marginTop: 4 },
  dividerVertical: { width: 1, backgroundColor: COLORS.border },
  timelineCard: { backgroundColor: COLORS.white, borderRadius: 16, padding: 20, marginBottom: 16 },
  timelineTitle: { fontSize: 18, fontWeight: 'bold', color: COLORS.text, marginBottom: 20 },
  timelineItem: { flexDirection: 'row', alignItems: 'center', marginBottom: 16, paddingLeft: 8 },
  timelineDot: { width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center', marginRight: 16 },
  timelineContent: { flex: 1 },
  timelineLabel: { fontSize: 14, color: COLORS.textSecondary },
  timelineToken: { fontSize: 16, fontWeight: '600', color: COLORS.text, marginTop: 2 },
  instructionsCard: { flexDirection: 'row', backgroundColor: COLORS.white, borderRadius: 16, padding: 20, marginBottom: 16, borderLeftWidth: 4, borderLeftColor: COLORS.primary },
  instructionsContent: { flex: 1, marginLeft: 12 },
  instructionsTitle: { fontSize: 16, fontWeight: 'bold', color: COLORS.text, marginBottom: 8 },
  instructionText: { fontSize: 14, color: COLORS.textSecondary, lineHeight: 22 },
  emergencyButton: { flexDirection: 'row', backgroundColor: COLORS.red, padding: 18, borderRadius: 16, alignItems: 'center', justifyContent: 'center', gap: 12 },
  emergencyText: { color: COLORS.white, fontSize: 18, fontWeight: 'bold' },
  errorState: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 40 },
  errorText: { fontSize: 18, color: COLORS.textSecondary, marginTop: 16 },
});
