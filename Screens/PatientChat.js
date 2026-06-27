import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  ImageBackground,
  ActivityIndicator,
} from "react-native";
import { MaterialIcons as Icon } from '@expo/vector-icons';
import { db, auth } from '../Firebase/firebase.config';
import {
  collection,
  query,
  where,
  onSnapshot,
  orderBy,
  getDocs,
  doc,
  getDoc,
} from 'firebase/firestore';

const PatientChat = ({ navigation }) => {
  const [chatList, setChatList] = useState([]);
  const [loading, setLoading]   = useState(true);

  useEffect(() => {
    const uid = auth.currentUser?.uid;
    if (!uid) return;

    // Get all confirmed appointments → unique doctors → build chat list
    const q = query(
      collection(db, 'appointments'),
      where('patientId', '==', uid),
      where('status', '==', 'confirmed')
    );

    const unsubscribe = onSnapshot(q, async (snapshot) => {
      // Get unique doctor IDs
      const seen = new Set();
      const uniqueDoctors = [];
      snapshot.docs.forEach(d => {
        const did = d.data().doctorId;
        if (!seen.has(did)) {
          seen.add(did);
          uniqueDoctors.push({ doctorId: did, doctorName: d.data().doctorName });
        }
      });

      // For each doctor, get last message from chat
      const chatData = await Promise.all(
        uniqueDoctors.map(async ({ doctorId, doctorName }) => {
          const chatId = [uid, doctorId].sort().join('_');
          try {
            const msgQ = query(
              collection(db, 'chats', chatId, 'messages'),
              orderBy('createdAt', 'desc')
            );
            const msgSnap = await getDocs(msgQ);
            const lastMsg = msgSnap.empty ? 'No messages yet' : msgSnap.docs[0].data().text;
            const lastTime = msgSnap.empty ? '' : new Date(msgSnap.docs[0].data().createdAt?.toDate()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

            return { chatId, doctorId, doctorName, lastMsg, lastTime };
          } catch {
            return { chatId, doctorId, doctorName, lastMsg: 'No messages yet', lastTime: '' };
          }
        })
      );

      setChatList(chatData);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#1E3A8A" />
      </View>
    );
  }

  return (
    <ImageBackground
      source={require('../assets/BGI.png')}
      style={{ flex: 1, padding: 15 }}
    >
      <View style={styles.container}>
        <Text style={styles.title}>Chats</Text>

        {chatList.length === 0
          ? (
            <View style={styles.emptyContainer}>
              <Icon name="chat" size={60} color="#BBDEFB" />
              <Text style={styles.emptyText}>No chats yet</Text>
              <Text style={styles.emptySubText}>Book and confirm an appointment to start chatting with your doctor</Text>
            </View>
          )
          : (
            <FlatList
              data={chatList}
              keyExtractor={(item) => item.chatId}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.chatItem}
                  onPress={() => navigation.navigate('ChatScreen', {
                    chatId:     item.chatId,
                    otherName:  item.doctorName,
                    otherId:    item.doctorId,
                  })}
                >
                  <View style={styles.avatar}>
                    <Icon name="local-hospital" size={22} color="#fff" />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.name}>Dr. {item.doctorName}</Text>
                    <Text style={styles.msg} numberOfLines={1}>{item.lastMsg}</Text>
                  </View>
                  <Text style={styles.time}>{item.lastTime}</Text>
                </TouchableOpacity>
              )}
            />
          )
        }
      </View>
    </ImageBackground>
  );
};

export default PatientChat;

const styles = StyleSheet.create({
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },

  container: { flex: 1 },

  title: {
    fontSize: 24,
    fontWeight: "bold",
    marginTop: 16,
    marginBottom: 10,
    color: "#1E3A8A",
  },

  chatItem: {
    flexDirection: "row",
    alignItems: 'center',
    padding: 15,
    backgroundColor: "#fff",
    borderRadius: 14,
    marginBottom: 10,
    elevation: 2,
  },

  avatar: {
    backgroundColor: '#1565C0',
    padding: 10,
    borderRadius: 50,
    marginRight: 12,
  },

  name:  { fontWeight: "bold", fontSize: 16, color: '#0D47A1' },
  msg:   { color: "gray", fontSize: 13, marginTop: 2 },
  time:  { color: "gray", fontSize: 11 },

  emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', marginTop: 80 },
  emptyText:      { fontSize: 18, fontWeight: 'bold', color: '#607D8B', marginTop: 15 },
  emptySubText:   { color: '#90A4AE', textAlign: 'center', marginTop: 8, paddingHorizontal: 20 },
});