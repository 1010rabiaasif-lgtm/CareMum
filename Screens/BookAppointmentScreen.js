import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  TextInput,
} from 'react-native';
import { db, auth } from '../Firebase/firebase.config';
import {
  collection,
  query,
  where,
  getDocs,
  addDoc,
  serverTimestamp,
} from 'firebase/firestore';

const TIME_SLOTS = [
  '09:00 AM', '09:30 AM', '10:00 AM', '10:30 AM',
  '11:00 AM', '11:30 AM', '12:00 PM', '01:00 PM',
  '02:00 PM', '02:30 PM', '03:00 PM', '03:30 PM',
  '04:00 PM', '04:30 PM', '05:00 PM',
];

const BookAppointmentScreen = ({ navigation }) => {
  const [doctors, setDoctors]           = useState([]);
  const [selectedDoctor, setSelectedDoctor] = useState(null);
  const [date, setDate]                 = useState('');
  const [selectedTime, setSelectedTime] = useState('');
  const [loadingDoctors, setLoadingDoctors] = useState(true);
  const [booking, setBooking]           = useState(false);

  // ---------- LOAD DOCTORS ----------
  useEffect(() => {
    const fetchDoctors = async () => {
      try {
        const q = query(
          collection(db, 'users'),
          where('role', '==', 'doctor')
        );
        const snapshot = await getDocs(q);
        const list = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setDoctors(list);
      } catch (error) {
        console.error('Error fetching doctors:', error);
        Alert.alert('Error', 'Could not load doctors list.');
      } finally {
        setLoadingDoctors(false);
      }
    };

    fetchDoctors();
  }, []);

  // ---------- BOOK ----------
  const handleBook = async () => {
    if (!selectedDoctor) {
      Alert.alert('Select Doctor', 'Please select a doctor.');
      return;
    }
    if (!date.trim()) {
      Alert.alert('Enter Date', 'Please enter a date (e.g. 20 June 2026).');
      return;
    }
    if (!selectedTime) {
      Alert.alert('Select Time', 'Please select a time slot.');
      return;
    }

    setBooking(true);

    try {
      const user = auth.currentUser;

      await addDoc(collection(db, 'appointments'), {
        patientId:   user.uid,
        patientName: user.displayName || 'Patient',
        doctorId:    selectedDoctor.uid,
        doctorName:  selectedDoctor.name,
        date:        date.trim(),
        time:        selectedTime,
        status:      'pending',         // doctor will confirm/reject
        createdAt:   serverTimestamp(),
      });

      Alert.alert(
        'Appointment Requested! ✅',
        `Your appointment with Dr. ${selectedDoctor.name} on ${date} at ${selectedTime} has been sent for confirmation.`,
        [{ text: 'OK', onPress: () => navigation.goBack() }]
      );

    } catch (error) {
      console.error('Booking error:', error);
      Alert.alert('Error', 'Failed to book appointment. Please try again.');
    } finally {
      setBooking(false);
    }
  };

  // ---------- RENDER ----------
  if (loadingDoctors) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#1E3A8A" />
        <Text style={{ color: '#607D8B', marginTop: 10 }}>Loading doctors…</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>

      <Text style={styles.title}>Book Appointment</Text>

      {/* STEP 1 — SELECT DOCTOR */}
      <Text style={styles.stepLabel}>Step 1: Select a Doctor</Text>

      {doctors.length === 0
        ? <Text style={styles.empty}>No doctors available yet.</Text>
        : doctors.map(doctor => (
          <TouchableOpacity
            key={doctor.id}
            style={[
              styles.doctorCard,
              selectedDoctor?.id === doctor.id && styles.doctorCardSelected,
            ]}
            onPress={() => setSelectedDoctor(doctor)}
          >
            <Text style={styles.doctorName}>Dr. {doctor.name}</Text>
            <Text style={styles.doctorInfo}>
              {doctor.specialization || 'General'} • {doctor.hospital || '—'}
            </Text>
            <Text style={styles.doctorInfo}>
              {doctor.experience ? `${doctor.experience} experience` : ''}
            </Text>
          </TouchableOpacity>
        ))
      }

      {/* STEP 2 — DATE */}
      <Text style={styles.stepLabel}>Step 2: Enter Date</Text>
      <TextInput
        placeholder="e.g. 20 June 2026"
        style={styles.input}
        value={date}
        onChangeText={setDate}
      />

      {/* STEP 3 — TIME SLOT */}
      <Text style={styles.stepLabel}>Step 3: Select Time Slot</Text>
      <View style={styles.timeGrid}>
        {TIME_SLOTS.map(slot => (
          <TouchableOpacity
            key={slot}
            style={[
              styles.timeSlot,
              selectedTime === slot && styles.timeSlotSelected,
            ]}
            onPress={() => setSelectedTime(slot)}
          >
            <Text style={[
              styles.timeText,
              selectedTime === slot && styles.timeTextSelected,
            ]}>
              {slot}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* CONFIRM BUTTON */}
      <TouchableOpacity
        style={[styles.confirmBtn, booking && { opacity: 0.7 }]}
        onPress={handleBook}
        disabled={booking}
      >
        {booking
          ? <ActivityIndicator color="#fff" />
          : <Text style={styles.confirmText}>Confirm Appointment</Text>
        }
      </TouchableOpacity>

      <View style={{ height: 30 }} />

    </ScrollView>
  );
};

export default BookAppointmentScreen;

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#DCF0F5',
  },

  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#DCF0F5',
  },

  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1E3A8A',
    marginTop: 16,
    marginBottom: 20,
  },

  stepLabel: {
    fontWeight: 'bold',
    color: '#0D47A1',
    fontSize: 16,
    marginBottom: 10,
    marginTop: 10,
  },

  doctorCard: {
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 14,
    marginBottom: 10,
    borderWidth: 2,
    borderColor: 'transparent',
    elevation: 2,
  },

  doctorCardSelected: {
    borderColor: '#1E3A8A',
    backgroundColor: '#E3F2FD',
  },

  doctorName: {
    fontWeight: 'bold',
    fontSize: 16,
    color: '#0D47A1',
  },

  doctorInfo: { color: '#607D8B', marginTop: 2 },

  input: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#BBDEFB',
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
  },

  timeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 20,
  },

  timeSlot: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#BBDEFB',
    backgroundColor: '#fff',
    marginBottom: 8,
    marginRight: 8,
  },

  timeSlotSelected: {
    backgroundColor: '#1E3A8A',
    borderColor: '#1E3A8A',
  },

  timeText: { color: '#1E3A8A', fontSize: 13 },

  timeTextSelected: { color: '#fff' },

  confirmBtn: {
    backgroundColor: '#1E3A8A',
    padding: 16,
    borderRadius: 14,
    alignItems: 'center',
    marginTop: 10,
  },

  confirmText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },

  empty: { color: 'gray', fontStyle: 'italic', marginBottom: 10 },
});