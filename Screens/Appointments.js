import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ImageBackground,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from "react-native";
import { MaterialIcons as Icon } from '@expo/vector-icons';
import { db, auth } from '../Firebase/firebase.config';
import {
  collection,
  query,
  where,
  onSnapshot,
  orderBy,
  doc,
  updateDoc,
  getDoc,
} from 'firebase/firestore';

const Appointments = () => {
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading]           = useState(true);
  const [expandedId, setExpandedId]     = useState(null); // which card is expanded
  const [patientDetails, setPatientDetails] = useState({}); // cache patient data

  useEffect(() => {
    const uid = auth.currentUser?.uid;
    if (!uid) return;

    const q = query(
      collection(db, 'appointments'),
      where('doctorId', '==', uid),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
      setAppointments(data);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // ---------- FETCH PATIENT DETAILS ----------
  const fetchPatientDetails = async (patientId) => {
    // Use cache if already fetched
    if (patientDetails[patientId]) return;

    try {
      const docSnap = await getDoc(doc(db, 'users', patientId));
      if (docSnap.exists()) {
        setPatientDetails(prev => ({
          ...prev,
          [patientId]: docSnap.data(),
        }));
      }
    } catch (error) {
      console.error('Error fetching patient details:', error);
    }
  };

  // ---------- EXPAND / COLLAPSE ----------
  const toggleExpand = (appointment) => {
    if (expandedId === appointment.id) {
      setExpandedId(null); // collapse
    } else {
      setExpandedId(appointment.id); // expand
      fetchPatientDetails(appointment.patientId); // load patient data
    }
  };

  // ---------- CONFIRM ----------
  const handleConfirm = async (appointmentId, patientName) => {
    try {
      await updateDoc(doc(db, 'appointments', appointmentId), { status: 'confirmed' });
      Alert.alert('Confirmed ✅', `Appointment with ${patientName} confirmed.`);
    } catch (error) {
      Alert.alert('Error', 'Could not confirm appointment.');
    }
  };

  // ---------- REJECT ----------
  const handleReject = (appointmentId, patientName) => {
    Alert.alert(
      'Reject Appointment',
      `Reject ${patientName}'s appointment?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reject',
          style: 'destructive',
          onPress: async () => {
            try {
              await updateDoc(doc(db, 'appointments', appointmentId), { status: 'rejected' });
            } catch (error) {
              Alert.alert('Error', 'Could not reject appointment.');
            }
          },
        },
      ]
    );
  };

  const statusColor = (status) => {
    if (status === 'confirmed') return '#4CAF50';
    if (status === 'rejected')  return '#F44336';
    return '#FF9800';
  };

  const pending   = appointments.filter(a => a.status === 'pending');
  const confirmed = appointments.filter(a => a.status === 'confirmed');
  const rejected  = appointments.filter(a => a.status === 'rejected');

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#1E3A8A" />
        <Text style={{ color: '#607D8B', marginTop: 10 }}>Loading appointments…</Text>
      </View>
    );
  }

  const AppointmentCard = ({ a }) => {
    const isExpanded = expandedId === a.id;
    const patient    = patientDetails[a.patientId];

    return (
      <View style={[
        styles.card,
        a.status === 'confirmed' && styles.confirmedCard,
        a.status === 'rejected'  && styles.rejectedCard,
      ]}>

        {/* ── HEADER ROW (always visible) ── */}
        <TouchableOpacity
          style={styles.cardHeader}
          onPress={() => toggleExpand(a)}
          activeOpacity={0.7}
        >
          <View style={styles.avatarSmall}>
            <Icon name="person" size={20} color="#fff" />
          </View>

          <View style={{ flex: 1 }}>
            <Text style={styles.name}>{a.patientName}</Text>
            <Text style={styles.info}>📅 {a.date}  🕐 {a.time}</Text>
          </View>

          <View style={styles.rightCol}>
            <Text style={[styles.statusBadge, { backgroundColor: statusColor(a.status) }]}>
              {a.status.charAt(0).toUpperCase() + a.status.slice(1)}
            </Text>
            <Icon
              name={isExpanded ? 'keyboard-arrow-up' : 'keyboard-arrow-down'}
              size={22}
              color="#1565C0"
            />
          </View>
        </TouchableOpacity>

        {/* ── EXPANDED PATIENT DETAILS ── */}
        {isExpanded && (
          <View style={styles.detailBox}>

            {!patient
              ? <ActivityIndicator size="small" color="#1565C0" />
              : (
                <>
                  <Text style={styles.detailTitle}>Patient Details</Text>

                  <DetailRow icon="person"      label="Full Name"       value={patient.name          || '—'} />
                  <DetailRow icon="cake"        label="Age"             value={patient.age           || '—'} />
                  <DetailRow icon="call"        label="Phone"           value={patient.phone         || '—'} />
                  <DetailRow icon="email"       label="Email"           value={patient.email         || '—'} />
                  <DetailRow icon="location-on" label="Address"         value={patient.address       || '—'} />
                  <DetailRow icon="favorite"    label="Blood Group"     value={patient.bloodGroup    || '—'} />
                  <DetailRow icon="pregnant-woman" label="Pregnancy Week" value={patient.pregnancyWeek ? `${patient.pregnancyWeek} Weeks` : '—'} />
                </>
              )
            }

            {/* ACTION BUTTONS — only for pending */}
            {a.status === 'pending' && (
              <View style={styles.btnRow}>
                <TouchableOpacity
                  style={styles.confirmBtn}
                  onPress={() => handleConfirm(a.id, a.patientName)}
                >
                  <Text style={styles.confirmText}>✓ Confirm</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.rejectBtn}
                  onPress={() => handleReject(a.id, a.patientName)}
                >
                  <Text style={styles.rejectText}>✕ Reject</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        )}

      </View>
    );
  };

  return (
    <ImageBackground
      source={require('../assets/BGI.png')}
      style={{ flex: 1, padding: 15 }}
    >
      <ScrollView style={styles.container}>

        <Text style={styles.title}>Appointments</Text>

        {/* ── PENDING ── */}
        <Text style={styles.sectionTitle}>🔔 Pending Requests ({pending.length})</Text>
        {pending.length === 0
          ? <Text style={styles.empty}>No pending requests</Text>
          : pending.map(a => <AppointmentCard key={a.id} a={a} />)
        }

        {/* ── CONFIRMED ── */}
        <Text style={styles.sectionTitle}>✅ Confirmed ({confirmed.length})</Text>
        {confirmed.length === 0
          ? <Text style={styles.empty}>No confirmed appointments</Text>
          : confirmed.map(a => <AppointmentCard key={a.id} a={a} />)
        }

        {/* ── REJECTED ── */}
        {rejected.length > 0 && (
          <>
            <Text style={styles.sectionTitle}>✕ Rejected ({rejected.length})</Text>
            {rejected.map(a => <AppointmentCard key={a.id} a={a} />)}
          </>
        )}

        <View style={{ height: 30 }} />

      </ScrollView>
    </ImageBackground>
  );
};

/* ── SUB COMPONENTS ── */

const DetailRow = ({ icon, label, value }) => (
  <View style={styles.detailRow}>
    <Icon name={icon} size={18} color="#1565C0" />
    <Text style={styles.detailLabel}>{label}</Text>
    <Text style={styles.detailValue}>{value}</Text>
  </View>
);

export default Appointments;

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F4F9FF',
  },

  container: { flex: 1 },

  title: {
    fontSize: 22,
    fontWeight: "bold",
    marginBottom: 10,
    marginTop: 16,
    color: '#0D47A1',
  },

  sectionTitle: {
    fontWeight: 'bold',
    fontSize: 15,
    color: '#0D47A1',
    marginTop: 15,
    marginBottom: 8,
  },

  card: {
    backgroundColor: "#fff",
    borderRadius: 14,
    marginBottom: 12,
    elevation: 3,
    overflow: 'hidden',
  },

  confirmedCard: { borderLeftWidth: 4, borderLeftColor: '#4CAF50' },
  rejectedCard:  { borderLeftWidth: 4, borderLeftColor: '#F44336' },

  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
  },

  avatarSmall: {
    backgroundColor: '#1565C0',
    padding: 8,
    borderRadius: 50,
    marginRight: 10,
  },

  name:  { fontWeight: "bold", fontSize: 15, color: '#0D47A1' },
  info:  { color: '#607D8B', marginTop: 2, fontSize: 12 },

  rightCol: {
    alignItems: 'flex-end',
    gap: 4,
  },

  statusBadge: {
    color: '#fff',
    fontSize: 11,
    fontWeight: 'bold',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 20,
    overflow: 'hidden',
  },

  detailBox: {
    backgroundColor: '#F4F9FF',
    padding: 14,
    borderTopWidth: 1,
    borderTopColor: '#E3F2FD',
  },

  detailTitle: {
    fontWeight: 'bold',
    color: '#0D47A1',
    marginBottom: 10,
    fontSize: 14,
  },

  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    borderBottomWidth: 0.5,
    borderBottomColor: '#E3F2FD',
  },

  detailLabel: {
    flex: 1,
    marginLeft: 8,
    color: '#607D8B',
    fontSize: 13,
  },

  detailValue: {
    fontWeight: 'bold',
    color: '#1565C0',
    fontSize: 13,
    flexShrink: 1,
    textAlign: 'right',
    maxWidth: '50%',
  },

  btnRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 12,
  },

  confirmBtn: {
    flex: 1,
    backgroundColor: '#1565C0',
    padding: 10,
    borderRadius: 10,
    alignItems: 'center',
  },

  confirmText: { color: '#fff', fontWeight: 'bold' },

  rejectBtn: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#F44336',
    padding: 10,
    borderRadius: 10,
    alignItems: 'center',
  },

  rejectText: { color: '#F44336', fontWeight: 'bold' },

  empty: { color: 'gray', fontStyle: 'italic', marginBottom: 5 },
});