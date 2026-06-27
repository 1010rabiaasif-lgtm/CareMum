import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Platform,
} from "react-native";
import { MaterialIcons as Icon } from "@expo/vector-icons";
import { db, auth } from '../Firebase/firebase.config';
import { doc, getDoc, collection, query, where, getCountFromServer } from 'firebase/firestore';

const PatientProfile = ({ navigation }) => {
  const [profile, setProfile]           = useState(null);
  const [loading, setLoading]           = useState(true);
  const [totalAppointments, setTotalAppointments] = useState(0);
  const [upcomingCount, setUpcomingCount]         = useState(0);

  // ---------- FETCH PROFILE ----------
  useEffect(() => {
    const fetchAll = async () => {
      try {
        const uid = auth.currentUser?.uid;
        if (!uid) return;

        // 1. Fetch patient profile
        const docSnap = await getDoc(doc(db, 'users', uid));
        if (docSnap.exists()) setProfile(docSnap.data());
        else Alert.alert('No profile found', 'Please complete your profile setup.');

        // 2. Total confirmed appointments
        const totalQ = query(
          collection(db, 'appointments'),
          where('patientId', '==', uid),
          where('status', '==', 'confirmed')
        );
        const totalSnap = await getCountFromServer(totalQ);
        setTotalAppointments(totalSnap.data().count);

        // 3. Upcoming (pending) appointments
        const upcomingQ = query(
          collection(db, 'appointments'),
          where('patientId', '==', uid),
          where('status', '==', 'pending')
        );
        const upcomingSnap = await getCountFromServer(upcomingQ);
        setUpcomingCount(upcomingSnap.data().count);

      } catch (error) {
        console.error('Error fetching profile:', error);
        Alert.alert('Error', 'Could not load profile data.');
      } finally {
        setLoading(false);
      }
    };

    fetchAll();
  }, []);

  // ---------- LOGOUT ----------
  const handleLogout = () => {
    const doLogout = () => {
      auth.signOut().then(() => {
        navigation.getParent()?.reset({
          index: 0,
          routes: [{ name: 'Login' }],
        });
      });
    };

    if (Platform.OS === 'web') {
      const confirmed = window.confirm('Are you sure you want to logout?');
      if (confirmed) doLogout();
    } else {
      Alert.alert(
        'Logout',
        'Are you sure you want to logout?',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Logout', style: 'destructive', onPress: doLogout },
        ]
      );
    }
  };

  // ---------- LOADING ----------
  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#1565C0" />
        <Text style={{ color: '#607D8B', marginTop: 10 }}>Loading profile…</Text>
      </View>
    );
  }

  // ---------- RENDER ----------
  return (
    <ScrollView style={styles.container}>

      {/* HEADER */}
      <View style={styles.header}>
        <Text style={styles.title}>Patient Profile</Text>
        <TouchableOpacity onPress={() => navigation.navigate('ProfileSetup', { role: 'patient' })}>
          <Icon name="edit" size={22} color="#1565C0" />
        </TouchableOpacity>
      </View>

      {/* PROFILE CARD */}
      <View style={styles.profileCard}>
        <View style={styles.avatar}>
          <Icon name="person" size={40} color="#fff" />
        </View>
        <Text style={styles.name}>{profile?.name || '—'}</Text>
        <Text style={styles.detail}>
          {profile?.age ? `${profile.age} Years` : '—'} • Pregnant Patient
        </Text>
      </View>

      {/* STATS */}
      <View style={styles.statsRow}>
        <StatBox value={String(totalAppointments)} label="Confirmed"  />
        <StatBox value={String(upcomingCount)}     label="Pending"    />
        <StatBox value={profile?.pregnancyWeek ? `Wk ${profile.pregnancyWeek}` : '—'} label="Preg. Week" />
      </View>

      {/* BASIC INFO */}
      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Basic Information</Text>
        <InfoRow icon="call"        label="Phone"   value={profile?.phone   || '—'} />
        <InfoRow icon="email"       label="Email"   value={profile?.email   || '—'} />
        <InfoRow icon="location-on" label="Address" value={profile?.address || '—'} />
        <InfoRow icon="cake"        label="Age"     value={profile?.age     || '—'} />
      </View>

      {/* HEALTH */}
      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Health Overview</Text>
        <View style={styles.healthBox}>
          <HealthItem
            label="Pregnancy Week"
            value={profile?.pregnancyWeek ? `${profile.pregnancyWeek} Weeks` : '—'}
          />
          <HealthItem
            label="Blood Group"
            value={profile?.bloodGroup || '—'}
          />
          <HealthItem
            label="BP Status"
            value="Normal"
          />
        </View>
      </View>

      {/* HISTORY */}
      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Recent History</Text>
        <HistoryItem date="—" note="No history yet" />
      </View>

      {/* EDIT BUTTON */}
      <TouchableOpacity
        style={styles.primaryBtn}
        onPress={() => navigation.navigate('ProfileSetup', { role: 'patient' })}
      >
        <Text style={styles.btnText}>Edit Profile</Text>
      </TouchableOpacity>

      {/* LOGOUT BUTTON */}
      <TouchableOpacity
        style={styles.outlineBtn}
        onPress={handleLogout}
      >
        <Text style={styles.outlineText}>Logout</Text>
      </TouchableOpacity>

    </ScrollView>
  );
};

