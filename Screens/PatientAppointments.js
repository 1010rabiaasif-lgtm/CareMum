import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native";
import { db, auth } from '../Firebase/firebase.config';
import { collection, query, where, onSnapshot, orderBy } from 'firebase/firestore';

const PatientAppointments = ({ navigation }) => {
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading]           = useState(true);

  useEffect(() => {
    const uid = auth.currentUser?.uid;
    if (!uid) return;

    // Real-time listener — updates instantly when doctor confirms/rejects
    const q = query(
      collection(db, 'appointments'),
      where('patientId', '==', uid),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setAppointments(data);
      setLoading(false);
    });

    return () => unsubscribe(); // cleanup on unmount
  }, []);

  const upcoming = appointments.filter(a => a.status !== 'completed');
  const past     = appointments.filter(a => a.status === 'completed');

  const statusColor = (status) => {
    if (status === 'confirmed') return '#4CAF50';
    if (status === 'rejected')  return '#F44336';
    return '#FF9800'; // pending
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#1E3A8A" />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>

      <Text style={styles.title}>My Appointments</Text>
      <Text style={styles.subtitle}>Manage your doctor visits</Text>

      {/* BOOK BUTTON */}
      <TouchableOpacity
        style={styles.bookBtn}
        onPress={() => navigation.navigate('BookAppointment')}
      >
        <Text style={styles.bookText}>+ Book New Appointment</Text>
      </TouchableOpacity>

      {/* UPCOMING */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>📅 Upcoming</Text>

        {upcoming.length === 0
          ? <Text style={styles.empty}>No upcoming appointments</Text>
          : upcoming.map(a => (
            <View key={a.id} style={styles.item}>
              <Text style={styles.doctor}>Dr. {a.doctorName}</Text>
              <Text style={styles.info}>{a.date} • {a.time}</Text>
              <Text style={[styles.status, { color: statusColor(a.status) }]}>
                {a.status.charAt(0).toUpperCase() + a.status.slice(1)}
              </Text>
            </View>
          ))
        }
      </View>

      {/* PAST */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>🕒 Past Visits</Text>

        {past.length === 0
          ? <Text style={styles.empty}>No past visits yet</Text>
          : past.map(a => (
            <View key={a.id} style={styles.item}>
              <Text style={styles.doctor}>Dr. {a.doctorName}</Text>
              <Text style={styles.info}>{a.date} • Completed</Text>
            </View>
          ))
        }
      </View>

    </ScrollView>
  );
};

export default PatientAppointments;

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#DCF0F5',
  },

  container: {
    flex: 1,
    padding: 15,
    backgroundColor: '#DCF0F5',
  },

  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#1E3A8A",
    marginTop: 16,
  },

  subtitle: { color: "gray", marginBottom: 15 },

  bookBtn: {
    backgroundColor: "#1E3A8A",
    padding: 15,
    borderRadius: 12,
    alignItems: "center",
    marginBottom: 15,
  },

  bookText: { color: "#fff", fontWeight: "bold" },

  card: {
    backgroundColor: "#fff",
    padding: 15,
    borderRadius: 15,
    marginBottom: 15,
    elevation: 2,
  },

  cardTitle: { fontWeight: "bold", marginBottom: 10 },

  item: {
    paddingVertical: 10,
    borderBottomWidth: 0.5,
    borderColor: "#eee",
  },

  doctor: { fontWeight: "bold", fontSize: 16 },
  info:   { color: "gray" },

  status: { fontWeight: "bold" },

  empty: { color: "gray", fontStyle: "italic" },
});