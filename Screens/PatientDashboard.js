import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native";
import { MaterialIcons as Icon } from '@expo/vector-icons';
import { db, auth } from '../Firebase/firebase.config';
import { doc, getDoc, collection, query, where, orderBy, limit, getDocs } from 'firebase/firestore';

// ---------- BABY SIZE BY WEEK ----------
const getBabyInfo = (week) => {
  const w = parseInt(week);
  if (!w || isNaN(w)) return { size: '—', emoji: '🤰', tip: 'Track your pregnancy week.' };
  if (w <= 4)  return { size: 'Poppy seed',   emoji: '🌱', tip: 'Your pregnancy journey begins!' };
  if (w <= 8)  return { size: 'Raspberry',    emoji: '🫐', tip: 'Baby\'s heart is forming.' };
  if (w <= 12) return { size: 'Lime',         emoji: '🍋', tip: 'First trimester almost done!' };
  if (w <= 16) return { size: 'Avocado',      emoji: '🥑', tip: 'Baby can make facial expressions.' };
  if (w <= 20) return { size: 'Banana',       emoji: '🍌', tip: 'You may feel baby\'s movements!' };
  if (w <= 24) return { size: 'Corn',         emoji: '🌽', tip: 'Baby can hear your voice now.' };
  if (w <= 28) return { size: 'Eggplant',     emoji: '🍆', tip: 'Baby opens eyes for the first time!' };
  if (w <= 32) return { size: 'Squash',       emoji: '🎃', tip: 'Baby is gaining weight rapidly.' };
  if (w <= 36) return { size: 'Honeydew',     emoji: '🍈', tip: 'Baby is almost ready!' };
  if (w <= 40) return { size: 'Watermelon',   emoji: '🍉', tip: 'Baby is fully developed. Almost there!' };
  return              { size: 'Watermelon',   emoji: '🍉', tip: 'Past due date — stay in touch with your doctor!' };
};