/* ---------- COMPONENTS ---------- */

const InfoRow = ({ icon, label, value }) => (
  <View style={styles.row}>
    <Icon name={icon} size={20} color="#1565C0" />
    <Text style={styles.label}>{label}</Text>
    <Text style={styles.value}>{value}</Text>
  </View>
);

const StatBox = ({ value, label }) => (
  <View style={styles.statBox}>
    <Text style={styles.statNumber}>{value}</Text>
    <Text style={styles.statLabel}>{label}</Text>
  </View>
);

const HealthItem = ({ label, value }) => (
  <View style={styles.healthItem}>
    <Text style={styles.healthLabel}>{label}</Text>
    <Text style={styles.healthValue}>{value}</Text>
  </View>
);

const HistoryItem = ({ date, note }) => (
  <View style={styles.historyItem}>
    <Text style={styles.historyDate}>{date}</Text>
    <Text style={styles.historyNote}>{note}</Text>
  </View>
);

export default PatientProfile;

/* ---------- STYLES ---------- */

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F4F9FF',
  },

  container: {
    flex: 1,
    backgroundColor: "#F4F9FF",
    padding: 16,
  },

  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 15,
    marginBottom: 10,
  },

  title: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#0D47A1",
  },

  profileCard: {
    backgroundColor: "#E3F2FD",
    padding: 20,
    borderRadius: 18,
    alignItems: "center",
    marginBottom: 15,
  },

  avatar: {
    backgroundColor: "#1565C0",
    padding: 20,
    borderRadius: 50,
    marginBottom: 10,
  },

  name: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#0D47A1",
  },

  detail: { color: "#546E7A" },

  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 15,
  },

  statBox: {
    flex: 1,
    backgroundColor: '#fff',
    padding: 15,
    marginHorizontal: 5,
    borderRadius: 14,
    alignItems: 'center',
    elevation: 2,
  },

  statNumber: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1565C0',
  },

  statLabel: { color: '#607D8B', marginTop: 5, fontSize: 11, textAlign: 'center' },

  card: {
    backgroundColor: "#fff",
    padding: 15,
    borderRadius: 16,
    marginBottom: 15,
    elevation: 2,
  },

  sectionTitle: {
    fontWeight: "bold",
    color: "#0D47A1",
    marginBottom: 10,
  },

  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 8,
  },

  label: {
    flex: 1,
    marginLeft: 10,
    color: "#607D8B",
  },

  value: {
    fontWeight: "bold",
    color: "#1565C0",
    flexShrink: 1,
    textAlign: 'right',
    maxWidth: '50%',
  },

  healthBox: {
    flexDirection: "row",
    justifyContent: "space-between",
  },

  healthItem: {
    alignItems: "center",
    flex: 1,
  },

  healthLabel: {
    color: "#607D8B",
    fontSize: 12,
    textAlign: 'center',
  },

  healthValue: {
    fontWeight: "bold",
    color: "#0D47A1",
    marginTop: 5,
    textAlign: 'center',
  },

  historyItem: { marginBottom: 10 },

  historyDate: {
    fontWeight: "bold",
    color: "#1565C0",
  },

  historyNote: { color: "#607D8B" },

  primaryBtn: {
    backgroundColor: "#1565C0",
    padding: 14,
    borderRadius: 12,
    alignItems: "center",
    marginBottom: 10,
  },

  outlineBtn: {
    borderWidth: 1,
    borderColor: "#1565C0",
    padding: 14,
    borderRadius: 12,
    alignItems: "center",
    marginBottom: 20,
  },

  btnText: { color: "#fff", fontWeight: "bold" },

  outlineText: { color: "#1565C0", fontWeight: "bold" },
});