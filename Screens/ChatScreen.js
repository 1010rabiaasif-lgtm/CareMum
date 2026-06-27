import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  FlatList,
  ImageBackground,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { MaterialIcons as Icon } from '@expo/vector-icons';
import { db, auth } from '../Firebase/firebase.config';
import {
  collection,
  query,
  orderBy,
  onSnapshot,
  addDoc,
  serverTimestamp,
} from 'firebase/firestore';

const ChatScreen = ({ route, navigation }) => {
  const { chatId, otherName } = route.params;

  const [messages, setMessages] = useState([]);
  const [text, setText]         = useState('');
  const [loading, setLoading]   = useState(true);
  const flatListRef             = useRef(null);

  const uid = auth.currentUser?.uid;

  // ---------- LISTEN TO MESSAGES ----------
  useEffect(() => {
    const q = query(
      collection(db, 'chats', chatId, 'messages'),
      orderBy('createdAt', 'asc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
      setMessages(data);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [chatId]);

  // ---------- SEND MESSAGE ----------
  const handleSend = async () => {
    if (!text.trim()) return;

    const msgText = text.trim();
    setText(''); // clear immediately for UX

    try {
      await addDoc(collection(db, 'chats', chatId, 'messages'), {
        text:      msgText,
        senderId:  uid,
        createdAt: serverTimestamp(),
      });
    } catch (e) {
      console.error('Send error:', e);
    }
  };

  // ---------- RENDER MESSAGE ----------
  const renderMessage = ({ item }) => {
    const isMe = item.senderId === uid;
    return (
      <View style={[styles.msgWrapper, isMe ? styles.myWrapper : styles.theirWrapper]}>
        <View style={[styles.bubble, isMe ? styles.myBubble : styles.theirBubble]}>
          <Text style={[styles.msgText, isMe ? styles.myText : styles.theirText]}>
            {item.text}
          </Text>
          <Text style={styles.msgTime}>
            {item.createdAt?.toDate
              ? item.createdAt.toDate().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
              : '...'}
          </Text>
        </View>
      </View>
    );
  };

  return (
    <ImageBackground
      source={require('../assets/BGI.png')}
      style={{ flex: 1 }}
    >
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={90}
      >
        {/* HEADER */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Icon name="arrow-back" size={24} color="#0D47A1" />
          </TouchableOpacity>
          <View style={styles.headerAvatar}>
            <Icon name="person" size={20} color="#fff" />
          </View>
          <Text style={styles.headerName}>{otherName}</Text>
        </View>

        {/* MESSAGES */}
        {loading
          ? <ActivityIndicator size="large" color="#1E3A8A" style={{ flex: 1 }} />
          : (
            <FlatList
              ref={flatListRef}
              data={messages}
              keyExtractor={(item) => item.id}
              renderItem={renderMessage}
              contentContainerStyle={styles.messageList}
              onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
              ListEmptyComponent={
                <Text style={styles.emptyText}>
                  No messages yet. Say hello! 👋
                </Text>
              }
            />
          )
        }

        {/* INPUT */}
        <View style={styles.inputRow}>
          <TextInput
            style={styles.input}
            placeholder="Type a message..."
            value={text}
            onChangeText={setText}
            multiline
          />
          <TouchableOpacity
            style={[styles.sendBtn, !text.trim() && { opacity: 0.5 }]}
            onPress={handleSend}
            disabled={!text.trim()}
          >
            <Icon name="send" size={22} color="#fff" />
          </TouchableOpacity>
        </View>

      </KeyboardAvoidingView>
    </ImageBackground>
  );
};

export default ChatScreen;

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.9)',
    padding: 12,
    paddingTop: 50,
    elevation: 3,
  },

  headerAvatar: {
    backgroundColor: '#1565C0',
    padding: 8,
    borderRadius: 50,
    marginHorizontal: 10,
  },

  headerName: {
    fontSize: 17,
    fontWeight: 'bold',
    color: '#0D47A1',
    flex: 1,
  },

  messageList: {
    padding: 15,
    paddingBottom: 10,
  },

  msgWrapper: { marginBottom: 8 },
  myWrapper:  { alignItems: 'flex-end' },
  theirWrapper: { alignItems: 'flex-start' },

  bubble: {
    maxWidth: '75%',
    padding: 10,
    borderRadius: 16,
  },

  myBubble:    { backgroundColor: '#1565C0', borderBottomRightRadius: 4 },
  theirBubble: { backgroundColor: '#fff',    borderBottomLeftRadius: 4, elevation: 1 },

  msgText:   { fontSize: 15 },
  myText:    { color: '#fff' },
  theirText: { color: '#1E2A38' },

  msgTime: {
    fontSize: 10,
    marginTop: 4,
    color: 'rgba(255,255,255,0.7)',
    alignSelf: 'flex-end',
  },

  emptyText: {
    textAlign: 'center',
    color: '#90A4AE',
    marginTop: 40,
    fontStyle: 'italic',
  },

  inputRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    padding: 10,
    backgroundColor: 'rgba(255,255,255,0.95)',
    borderTopWidth: 1,
    borderTopColor: '#E3F2FD',
  },

  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#BBDEFB',
    borderRadius: 25,
    paddingHorizontal: 15,
    paddingVertical: 10,
    backgroundColor: '#F4F9FF',
    maxHeight: 100,
    marginRight: 8,
  },

  sendBtn: {
    backgroundColor: '#1565C0',
    padding: 12,
    borderRadius: 50,
  },
});