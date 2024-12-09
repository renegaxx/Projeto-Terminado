import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, Image } from 'react-native';
import { collection, query, where, orderBy, onSnapshot, getDoc, doc } from 'firebase/firestore';
import { db } from './firebaseConfig';
import { getAuth } from 'firebase/auth';

const NotificationsScreen = () => {
  const [notifications, setNotifications] = useState([]);
  const currentUser = getAuth().currentUser?.uid;

  useEffect(() => {
    if (currentUser) {
      const notificationsRef = collection(db, 'notifications');

      const q = query(
        notificationsRef,
        where('toUserId', '==', currentUser),
        orderBy('timestamp', 'desc')
      );

      const unsubscribe = onSnapshot(q, async (querySnapshot) => {
        const notificationsList = [];

        await Promise.all(
          querySnapshot.docs.map(async (docSnap) => {
            const notificationData = docSnap.data();
            const userDoc = await getDoc(doc(db, 'users', notificationData.fromUserId));
            const userName = userDoc.exists() ? userDoc.data().fullName : 'Usuário desconhecido';

            notificationsList.push({
              id: docSnap.id,
              ...notificationData,
              fromUserName: userName,
            });
          })
        );

        setNotifications(notificationsList);
      });

      return () => unsubscribe();
    }
  }, [currentUser]);

  const renderNotificationItem = ({ item }) => (
    <View style={styles.notificationContainer}>
      <View style={styles.notificationHeader}>
        <Image
          source={require('./assets/mcigPerfil.jpg')} // Ícone do usuário padrão
          style={styles.userIcon}
        />
        <Text style={styles.fromUserName}>{item.fromUserName}</Text>
      </View>
      <Text style={styles.notificationMessage}>{item.message}</Text>
      <Text style={styles.timestampText}>
        {new Date(item.timestamp.seconds * 1000).toLocaleString()}
      </Text>
    </View>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.headerText}>Notificações</Text>
      {notifications.length === 0 ? (
        <Text style={styles.noNotificationsText}>Nenhuma notificação</Text>
      ) : (
        <FlatList
          data={notifications}
          keyExtractor={(item) => item.id}
          renderItem={renderNotificationItem}
          style={styles.notificationList}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
    paddingTop: 35,
    paddingHorizontal: 20,
  },
  headerText: {
    fontSize: 16,
    fontFamily: 'Raleway-SemiBold',
    color: 'white',
    textAlign: 'center',
  },
  noNotificationsText: {
    color: '#A1A0A0',
    textAlign: 'center',
    marginTop: 20,
    fontSize: 16,
    fontFamily: 'Raleway-Regular',
  },
  notificationList: {
    flex: 1,
  },
  notificationContainer: {
    backgroundColor: '#292929',
    padding: 15,
    borderRadius: 10,
    marginVertical: 8,
    shadowColor: '#000',
    shadowOpacity: 0.3,
    shadowRadius: 5,
    shadowOffset: { width: 0, height: 2 },
  },
  notificationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  userIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 10,
  },
  fromUserName: {
    fontWeight: 'bold',
    color: '#9F3EFC',
    fontSize: 16,
    fontFamily: 'Raleway-SemiBold',
  },
  notificationMessage: {
    color: 'white',
    fontSize: 14,
    fontFamily: 'Raleway-Regular',
    marginBottom: 5,
  },
  timestampText: {
    color: '#A1A0A0',
    fontSize: 12,
    fontFamily: 'Raleway-Light',
    textAlign: 'right',
  },
});

export default NotificationsScreen;
