import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  ImageBackground,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ActivityIndicator,
} from 'react-native';

// Firebase imports
import { db, auth } from '../Firebase/firebase.config';
import { doc, setDoc } from 'firebase/firestore';

const ProfileSetupScreen = ({ navigation, route }) => {
  const { role } = route.params;

  // ---------- STATES ----------
  const [name, setName]               = useState('');
  const [age, setAge]                 = useState('');
  const [phone, setPhone]             = useState('');
  const [email, setEmail]             = useState('');
  const [address, setAddress]         = useState('');

  // Patient-only
  const [bloodGroup, setBloodGroup]         = useState('');
  const [pregnancyWeek, setPregnancyWeek]   = useState('');

  // Doctor-only
  const [specialization, setSpecialization] = useState('');
  const [experience, setExperience]         = useState('');
  const [education, setEducation]           = useState('');
  const [hospital, setHospital]             = useState('');

  const [loading, setLoading] = useState(false);

  // ---------- SUBMIT ----------
  const handleSubmit = async () => {
    if (!name.trim()) {
      Alert.alert('Validation', 'Please enter your full name.');
      return;
    }

    setLoading(true);

    try {
      const uid = auth.currentUser?.uid;

      if (!uid) {
        Alert.alert('Error', 'User not authenticated. Please log in again.');
        setLoading(false);
        return;
      }

      // Build the profile object based on role
      const profileData = {
        uid,
        role,
        name:    name.trim(),
        age:     age.trim(),
        phone:   phone.trim(),
        email:   email.trim(),
        address: address.trim(),
        createdAt: new Date().toISOString(),
        ...(role === 'patient' && {
          bloodGroup:     bloodGroup.trim(),
          pregnancyWeek:  pregnancyWeek.trim(),
        }),
        ...(role === 'doctor' && {
          specialization: specialization.trim(),
          experience:     experience.trim(),
          education:      education.trim(),
          hospital:       hospital.trim(),
        }),
      };

      // Save to Firestore under "users/{uid}"
      await setDoc(doc(db, 'users', uid), profileData);

      // Navigate to the correct home screen
      navigation.reset({
        index: 0,
        routes: [{ name: role === 'doctor' ? 'DoctorHome' : 'PatientHome' }],
      });

    } catch (error) {
      console.error('Profile save error:', error);
      Alert.alert('Error', 'Failed to save profile. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // ---------- RENDER ----------
  return (
    <ImageBackground
      source={require('../assets/BGI.png')}
      style={styles.background}
      resizeMode="cover"
    >
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView contentContainerStyle={styles.container}>

          <Text style={styles.title}>Complete Your Profile</Text>

          {/* ── COMMON FIELDS ── */}
          <TextInput
            placeholder="Full Name"
            style={styles.input}
            value={name}
            onChangeText={setName}
          />
          <TextInput
            placeholder="Age"
            style={styles.input}
            keyboardType="numeric"
            value={age}
            onChangeText={setAge}
          />
          <TextInput
            placeholder="Phone"
            style={styles.input}
            keyboardType="phone-pad"
            value={phone}
            onChangeText={setPhone}
          />
          <TextInput
            placeholder="Email"
            style={styles.input}
            keyboardType="email-address"
            autoCapitalize="none"
            value={email}
            onChangeText={setEmail}
          />
          <TextInput
            placeholder="Address"
            style={styles.input}
            value={address}
            onChangeText={setAddress}
          />

          {/* ── PATIENT FIELDS ── */}
          {role === 'patient' && (
            <>
              <TextInput
                placeholder="Pregnancy Week"
                style={styles.input}
                keyboardType="numeric"
                value={pregnancyWeek}
                onChangeText={setPregnancyWeek}
              />
              <TextInput
                placeholder="Blood Group (e.g. A+)"
                style={styles.input}
                value={bloodGroup}
                onChangeText={setBloodGroup}
              />
            </>
          )}

          {/* ── DOCTOR FIELDS ── */}
          {role === 'doctor' && (
            <>
              <TextInput
                placeholder="Specialization"
                style={styles.input}
                value={specialization}
                onChangeText={setSpecialization}
              />
              <TextInput
                placeholder="Experience (e.g. 5 years)"
                style={styles.input}
                value={experience}
                onChangeText={setExperience}
              />
              <TextInput
                placeholder="Education (e.g. MBBS, FCPS)"
                style={styles.input}
                value={education}
                onChangeText={setEducation}
              />
              <TextInput
                placeholder="Hospital / Clinic"
                style={styles.input}
                value={hospital}
                onChangeText={setHospital}
              />
            </>
          )}

          {/* ── SUBMIT ── */}
          <TouchableOpacity
            style={[styles.button, loading && { opacity: 0.7 }]}
            onPress={handleSubmit}
            disabled={loading}
          >
            {loading
              ? <ActivityIndicator color="#fff" />
              : <Text style={styles.buttonText}>Continue</Text>
            }
          </TouchableOpacity>

        </ScrollView>
      </KeyboardAvoidingView>
    </ImageBackground>
  );
};

export default ProfileSetupScreen;

const styles = StyleSheet.create({
  background: { flex: 1 },

  container: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 20,
  },

  title: {
    fontSize: 28,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 25,
    color: '#0D47A1',
  },

  input: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#BBDEFB',
    borderRadius: 14,
    padding: 14,
    marginBottom: 15,
  },

  button: {
    backgroundColor: '#1565C0',
    padding: 16,
    borderRadius: 14,
    alignItems: 'center',
    marginTop: 10,
  },

  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});