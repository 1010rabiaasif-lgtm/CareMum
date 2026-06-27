import React, { useState } from 'react';

import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';

const RoleSelectionScreen = ({ navigation }) => {

  const [selectedRole, setSelectedRole] =
    useState(null);

  // ✅ CONTINUE FUNCTION
  const handleContinue = () => {

    if (!selectedRole) {

      alert('Please select a role');
      return;
    }

    // ✅ ONLY NAVIGATION
    navigation.replace(
      'ProfileSetup',
      {
        role: selectedRole,
      }
    );
  };

  return (

    <View style={styles.container}>

      <Text style={styles.title}>
        Select Your Role
      </Text>

      {/* DOCTOR CARD */}
      <TouchableOpacity
        style={[
          styles.card,
          selectedRole === 'doctor' &&
            styles.selectedCard,
        ]}
        onPress={() =>
          setSelectedRole('doctor')
        }
      >

        <Text style={styles.icon}>
          👨‍⚕️
        </Text>

        <Text style={styles.label}>
          Doctor
        </Text>

      </TouchableOpacity>

      {/* PATIENT CARD */}
      <TouchableOpacity
        style={[
          styles.card,
          selectedRole === 'patient' &&
            styles.selectedCard,
        ]}
        onPress={() =>
          setSelectedRole('patient')
        }
      >

        <Text style={styles.icon}>
          🤰
        </Text>

        <Text style={styles.label}>
          Patient
        </Text>

      </TouchableOpacity>

      {/* CONTINUE BUTTON */}
      <TouchableOpacity
        style={styles.button}
        onPress={handleContinue}
      >

        <Text style={styles.buttonText}>
          Continue
        </Text>

      </TouchableOpacity>

    </View>

  );
};

export default RoleSelectionScreen;

const styles = StyleSheet.create({

  container: {
    flex: 1,
    backgroundColor: '#DCF0F5',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },

  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 30,
    color: '#1E3A8A',
  },

  card: {
    width: '100%',
    padding: 20,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: '#ccc',
    alignItems: 'center',
    marginBottom: 20,
    backgroundColor: '#fff',
  },

  selectedCard: {
    borderColor: '#1E88E5',
    backgroundColor: '#E3F2FD',
  },

  icon: {
    fontSize: 40,
    marginBottom: 10,
  },

  label: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1E3A8A',
  },

  button: {
    marginTop: 20,
    backgroundColor: '#1E3A8A',
    paddingVertical: 15,
    paddingHorizontal: 40,
    borderRadius: 10,
  },

  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },

});