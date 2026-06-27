import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ImageBackground,
  ActivityIndicator,
} from "react-native";
import { db, auth } from '../Firebase/firebase.config';
import {
  collection,
  query,
  where,
  getDocs,
  doc,
  getDoc,
} from 'firebase/firestore';

const getHealthStatus = (week) => {
  const w = parseInt(week);
  if (!w || isNaN(w)) return { label: 'Unknown',  color: '#9E9E9E', emoji: '❓' };
  if (w >= 37)        return { label: 'Critical',  color: '#E53935', emoji: '🔴' };
  if (w >= 28)        return { label: 'High Risk', color: '#FF9800', emoji: '🟠' };
  if (w >= 13)        return { label: 'Stable',    color: '#43A047', emoji: '✅' };
  return                     { label: 'Monitor',   color: '#FFB300', emoji: '🟡' };
};

const HealthTracker = () => {
  const [patients, setPatients] = useState([]);
  const [loading, setLoading]   = useState(true);

  useEffect(() => {
    const fetchPatients = async () => {
      try {
        const uid = auth.currentUser?.uid;
        if (!uid) return;

        const apptQ = query(
          collection(db, 'appointments'),
          where('doctorId', '==', uid),
          where('status', '==', 'confirmed')
        );
        const apptSnap = await getDocs(apptQ);

        const seen = new Set();
        const uniqueIds = [];
        apptSnap.docs.forEach(d => {
          const pid = d.data().patientId;
          if (!seen.has(pid)) { seen.add(pid); uniqueIds.push(pid); }
        });

        const profiles = await Promise.all(
          uniqueIds.map(async (pid) => {
            const pSnap = await getDoc(doc(db, 'users', pid));
            return pSnap.exists() ? { id: pid, ...pSnap.data() } : null;
          })
        );

        setPatients(profiles.filter(Boolean));
      } catch (e) {
        console.error('HealthTracker fetch error:', e);
      } finally {
        setLoading(false);
      }
    };

    fetchPatients();
  }, []);

  const total    = patients.length;
  const critical = patients.filter(p => parseInt(p.pregnancyWeek) >= 37).length;
  const highRisk = patients.filter(p => { const w = parseInt(p.pregnancyWeek); return w >= 28 && w < 37; }).length;
  const stable   = patients.filter(p => { const w = parseInt(p.pregnancyWeek); return w >= 13 && w < 28; }).length;
  const monitor  = patients.filter(p => parseInt(p.pregnancyWeek) < 13).length;

  return (
    <ImageBackground
      source={require('../assets/BGI.png')}
      style={{ flex: 1 }}
    >
      <ScrollView contentContainerStyle={{ padding: 15 }}>

        {/* ── HEADER CARD ── */}
        <View style={styles.headerCard}>
          <Text style={styles.headerTitle}>🏥 Health Tracker</Text>
          <Text style={styles.headerSubtitle}>Monitor patient health in real time</Text>

          {/* QUICK STATS ROW */}
          {loading
            ? <ActivityIndicator color="#fff" style={{ marginTop: 12 }} />
            : (
              <View style={styles.quickStatsRow}>
                <QuickStat value={total}    label="Total"     color="#fff"    bg="rgba(255,255,255,0.2)" />
                <QuickStat value={critical} label="Critical"  color="#FF6B6B" bg="rgba(229,57,53,0.25)"  />
                <QuickStat value={highRisk} label="High Risk" color="#FFB74D" bg="rgba(255,152,0,0.25)"  />
                <QuickStat value={stable}   label="Stable"    color="#81C784" bg="rgba(67,160,71,0.25)"  />
              </View>
            )
          }
        </View>

        {!loading && (
          <>
            {/* SUMMARY CARD */}
            <View style={styles.cardPrimary}>
              <Text style={styles.cardTitle}>📊 Detailed Summary</Text>

              <SummaryRow label="👩‍⚕️ Patients Checked"      value={total}    color="#1E2A38" />
              <SummaryRow label="🔴 Critical (Week 37+)"    value={critical} color="#E53935" />
              <SummaryRow label="🟠 High Risk (Week 28–36)" value={highRisk} color="#FF9800" />
              <SummaryRow label="✅ Stable (Week 13–27)"    value={stable}   color="#43A047" />
              <SummaryRow label="🟡 Monitor (Week 1–12)"    value={monitor}  color="#FFB300" />
            </View>

            {/* PATIENT LIST */}
            <View style={styles.card}>
              <Text style={styles.cardTitle}>🩺 Patient Health Overview</Text>

              {patients.length === 0
                ? <Text style={styles.empty}>No confirmed patients yet</Text>
                : patients.map(p => {
                  const status = getHealthStatus(p.pregnancyWeek);
                  return (
                    <View key={p.id} style={styles.item}>
                      <View style={styles.itemLeft}>
                        <Text style={styles.patient}>{p.name || '—'}</Text>
                        <Text style={styles.detail}>
                          Week {p.pregnancyWeek || '?'} • Blood: {p.bloodGroup || '—'}
                        </Text>
                      </View>
                      <View style={[styles.badge, { backgroundColor: status.color }]}>
                        <Text style={styles.badgeText}>{status.emoji} {status.label}</Text>
                      </View>
                    </View>
                  );
                })
              }
            </View>

            {/* LEGEND */}
            <View style={styles.legendCard}>
              <Text style={styles.cardTitle}>📋 Status Guide</Text>
              <LegendRow emoji="🟡" label="Monitor"   week="Week 1–12"  color="#FFB300" />
              <LegendRow emoji="✅" label="Stable"    week="Week 13–27" color="#43A047" />
              <LegendRow emoji="🟠" label="High Risk" week="Week 28–36" color="#FF9800" />
              <LegendRow emoji="🔴" label="Critical"  week="Week 37+"   color="#E53935" />
            </View>
          </>
        )}

        <View style={{ height: 30 }} />
      </ScrollView>
    </ImageBackground>
  );
};

