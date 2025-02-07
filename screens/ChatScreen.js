// screens/ChatScreen.js
import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, TextInput, Button, StyleSheet } from 'react-native';
import { firestore, auth } from '../firebase';
import {
  collection,
  doc,
  query,
  orderBy,
  onSnapshot,
  addDoc,
  serverTimestamp,
} from 'firebase/firestore';

const ChatScreen = ({ route, navigation }) => {
  const { chatId, chatName } = route.params;
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState('');
  const currentUser = auth.currentUser;

  useEffect(() => {
    navigation.setOptions({ title: chatName });
    // Reference the "messages" subcollection within the specified chat document
    const messagesRef = collection(firestore, 'chats', chatId, 'messages');
    const messagesQuery = query(messagesRef, orderBy('createdAt', 'asc'));
    const unsubscribe = onSnapshot(messagesQuery, (querySnapshot) => {
      const messagesData = [];
      querySnapshot.forEach((doc) => {
        messagesData.push({ id: doc.id, ...doc.data() });
      });
      setMessages(messagesData);
    });
    return () => unsubscribe();
  }, [chatId, chatName, navigation]);

  const sendMessage = async () => {
    if (text.trim().length === 0) return;
    const messagesRef = collection(firestore, 'chats', chatId, 'messages');
    try {
      await addDoc(messagesRef, {
        text: text,
        createdAt: serverTimestamp(),
        user: { id: currentUser.uid, email: currentUser.email },
      });
      setText('');
    } catch (error) {
      console.log(error);
    }
  };

  const renderItem = ({ item }) => (
    <View
      style={[
        styles.messageBubble,
        item.user.id === currentUser.uid ? styles.myMessage : styles.theirMessage,
      ]}
    >
      <Text>{item.text}</Text>
    </View>
  );

  return (
    <View style={styles.container}>
      <FlatList data={messages} keyExtractor={(item) => item.id} renderItem={renderItem} />
      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          placeholder="Type a message..."
          value={text}
          onChangeText={setText}
        />
        <Button title="Send" onPress={sendMessage} />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  inputContainer: {
    flexDirection: 'row',
    padding: 10,
    borderTopWidth: 1,
    borderColor: '#ccc',
    alignItems: 'center',
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 5,
    paddingHorizontal: 10,
    marginRight: 10,
  },
  messageBubble: {
    marginVertical: 5,
    padding: 10,
    borderRadius: 10,
    maxWidth: '70%',
  },
  myMessage: {
    alignSelf: 'flex-end',
    backgroundColor: '#DCF8C6',
  },
  theirMessage: {
    alignSelf: 'flex-start',
    backgroundColor: '#ECECEC',
  },
});

export default ChatScreen;
