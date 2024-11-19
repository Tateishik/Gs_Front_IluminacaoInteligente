import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Slider } from '@react-native-community/slider';

export default function MainScreen({ navigation }) {
  const [lightIntensity, setLightIntensity] = useState(0);
  const [streetLightStatus, setStreetLightStatus] = useState(false);

  useEffect(() => {
    fetchLightData();
  }, []);

  const fetchLightData = async () => {
    try {
      const token = await AsyncStorage.getItem('userToken');
      const response = await axios.get('http://10.0.2.2:3000/light-intensity', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setLightIntensity(response.data.intensity);
    } catch (error) {
      Alert.alert('Error', 'Failed to fetch light data');
    }
  };

  const updateLightIntensity = async (value) => {
    try {
      const token = await AsyncStorage.getItem('userToken');
      await axios.post('http://10.0.2.2:3000/update-light', { intensity: value }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setLightIntensity(value);
    } catch (error) {
      Alert.alert('Error', 'Failed to update light intensity');
    }
  };

  const toggleStreetLight = () => {
    setStreetLightStatus(!streetLightStatus);
  };

  const handleLogout = async () => {
    await AsyncStorage.removeItem('userToken');
    navigation.navigate('Login');
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Smart City Lighting Control</Text>
      <View style={styles.infoContainer}>
        <Text>Current Light Intensity: {lightIntensity}%</Text>
        <Text>Street Lights: {streetLightStatus ? 'ON' : 'OFF'}</Text>
      </View>
      <Slider
        style={styles.slider}
        minimumValue={0}
        maximumValue={100}
        value={lightIntensity}
        onValueChange={updateLightIntensity}
      />
      <TouchableOpacity style={styles.button} onPress={toggleStreetLight}>
        <Text style={styles.buttonText}>
          {streetLightStatus ? 'Turn Off Lights' : 'Turn On Lights'}
        </Text>
      </TouchableOpacity>
      <TouchableOpacity style={[styles.button, styles.logoutButton]} onPress={handleLogout}>
        <Text style={styles.buttonText}>Logout</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#f5f5f5',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    color: '#333',
  },
  infoContainer: {
    marginBottom: 20,
  },
  slider: {
    width: '100%',
    height: 40,
    marginBottom: 20,
  },
  button: {
    backgroundColor: '#007AFF',
    padding: 10,
    borderRadius: 5,
    width: '100%',
    alignItems: 'center',
    marginBottom: 10,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  logoutButton: {
    backgroundColor: '#FF3B30',
  },
});