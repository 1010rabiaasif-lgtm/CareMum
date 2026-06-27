import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Modal,
} from "react-native";
import { MaterialIcons as Icon } from '@expo/vector-icons';
import { db, auth } from '../Firebase/firebase.config';
import {
  doc,
  getDoc,
  collection,
  query,
  where,
  onSnapshot,
  orderBy,
  getDocs,
} from 'firebase/firestore';

const DoctorDashboard = ({ navigation }) => {
  const [doctorName, setDoctorName] = useState('');
  const [appointments, setAppointments] = useState([]);
  const [recentPatients, setRecentPatients] = useState([]);
  const [loading, setLoading] = useState(true);

  // Selected patient for modal
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);

  // ---------- FETCH DOCTOR NAME ----------
  useEffect(() => {
    const fetchDoctor = async () => {
      try {
        const uid = auth.currentUser?.uid;
        if (!uid) return;
        const docSnap = await getDoc(doc(db, 'users', uid));
        if (docSnap.exists()) setDoctorName(docSnap.data().name || '');
      } catch (e) {
        console.error('Doctor fetch error:', e);
      }
    };
    fetchDoctor();
  }, []);

  // ---------- FETCH APPOINTMENTS (real-time) ----------
  useEffect(() => {
    const uid = auth.currentUser?.uid;
    if (!uid) return;

    const q = query(
      collection(db, 'appointments'),
      where('doctorId', '==', uid),
      where('status', 'in', ['pending', 'confirmed']),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
      setAppointments(data);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // ---------- FETCH RECENT PATIENTS (dynamic) ----------
  useEffect(() => {
    const fetchRecentPatients = async () => {
      try {
        const uid = auth.currentUser?.uid;
        if (!uid) return;

        // Get confirmed appointments for this doctor
        const apptQ = query(
          collection(db, 'appointments'),
          where('doctorId', '==', uid),
          where('status', '==', 'confirmed'),
          orderBy('createdAt', 'desc')
        );
        const apptSnap = await getDocs(apptQ);

        // Get unique patient IDs (last 5)
        const seen = new Set();
        const uniquePatientIds = [];
        apptSnap.docs.forEach(d => {
          const pid = d.data().patientId;
          if (!seen.has(pid)) {
            seen.add(pid);
            uniquePatientIds.push(pid);
          }
        });

        // Fetch each patient's profile
        const patientProfiles = await Promise.all(
          uniquePatientIds.slice(0, 5).map(async (pid) => {
            const pSnap = await getDoc(doc(db, 'users', pid));
            return pSnap.exists() ? { id: pid, ...pSnap.data() } : null;
          })
        );

        setRecentPatients(patientProfiles.filter(Boolean));
      } catch (e) {
        console.error('Recent patients error:', e);
      }
    };

    fetchRecentPatients();
  }, [appointments]); // re-fetch when appointments update

  // ---------- OPEN PATIENT MODAL ----------
  const openPatientDetail = (patient) => {
    setSelectedPatient(patient);
    setModalVisible(true);
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 17) return 'Good Afternoon';
    return 'Good Evening';
  };

  const pendingCount = appointments.filter(a => a.status === 'pending').length;
  const confirmedCount = appointments.filter(a => a.status === 'confirmed').length;

  return (
    <ScrollView style={styles.container}>

      {/* HEADER */}
      <View style={styles.header}>
        <Text style={styles.title}>Doctor Dashboard</Text>
        <Icon name="notifications" size={24} color="#0D47A1" />
      </View>

      {/* GREETING — fixed "Dr. Dr." */}
      <Text style={styles.greeting}>
        {getGreeting()}, {doctorName || 'Doctor'} 👨‍⚕️
      </Text>
      <Text style={styles.subText}>
        You have {confirmedCount} confirmed appointment{confirmedCount !== 1 ? 's' : ''} today
      </Text>

      {/* STATS */}
      <View style={styles.row}>
        <View style={[styles.statCard, { backgroundColor: "#E3F2FD" }]}>
          <Icon name="people" size={24} color="#1565C0" />
          <Text style={styles.statNumber}>{appointments.length}</Text>
          <Text style={styles.statLabel}>Total</Text>
        </View>
        <View style={[styles.statCard, { backgroundColor: "#E1F5FE" }]}>
          <Icon name="calendar-today" size={24} color="#0288D1" />
          <Text style={styles.statNumber}>{confirmedCount}</Text>
          <Text style={styles.statLabel}>Confirmed</Text>
        </View>
        <View style={[styles.statCard, { backgroundColor: "#FFF3E0" }]}>
          <Icon name="pending-actions" size={24} color="#FF9800" />
          <Text style={styles.statNumber}>{pendingCount}</Text>
          <Text style={styles.statLabel}>Pending</Text>
        </View>
      </View>

      {/* TODAY'S APPOINTMENTS */}
      <Text style={styles.sectionTitle}>Today's Appointments</Text>

      {loading
        ? <ActivityIndicator size="small" color="#1565C0" style={{ marginBottom: 15 }} />
        : appointments.length === 0
          ? <Text style={styles.empty}>No appointments yet</Text>
          : appointments.slice(0, 5).map(a => (
            <AppointmentCard
              key={a.id}
              name={a.patientName}
              time={a.time}
              status={a.status}
            />
          ))
      }

      {/* QUICK ACTIONS */}
      <Text style={styles.sectionTitle}>Quick Actions</Text>
      <View style={styles.grid}>
        <QuickAction icon="chat" label="Chat" onPress={() => navigation.navigate('Chat')} />
        <QuickAction icon="monitor-heart" label="Health" onPress={() => navigation.navigate('Health')} />
        <QuickAction icon="calendar-today" label="Appointments" onPress={() => navigation.navigate('Appointments')} />
        <QuickAction icon="person" label="Profile" onPress={() => navigation.navigate('Profile')} />
      </View>

      {/* RECENT PATIENTS — now dynamic + clickable */}
      <Text style={styles.sectionTitle}>Recent Patients</Text>

      {recentPatients.length === 0
        ? <Text style={styles.empty}>No recent patients yet</Text>
        : recentPatients.map(p => (
          <PatientTile
            key={p.id}
            name={p.name || '—'}
            detail={p.pregnancyWeek ? `${p.pregnancyWeek} weeks pregnant` : p.bloodGroup || '—'}
            onPress={() => openPatientDetail(p)}
          />
        ))
      }

      <View style={{ height: 20 }} />

      {/* PATIENT DETAIL MODAL */}
      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>

            {/* MODAL HEADER */}
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Patient Details</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Icon name="close" size={24} color="#0D47A1" />
              </TouchableOpacity>
            </View>

            {/* AVATAR */}
            <View style={styles.modalAvatar}>
              <Icon name="person" size={36} color="#fff" />
            </View>
            <Text style={styles.modalName}>{selectedPatient?.name || '—'}</Text>

            <ScrollView style={{ width: '100%' }}>
              <DetailRow icon="cake" label="Age" value={selectedPatient?.age || '—'} />
              <DetailRow icon="call" label="Phone" value={selectedPatient?.phone || '—'} />
              <DetailRow icon="email" label="Email" value={selectedPatient?.email || '—'} />
              <DetailRow icon="location-on" label="Address" value={selectedPatient?.address || '—'} />
              <DetailRow icon="favorite" label="Blood Group" value={selectedPatient?.bloodGroup || '—'} />
              <DetailRow icon="pregnant-woman" label="Pregnancy Week" value={selectedPatient?.pregnancyWeek ? `${selectedPatient.pregnancyWeek} Weeks` : '—'} />
            </ScrollView>

            <TouchableOpacity
              style={styles.closeBtn}
              onPress={() => setModalVisible(false)}
            >
              <Text style={styles.closeBtnText}>Close</Text>
            </TouchableOpacity>

          </View>
        </View>
      </Modal>

    </ScrollView>
  );
};

/* ── SUB COMPONENTS ── */

const AppointmentCard = ({ name, time, status }) => (
  <View style={styles.card}>
    <View style={styles.cardLeft}>
      <Icon name="person" size={22} color="#fff" />
    </View>
    <View style={{ flex: 1 }}>
      <Text style={styles.cardTitle}>{name}</Text>
      <Text style={styles.cardSub}>{time}</Text>
    </View>
    <Text style={[
      styles.statusBadge,
      { backgroundColor: status === 'confirmed' ? '#4CAF50' : '#FF9800' }
    ]}>
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </Text>
  </View>
);

const QuickAction = ({ icon, label, onPress }) => (
  <TouchableOpacity style={styles.quickCard} onPress={onPress}>
    <Icon name={icon} size={24} color="#1565C0" />
    <Text style={{ marginTop: 8, color: "#0D47A1", fontWeight: '600' }}>{label}</Text>
  </TouchableOpacity>
);

const PatientTile = ({ name, detail, onPress }) => (
  <TouchableOpacity style={styles.patientRow} onPress={onPress} activeOpacity={0.7}>
    <View style={styles.avatar}>
      <Icon name="person" size={20} color="#fff" />
    </View>
    <View style={{ flex: 1 }}>
      <Text style={styles.cardTitle}>{name}</Text>
      <Text style={styles.cardSub}>{detail}</Text>
    </View>
    <Icon name="arrow-forward-ios" size={16} color="#1565C0" />
  </TouchableOpacity>
);

const DetailRow = ({ icon, label, value }) => (
  <View style={styles.detailRow}>
    <Icon name={icon} size={18} color="#1565C0" />
    <Text style={styles.detailLabel}>{label}</Text>
    <Text style={styles.detailValue}>{value}</Text>
  </View>
);

export default DoctorDashboard;

/* ── STYLES ── */
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F4F9FF",
    padding: 16
  },

  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 15
  },

  title: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#0D47A1"
  },

  greeting: {
    fontSize: 20,
    fontWeight: "bold",
    marginTop: 10,
    color: "#1565C0"
  },

  subText: {
    color: "#607D8B",
    marginBottom: 20
  },

  row: {
    flexDirection: "row",
    justifyContent: "space-between"
  },

  statCard: {
    flex: 1,
    padding: 15,
    borderRadius: 16,
    marginRight: 8,
    elevation: 2
  },

  statNumber: {
    fontSize: 18,
    fontWeight: "bold",
    marginTop: 5,
    color: "#0D47A1"
  },

  statLabel: { color: "#546E7A" },

  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginVertical: 15,
    color: "#0D47A1"
  },

  card: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    padding: 15,
    borderRadius: 16,
    marginBottom: 10,
    elevation: 2
  },

  cardLeft: {
    backgroundColor: "#1565C0",
    padding: 10,
    borderRadius: 50,
    marginRight: 10
  },

  cardTitle: {
    fontWeight: "bold",
    color: "#0D47A1"
  },
  cardSub: { color: "#607D8B" },

  statusBadge: {
    color: '#fff',
    fontSize: 11,
    fontWeight: 'bold',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 20,
    overflow: 'hidden'
  },

  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between"
  },

  quickCard: {
    width: "48%",
    backgroundColor: "#fff",
    padding: 20, borderRadius: 16,
    alignItems: "center", marginBottom: 10,
    elevation: 2
  },

  patientRow: {
    flexDirection: "row",
    alignItems: "center", backgroundColor: '#fff',
    padding: 12, borderRadius: 12,
    marginBottom: 8, elevation: 1
  },

  avatar: {
    backgroundColor: "#1976D2",
    padding: 10, borderRadius: 50,
    marginRight: 10
  },

  empty: {
    color: 'gray',
    fontStyle: 'italic',
    marginBottom: 15
  },

  // MODAL
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center'
  },

  modalCard: {
    backgroundColor: '#fff',
    borderRadius: 20, padding: 20,
    width: '90%', maxHeight: '80%', alignItems: 'center'
  },

  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%', marginBottom: 15
  },

  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#0D47A1'
  },

  modalAvatar: {
    backgroundColor: '#1565C0',
    padding: 18, borderRadius: 50,
    marginBottom: 10
  },

  modalName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#0D47A1', marginBottom: 15
  },

  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 0.5,
    borderBottomColor: '#E3F2FD',
    width: '100%'
  },

  detailLabel: {
    flex: 1,
    marginLeft: 8,
    color: '#607D8B'
  },

  detailValue: {
    fontWeight: 'bold',
    color: '#1565C0', textAlign: 'right',
    maxWidth: '50%'
  },

  closeBtn: {
    backgroundColor: '#1565C0',
    padding: 12, borderRadius: 12, alignItems: 'center',
    marginTop: 15, width: '100%'
  },

  closeBtnText: { color: '#fff', fontWeight: 'bold' },
});