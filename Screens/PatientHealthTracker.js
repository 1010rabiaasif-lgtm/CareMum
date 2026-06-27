import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Alert,
  Modal,
  Platform,
} from "react-native";
import { db, auth } from '../Firebase/firebase.config';
import {
  doc,
  getDoc,
  collection,
  query,
  where,
  onSnapshot,
  addDoc,
  serverTimestamp,
} from 'firebase/firestore';

// Baby info by week
const getBabyInfo = (week) => {
  const w = parseInt(week);
  if (!w || isNaN(w)) return { size: '—', emoji: '🤰', tip: 'Track your pregnancy week.' };
  if (w <= 8)  return { size: 'Raspberry',  emoji: '🫐', tip: 'Baby\'s heart is forming.' };
  if (w <= 12) return { size: 'Lime',       emoji: '🍋', tip: 'First trimester almost done!' };
  if (w <= 16) return { size: 'Avocado',    emoji: '🥑', tip: 'Baby can make facial expressions.' };
  if (w <= 20) return { size: 'Banana',     emoji: '🍌', tip: 'You may feel baby\'s movements!' };
  if (w <= 24) return { size: 'Corn',       emoji: '🌽', tip: 'Baby can hear your voice now.' };
  if (w <= 28) return { size: 'Eggplant',   emoji: '🍆', tip: 'Baby opens eyes for the first time!' };
  if (w <= 32) return { size: 'Squash',     emoji: '🎃', tip: 'Baby is gaining weight rapidly.' };
  if (w <= 36) return { size: 'Honeydew',   emoji: '🍈', tip: 'Baby is almost ready!' };
  return              { size: 'Watermelon', emoji: '🍉', tip: 'Baby is fully developed. Almost there!' };
};