const PatientDashboard = ({ navigation }) => {
  const [profile, setProfile]           = useState(null);
  const [nextAppointment, setNextAppointment] = useState(null);
  const [loading, setLoading]           = useState(true);

  useEffect(() => {
    const fetchAll = async () => {
      try {
        const uid = auth.currentUser?.uid;
        if (!uid) return;

        // 1. Fetch patient profile
        const docSnap = await getDoc(doc(db, 'users', uid));
        if (docSnap.exists()) setProfile(docSnap.data());

        // 2. Fetch next upcoming appointment (confirmed or pending)
        const apptQ = query(
          collection(db, 'appointments'),
          where('patientId', '==', uid),
          where('status', 'in', ['confirmed', 'pending']),
          orderBy('createdAt', 'desc'),
          limit(1)
        );
        const apptSnap = await getDocs(apptQ);
        if (!apptSnap.empty) {
          setNextAppointment({ id: apptSnap.docs[0].id, ...apptSnap.docs[0].data() });
        }

      } catch (e) {
        console.error('Dashboard fetch error:', e);
      } finally {
        setLoading(false);
      }
    };

    fetchAll();
  }, []);

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#1E3A8A" />
      </View>
    );
  }

  const babyInfo = getBabyInfo(profile?.pregnancyWeek);
  const week     = profile?.pregnancyWeek || '—';

  return (
    <ScrollView style={styles.container}>

      {/* GREETING */}
      <Text style={styles.title}>
        Welcome, {profile?.name || 'Patient'} 👋
      </Text>
      <Text style={styles.subtitle}>Take care of yourself and your baby</Text>

      {/* PREGNANCY CARD */}
      <View style={styles.cardPrimary}>
        <View style={styles.pregnancyRow}>
          <View style={{ flex: 1 }}>
            <Text style={styles.weekLabel}>🤰 Week {week}</Text>
            <Text style={styles.babySize}>
              Baby size: {babyInfo.emoji} {babyInfo.size}
            </Text>
            <Text style={styles.babyTip}>{babyInfo.tip}</Text>
          </View>
          <View style={styles.weekCircle}>
            <Text style={styles.weekNumber}>{week}</Text>
            <Text style={styles.weekText}>weeks</Text>
          </View>
        </View>
      </View>

      {/* HEALTH SUMMARY */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>📊 Health Summary</Text>
        <View style={styles.healthRow}>
          <HealthItem icon="favorite"       label="Blood Group" value={profile?.bloodGroup    || '—'} />
          <HealthItem icon="pregnant-woman" label="Preg. Week"  value={week ? `Wk ${week}`   : '—'} />
          <HealthItem icon="monitor-heart"  label="BP Status"   value="Normal" />
        </View>
      </View>

      {/* NEXT APPOINTMENT */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>📅 Next Appointment</Text>
        {nextAppointment
          ? (
            <View style={styles.apptBox}>
              <Icon name="local-hospital" size={36} color="#1E3A8A" style={{ marginRight: 12 }} />
              <View>
                <Text style={styles.apptDoctor}>Dr. {nextAppointment.doctorName}</Text>
                <Text style={styles.apptInfo}>{nextAppointment.date} • {nextAppointment.time}</Text>
                <Text style={[
                  styles.apptStatus,
                  { color: nextAppointment.status === 'confirmed' ? '#4CAF50' : '#FF9800' }
                ]}>
                  {nextAppointment.status.charAt(0).toUpperCase() + nextAppointment.status.slice(1)}
                </Text>
              </View>
            </View>
          )
          : (
            <TouchableOpacity
              style={styles.bookNowBtn}
              onPress={() => navigation.navigate('Appointments')}
            >
              <Icon name="add" size={18} color="#fff" />
              <Text style={styles.bookNowText}>Book an Appointment</Text>
            </TouchableOpacity>
          )
        }
      </View>

      {/* QUICK ACTIONS */}
      <Text style={styles.sectionTitle}>Quick Actions</Text>
      <View style={styles.grid}>
        <QuickAction icon="event"           label="Appointments" onPress={() => navigation.navigate('Appointments')} />
        <QuickAction icon="chat"            label="Chat"         onPress={() => navigation.navigate('Chat')} />
        <QuickAction icon="favorite"        label="Health"       onPress={() => navigation.navigate('Health')} />
        <QuickAction icon="person"          label="Profile"      onPress={() => navigation.navigate('Profile')} />
      </View>

      {/* TIPS CARD */}
      <View style={[styles.card, { backgroundColor: '#E8F5E9' }]}>
        <Text style={styles.cardTitle}>💡 Tip of the Day</Text>
        <Text style={styles.tipText}>
          Stay hydrated! Drink at least 8-10 glasses of water daily during pregnancy. It helps with nutrient absorption and reduces swelling.
        </Text>
      </View>

      <View style={{ height: 20 }} />

    </ScrollView>
  );
};

/* ── SUB COMPONENTS ── */

const HealthItem = ({ icon, label, value }) => (
  <View style={styles.healthItem}>
    <Icon name={icon} size={22} color="#1E3A8A" />
    <Text style={styles.healthValue}>{value}</Text>
    <Text style={styles.healthLabel}>{label}</Text>
  </View>
);

const QuickAction = ({ icon, label, onPress }) => (
  <TouchableOpacity style={styles.quickCard} onPress={onPress}>
    <Icon name={icon} size={24} color="#1E3A8A" />
    <Text style={styles.quickLabel}>{label}</Text>
  </TouchableOpacity>
);

export default PatientDashboard;

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
    marginTop: 16,
  },

  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#1E3A8A",
  },

  subtitle: {
    color: "gray",
    marginBottom: 15,
  },

  // PREGNANCY CARD
  cardPrimary: {
    backgroundColor: "#90bdf8",
    padding: 15,
    borderRadius: 15,
    marginBottom: 15,
  },

  pregnancyRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  weekLabel: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#0D47A1',
  },

  babySize: {
    fontSize: 14,
    color: '#1E3A8A',
    marginTop: 4,
  },

  babyTip: {
    fontSize: 12,
    color: '#37474F',
    marginTop: 4,
    fontStyle: 'italic',
  },

  weekCircle: {
    backgroundColor: '#1E3A8A',
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 10,
  },

  weekNumber: {
    color: '#fff',
    fontSize: 22,
    fontWeight: 'bold',
  },

  weekText: {
    color: '#90CAF9',
    fontSize: 10,
  },

  // CARD
  card: {
    backgroundColor: "#fff",
    padding: 15,
    borderRadius: 15,
    marginBottom: 15,
    elevation: 2,
  },

  cardTitle: {
    fontWeight: "bold",
    marginBottom: 10,
    fontSize: 15,
    color: '#1E2A38',
  },

  // HEALTH ROW
  healthRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },

  healthItem: {
    flex: 1,
    alignItems: 'center',
  },

  healthValue: {
    fontWeight: 'bold',
    color: '#0D47A1',
    marginTop: 4,
  },

  healthLabel: {
    color: '#607D8B',
    fontSize: 11,
    marginTop: 2,
    textAlign: 'center',
  },

  // APPOINTMENT
  apptBox: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  apptDoctor: {
    fontWeight: 'bold',
    color: '#0D47A1',
    fontSize: 15,
  },

  apptInfo: { color: '#607D8B', marginTop: 2 },

  apptStatus: { fontWeight: 'bold', marginTop: 2 },

  bookNowBtn: {
    backgroundColor: '#1E3A8A',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    borderRadius: 10,
    gap: 6,
  },

  bookNowText: { color: '#fff', fontWeight: 'bold' },

  // QUICK ACTIONS
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1E3A8A',
    marginBottom: 10,
  },

  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 15,
  },

  quickCard: {
    width: '48%',
    backgroundColor: '#fff',
    padding: 18,
    borderRadius: 14,
    alignItems: 'center',
    marginBottom: 10,
    elevation: 2,
  },

  quickLabel: {
    marginTop: 6,
    color: '#0D47A1',
    fontWeight: '600',
  },

  // TIP
  tipText: {
    color: '#37474F',
    lineHeight: 20,
  },
});