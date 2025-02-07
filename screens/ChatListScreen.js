// screens/ChatListScreen.js
import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, Button } from 'react-native';
import { firestore } from '../firebase';
import { collection, onSnapshot } from 'firebase/firestore';

const ChatListScreen = ({ navigation }) => {
  const [chats, setChats] = useState([]);

  useEffect(() => {
    // Reference the "chats" collection
    const chatsRef = collection(firestore, 'chats');
    const unsubscribe = onSnapshot(chatsRef, (querySnapshot) => {
      const chatsData = [];
      querySnapshot.forEach((doc) => {
        chatsData.push({ id: doc.id, ...doc.data() });
      });
      setChats(chatsData);
    }, (error) => {
      console.log(error);
    });
    return () => unsubscribe();
  }, []);

  const renderItem = ({ item }) => (
    <TouchableOpacity
      onPress={() =>
        navigation.navigate('Chat', { chatId: item.id, chatName: item.name })
      }
    >
      <View style={styles.chatItem}>
        <Text style={styles.chatName}>{item.name}</Text>
        <Text style={styles.lastMessage}>{item.lastMessage}</Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      {/* Voice Call button */}
      <Button title="Voice Call" onPress={() => navigation.navigate('Call')} />
      
      {chats.length === 0 ? (
        <Text>
          No chats available. Create a new chat in the backend or via an admin panel.
        </Text>
      ) : (
        <FlatList
          data={chats}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
  },
  chatItem: {
    padding: 15,
    borderBottomColor: '#ccc',
    borderBottomWidth: 1,
  },
  chatName: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  lastMessage: {
    fontSize: 14,
    color: 'gray',
  },
});

export default ChatListScreen;
