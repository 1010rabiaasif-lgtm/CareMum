import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Platform,
} from 'react-native';
import { MaterialIcons as Icon } from '@expo/vector-icons';
import { db, auth } from '../Firebase/firebase.config';
import { doc, getDoc, collection, query, where, getCountFromServer } from 'firebase/firestore';

const Profile = ({ navigation }) => {
  const [profile, setProfile]             = useState(null);
  const [loading, setLoading]             = useState(true);
  const [totalPatients, setTotalPatients] = useState(0);
  const [todayCount, setTodayCount]       = useState(0);

  useEffect(() => {
    const fetchAll = async () => {
      try {
        const uid = auth.currentUser?.uid;
        if (!uid) return;

        const docSnap = await getDoc(doc(db, 'users', uid));
        if (docSnap.exists()) setProfile(docSnap.data());
        else Alert.alert('No profile found', 'Please complete your profile setup.');

        const totalQ = query(
          collection(db, 'appointments'),
          where('doctorId', '==', uid),
          where('status', '==', 'confirmed')
        );
        const totalSnap = await getCountFromServer(totalQ);
        setTotalPatients(totalSnap.data().count);

        const today    = new Date();
        const todayStr = today.toLocaleDateString('en-GB', {
          day: 'numeric', month: 'long', year: 'numeric'
        });

        const todayQ = query(
          collection(db, 'appointments'),
          where('doctorId', '==', uid),
          where('status', '==', 'confirmed'),
          where('date', '==', todayStr)
        );
        const todaySnap = await getCountFromServer(todayQ);
        setTodayCount(todaySnap.data().count);

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

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#1565C0" />
        <Text style={{ color: '#607D8B', marginTop: 10 }}>Loading profile…</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>

      {/* HEADER */}
      <View style={styles.header}>
        <Text style={styles.title}>Doctor Profile</Text>
        <TouchableOpacity onPress={() => navigation.navigate('ProfileSetup', { role: 'doctor' })}>
          <Icon name="edit" size={22} color="#1565C0" />
        </TouchableOpacity>
      </View>

      {/* PROFILE CARD */}
      <View style={styles.profileCard}>
        <View style={styles.avatar}>
          <Icon name="local-hospital" size={40} color="#fff" />
        </View>
        <Text style={styles.name}>{profile?.name || '—'}</Text>
        <Text style={styles.detail}>
          {[profile?.specialization, profile?.education].filter(Boolean).join(' • ') || '—'}
        </Text>
      </View>

      {/* STATS */}
      <View style={styles.statsRow}>
        <StatBox value={String(totalPatients)}      label="Patients"   />
        <StatBox value={String(todayCount)}         label="Today"      />
        <StatBox value={profile?.experience || '—'} label="Experience" />
      </View>

      {/* PROFESSIONAL INFO */}
      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Professional Information</Text>
        <InfoRow icon="medical-services" label="Specialization" value={profile?.specialization || '—'} />
        <InfoRow icon="school"           label="Education"      value={profile?.education      || '—'} />
        <InfoRow icon="local-hospital"   label="Hospital"       value={profile?.hospital       || '—'} />
        <InfoRow icon="work"             label="Experience"     value={profile?.experience     || '—'} />
      </View>

      {/* CONTACT */}
      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Contact Details</Text>
        <InfoRow icon="call"        label="Phone"   value={profile?.phone   || '—'} />
        <InfoRow icon="email"       label="Email"   value={profile?.email   || '—'} />
        <InfoRow icon="location-on" label="Address" value={profile?.address || '—'} />
        <InfoRow icon="cake"        label="Age"     value={profile?.age     || '—'} />
      </View>

      {/* EDIT BUTTON */}
      <TouchableOpacity
        style={styles.editButton}
        onPress={() => navigation.navigate('ProfileSetup', { role: 'doctor' })}
      >
        <Text style={styles.editText}>Edit Profile</Text>
      </TouchableOpacity>

      {/* LOGOUT BUTTON */}
      <TouchableOpacity
        style={styles.logoutButton}
        onPress={handleLogout}
      >
        <Text style={styles.logoutText}>Logout</Text>
      </TouchableOpacity>

    </ScrollView>
  );
};

const StatBox = ({ value, label }) => (
  <View style={styles.statBox}>
    <Text style={styles.statNumber}>{value}</Text>
    <Text style={styles.statLabel}>{label}</Text>
  </View>
);

const InfoRow = ({ icon, label, value }) => (
  <View style={styles.row}>
    <Icon name={icon} size={20} color="#1565C0" />
    <Text style={styles.label}>{label}</Text>
    <Text style={styles.value}>{value}</Text>
  </View>
);

export default Profile;

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F4F9FF',
  },

  container: {
    flex: 1,
    backgroundColor: '#F4F9FF',
    padding: 16,
  },

  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 15,
    marginBottom: 10,
  },

  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#0D47A1',
  },

  profileCard: {
    backgroundColor: '#E3F2FD',
    padding: 20,
    borderRadius: 18,
    alignItems: 'center',
    marginBottom: 15,
  },

  avatar: {
    backgroundColor: '#1565C0',
    padding: 20,
    borderRadius: 50,
    marginBottom: 10,
  },

  name: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#0D47A1',
  },

  detail: { color: '#546E7A' },

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

  statLabel: { color: '#607D8B', marginTop: 5 },

  card: {
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 16,
    marginBottom: 15,
    elevation: 2,
  },

  sectionTitle: {
    fontWeight: 'bold',
    color: '#0D47A1',
    marginBottom: 10,
  },

  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
  },

  label: {
    flex: 1,
    marginLeft: 10,
    color: '#607D8B',
  },

  value: {
    fontWeight: 'bold',
    color: '#1565C0',
    flexShrink: 1,
    textAlign: 'right',
    maxWidth: '50%',
  },

  editButton: {
    backgroundColor: '#1565C0',
    padding: 14,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 10,
  },

  editText: { color: '#fff', fontWeight: 'bold' },

  logoutButton: {
    backgroundColor: '#E3F2FD',
    borderWidth: 1,
    borderColor: '#1565C0',
    padding: 14,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 20,
  },

  logoutText: { color: '#1565C0', fontWeight: 'bold' },
});