/* ── SUB COMPONENTS ── */

const QuickStat = ({ value, label, color, bg }) => (
  <View style={[styles.quickStat, { backgroundColor: bg }]}>
    <Text style={[styles.quickStatValue, { color }]}>{value}</Text>
    <Text style={styles.quickStatLabel}>{label}</Text>
  </View>
);

const SummaryRow = ({ label, value, color }) => (
  <View style={styles.row}>
    <Text style={styles.label}>{label}</Text>
    <Text style={[styles.value, { color }]}>{value}</Text>
  </View>
);

const LegendRow = ({ emoji, label, week, color }) => (
  <View style={styles.legendRow}>
    <Text style={styles.legendEmoji}>{emoji}</Text>
    <Text style={[styles.legendLabel, { color }]}>{label}</Text>
    <Text style={styles.legendWeek}>{week}</Text>
  </View>
);

export default HealthTracker;

const styles = StyleSheet.create({
  // ── HEADER ──
  headerCard: {
    backgroundColor: '#1565C0',
    borderRadius: 20,
    padding: 20,
    marginTop: 10,
    marginBottom: 5,
    elevation: 4,
  },

  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
  },

  headerSubtitle: {
    color: 'rgba(255,255,255,0.8)',
    marginTop: 4,
    fontSize: 13,
  },

  quickStatsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 16,
    gap: 8,
  },

  quickStat: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 10,
    borderRadius: 12,
  },

  quickStatValue: {
    fontSize: 20,
    fontWeight: 'bold',
  },

  quickStatLabel: {
    color: 'rgba(255,255,255,0.85)',
    fontSize: 11,
    marginTop: 2,
  },

  // ── CARDS ──
  cardPrimary: {
    backgroundColor: "#E8F1FF",
    padding: 15,
    borderRadius: 15,
    marginTop: 15,
    elevation: 2,
  },

  card: {
    backgroundColor: "#E8F1FF",
    padding: 15,
    borderRadius: 15,
    marginTop: 15,
    elevation: 3,
  },

  legendCard: {
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 15,
    marginTop: 15,
    elevation: 2,
  },

  cardTitle: {
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 10,
    color: '#1E2A38',
  },

  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginVertical: 5,
  },

  label: { color: "#555" },

  value: { fontWeight: "bold", color: "#1E2A38" },

  item: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 0.5,
    borderColor: "#ddd",
  },

  itemLeft: { flex: 1 },

  patient: { fontWeight: "bold", color: '#1E2A38' },

  detail: { color: "gray", fontSize: 12, marginTop: 2 },

  badge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
    marginLeft: 8,
  },

  badgeText: { color: '#fff', fontSize: 11, fontWeight: 'bold' },

  empty: { color: 'gray', fontStyle: 'italic' },

  legendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    borderBottomWidth: 0.5,
    borderColor: '#eee',
  },

  legendEmoji: { fontSize: 16, marginRight: 8 },
  legendLabel: { fontWeight: 'bold', flex: 1 },
  legendWeek:  { color: '#607D8B', fontSize: 13 },
});