const PatientHealthTracker = () => {
  const [profile, setProfile]       = useState(null);
  const [records, setRecords]       = useState([]);
  const [loading, setLoading]       = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [saving, setSaving]         = useState(false);

  // Form fields
  const [weight, setWeight]         = useState('');
  const [bp, setBp]                 = useState('');
  const [symptoms, setSymptoms]     = useState('');

  // ---------- FETCH PROFILE ----------
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const uid = auth.currentUser?.uid;
        if (!uid) return;
        const snap = await getDoc(doc(db, 'users', uid));
        if (snap.exists()) setProfile(snap.data());
      } catch (e) {
        console.error(e);
      }
    };
    fetchProfile();
  }, []);

  // ---------- FETCH HEALTH RECORDS (real-time) ----------
  useEffect(() => {
    const uid = auth.currentUser?.uid;
    if (!uid) return;

    const q = query(
  collection(db, 'healthRecords'),
  where('patientId', '==', uid)
);

    const unsubscribe = onSnapshot(q, (snap) => {
      const data = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      setRecords(data);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // ---------- SAVE RECORD ----------
  const handleSave = async () => {
    if (!weight.trim() && !bp.trim() && !symptoms.trim()) {
      Alert.alert('Empty Record', 'Please enter at least one health value.');
      return;
    }

    setSaving(true);
    try {
      const uid = auth.currentUser?.uid;
      await addDoc(collection(db, 'healthRecords'), {
        patientId: uid,
        weight:    weight.trim(),
        bp:        bp.trim(),
        symptoms:  symptoms.trim(),
        date:      new Date().toLocaleDateString('en-GB', {
          day: 'numeric', month: 'short', year: 'numeric'
        }),
        createdAt: serverTimestamp(),
      });

      // Reset form
      setWeight('');
      setBp('');
      setSymptoms('');
      setModalVisible(false);
      Alert.alert('Saved ✅', 'Your health record has been saved.');

    } catch (e) {
      console.error(e);
      Alert.alert('Error', 'Could not save record. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const todayRecord = records[0]; // most recent record
  const babyInfo    = getBabyInfo(profile?.pregnancyWeek);

  return (
    <ScrollView style={styles.container}>

      {/* HEADER */}
      <Text style={styles.title}>My Health</Text>
      <Text style={styles.subtitle}>Track your pregnancy journey</Text>

      {/* PREGNANCY STATUS */}
      <View style={styles.cardPrimary}>
        <Text style={styles.cardTitle}>🤰 Pregnancy Status</Text>
        <View style={styles.pregnancyRow}>
          <View style={{ flex: 1 }}>
            <Text style={styles.week}>Week {profile?.pregnancyWeek || '—'}</Text>
            <Text style={styles.babySize}>{babyInfo.emoji} Size of a {babyInfo.size}</Text>
            <Text style={styles.tip}>{babyInfo.tip}</Text>
          </View>
          <View style={styles.weekCircle}>
            <Text style={styles.weekNum}>{profile?.pregnancyWeek || '—'}</Text>
            <Text style={styles.weekLabel}>weeks</Text>
          </View>
        </View>
      </View>

      {/* ADD RECORD BUTTON */}
      <TouchableOpacity
        style={styles.addBtn}
        onPress={() => setModalVisible(true)}
      >
        <Text style={styles.addText}>+ Add Today's Record</Text>
      </TouchableOpacity>

      {/* TODAY'S HEALTH — most recent record */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>📊 Latest Record</Text>

        {loading
          ? <ActivityIndicator color="#1565C0" />
          : todayRecord
            ? (
              <>
                <Text style={styles.recordDate}>{todayRecord.date}</Text>
                <HealthRow label="Weight"         value={todayRecord.weight   ? `${todayRecord.weight} kg` : '—'} />
                <HealthRow label="Blood Pressure" value={todayRecord.bp       || '—'} />
                <HealthRow label="Symptoms"       value={todayRecord.symptoms || '—'} />
              </>
            )
            : <Text style={styles.empty}>No records yet. Add your first record!</Text>
        }
      </View>

      {/* HISTORY */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>🕒 History</Text>

        {records.length === 0
          ? <Text style={styles.empty}>No history yet</Text>
          : records.map(r => (
            <View key={r.id} style={styles.historyItem}>
              <Text style={styles.date}>{r.date}</Text>
              {r.weight   && <Text style={styles.historyText}>⚖️ Weight: {r.weight} kg</Text>}
              {r.bp       && <Text style={styles.historyText}>❤️ BP: {r.bp}</Text>}
              {r.symptoms && <Text style={styles.historyText}>🩺 Symptoms: {r.symptoms}</Text>}
            </View>
          ))
        }
      </View>

      {/* ADD RECORD MODAL */}
      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>

            <Text style={styles.modalTitle}>Add Today's Record</Text>
            <Text style={styles.modalSubtitle}>{new Date().toDateString()}</Text>

            <Text style={styles.inputLabel}>⚖️ Weight (kg)</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. 65"
              keyboardType="numeric"
              value={weight}
              onChangeText={setWeight}
            />

            <Text style={styles.inputLabel}>❤️ Blood Pressure</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. 120/80"
              value={bp}
              onChangeText={setBp}
            />

            <Text style={styles.inputLabel}>🩺 Symptoms</Text>
            <TextInput
              style={[styles.input, { height: 80 }]}
              placeholder="e.g. Mild headache, fatigue"
              value={symptoms}
              onChangeText={setSymptoms}
              multiline
            />

            <TouchableOpacity
              style={[styles.saveBtn, saving && { opacity: 0.7 }]}
              onPress={handleSave}
              disabled={saving}
            >
              {saving
                ? <ActivityIndicator color="#fff" />
                : <Text style={styles.saveBtnText}>Save Record</Text>
              }
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.cancelBtn}
              onPress={() => setModalVisible(false)}
            >
              <Text style={styles.cancelText}>Cancel</Text>
            </TouchableOpacity>

          </View>
        </View>
      </Modal>

      <View style={{ height: 20 }} />
    </ScrollView>
  );
};

const HealthRow = ({ label, value }) => (
  <View style={styles.row}>
    <Text style={styles.rowLabel}>{label}</Text>
    <Text style={styles.value}>{value}</Text>
  </View>
);

export default PatientHealthTracker;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#DCF0F5',
    padding: 15,
  },

  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#0D47A1",
    marginTop: 10,
  },

  subtitle: { color: "#607D8B", marginBottom: 15 },

  cardPrimary: {
    backgroundColor: "#BBDEFB",
    padding: 15,
    borderRadius: 15,
    marginBottom: 15,
  },

  cardTitle: {
    fontWeight: "bold",
    marginBottom: 8,
    color: "#0D47A1",
    fontSize: 15,
  },

  pregnancyRow: { flexDirection: 'row', alignItems: 'center' },

  week: { fontSize: 22, fontWeight: "bold", color: "#1565C0" },

  babySize: { color: '#1E3A8A', marginTop: 3, fontSize: 13 },

  tip: { color: "#1976D2", fontStyle: 'italic', marginTop: 3, fontSize: 12 },

  weekCircle: {
    backgroundColor: '#1565C0',
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 10,
  },

  weekNum:   { color: '#fff', fontSize: 22, fontWeight: 'bold' },
  weekLabel: { color: '#90CAF9', fontSize: 10 },

  addBtn: {
    backgroundColor: "#1976D2",
    padding: 15,
    borderRadius: 12,
    alignItems: "center",
    marginBottom: 15,
  },

  addText: { color: "#fff", fontWeight: "bold" },

  card: {
    backgroundColor: "#fff",
    padding: 15,
    borderRadius: 15,
    marginBottom: 15,
    elevation: 2,
  },

  recordDate: { color: '#607D8B', fontSize: 12, marginBottom: 8 },

  row: { flexDirection: "row", justifyContent: "space-between", marginVertical: 5 },

  rowLabel: { color: '#555' },

  value: { fontWeight: "bold", color: "#1565C0" },

  historyItem: {
    paddingVertical: 10,
    borderBottomWidth: 0.5,
    borderColor: "#E3F2FD",
  },

  date: { fontWeight: "bold", color: "#0D47A1", marginBottom: 3 },

  historyText: { color: '#607D8B', fontSize: 13 },

  empty: { color: 'gray', fontStyle: 'italic' },

  // MODAL
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },

  modalCard: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 20,
    width: '90%',
  },

  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#0D47A1',
    textAlign: 'center',
  },

  modalSubtitle: {
    color: '#607D8B',
    textAlign: 'center',
    marginBottom: 15,
    fontSize: 13,
  },

  inputLabel: {
    color: '#0D47A1',
    fontWeight: '600',
    marginBottom: 5,
  },

  input: {
    borderWidth: 1,
    borderColor: '#BBDEFB',
    borderRadius: 10,
    padding: 12,
    marginBottom: 12,
    backgroundColor: '#F4F9FF',
  },

  saveBtn: {
    backgroundColor: '#1565C0',
    padding: 14,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 5,
  },

  saveBtnText: { color: '#fff', fontWeight: 'bold' },

  cancelBtn: {
    padding: 12,
    alignItems: 'center',
    marginTop: 8,
  },

  cancelText: { color: '#607D8B' },
});