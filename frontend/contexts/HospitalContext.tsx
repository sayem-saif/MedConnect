import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface Hospital {
  _id: string;
  name: string;
  address: string;
  city: string;
  state: string;
  country: string;
  phone: string;
  email: string;
}

interface Location {
  country: string;
  state: string;
  city: string;
}

interface HospitalContextType {
  selectedHospital: Hospital | null;
  selectedLocation: Location | null;
  setSelectedHospital: (hospital: Hospital | null) => void;
  setSelectedLocation: (location: Location | null) => void;
  clearSelection: () => void;
  isHospitalSelected: boolean;
}

const HospitalContext = createContext<HospitalContextType | undefined>(undefined);

export const HospitalProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [selectedHospital, setSelectedHospitalState] = useState<Hospital | null>(null);
  const [selectedLocation, setSelectedLocationState] = useState<Location | null>(null);

  useEffect(() => {
    loadSavedData();
  }, []);

  const loadSavedData = async () => {
    try {
      const [hospitalData, locationData] = await Promise.all([
        AsyncStorage.getItem('selectedHospital'),
        AsyncStorage.getItem('selectedLocation'),
      ]);

      if (hospitalData) {
        setSelectedHospitalState(JSON.parse(hospitalData));
      }
      if (locationData) {
        setSelectedLocationState(JSON.parse(locationData));
      }
    } catch (error) {
      console.error('Error loading saved data:', error);
    }
  };

  const setSelectedHospital = async (hospital: Hospital | null) => {
    setSelectedHospitalState(hospital);
    try {
      if (hospital) {
        await AsyncStorage.setItem('selectedHospital', JSON.stringify(hospital));
      } else {
        await AsyncStorage.removeItem('selectedHospital');
      }
    } catch (error) {
      console.error('Error saving hospital:', error);
    }
  };

  const setSelectedLocation = async (location: Location | null) => {
    setSelectedLocationState(location);
    try {
      if (location) {
        await AsyncStorage.setItem('selectedLocation', JSON.stringify(location));
      } else {
        await AsyncStorage.removeItem('selectedLocation');
      }
    } catch (error) {
      console.error('Error saving location:', error);
    }
  };

  const clearSelection = async () => {
    setSelectedHospitalState(null);
    setSelectedLocationState(null);
    try {
      await AsyncStorage.multiRemove(['selectedHospital', 'selectedLocation']);
    } catch (error) {
      console.error('Error clearing selection:', error);
    }
  };

  return (
    <HospitalContext.Provider
      value={{
        selectedHospital,
        selectedLocation,
        setSelectedHospital,
        setSelectedLocation,
        clearSelection,
        isHospitalSelected: selectedHospital !== null,
      }}
    >
      {children}
    </HospitalContext.Provider>
  );
};

export const useHospital = () => {
  const context = useContext(HospitalContext);
  if (context === undefined) {
    throw new Error('useHospital must be used within a HospitalProvider');
  }
  return context;
};
