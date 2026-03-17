import '../polyfills';
import React from 'react';
import { Stack } from 'expo-router';
import { AuthProvider } from '../contexts/AuthContext';
import { HospitalProvider } from '../contexts/HospitalContext';

export default function RootLayout() {
  return (
    <AuthProvider>
      <HospitalProvider>
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="index" />
          <Stack.Screen name="about" />
          <Stack.Screen name="(auth)/login" />
          <Stack.Screen name="(tabs)" />
          <Stack.Screen name="location/select" />
          <Stack.Screen name="profile/manage" />
          <Stack.Screen name="queue/track" />
        </Stack>
      </HospitalProvider>
    </AuthProvider>
  );
}
