import React, { useEffect, useState } from 'react';
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    FlatList,
    StyleSheet,
    Image,
    Animated,
    Alert,
    Easing,
} from 'react-native';
import {
    collection,
    addDoc,
    onSnapshot,
    query,
    where,
    orderBy,
    doc,
    getDoc,
    updateDoc,
    arrayUnion,
    deleteDoc,
} from 'firebase/firestore';
import { db } from './firebaseConfig';
import { getAuth } from 'firebase/auth';

const MessagesScreen = ({ route, navigation }) => {
    const { userId } = route.params || {};
    const [message, setMessage] = useState('');
    const [messages, setMessages] = useState([]);
    const [userName, setUserName] = useState('Usuário');

    const currentUser = getAuth().currentUser?.uid;

    useEffect(() => {
        const fetchUserName = async () => {
            if (userId) {
                const userDoc = await getDoc(doc(db, 'users', userId));
                if (userDoc.exists()) {
                    setUserName(userDoc.data().username || 'Carregando...');
                }
            }
        };
        fetchUserName();
    }, [userId]);

    useEffect(() => {
        if (!userId || !currentUser) return;

        const messagesRef = collection(db, 'messages');
        const q = query(
            messagesRef,
            where('participants', 'array-contains', currentUser),
            orderBy('timestamp', 'asc')
        );

        const unsubscribe = onSnapshot(q, (querySnapshot) => {
            const loadedMessages = [];
            querySnapshot.forEach((doc) => {
                const data = doc.data();
                if (
                    ((data.sender === currentUser && data.receiver === userId) ||
                        (data.sender === userId && data.receiver === currentUser)) &&
                    (!data.clearedBy || !data.clearedBy.includes(currentUser))
                ) {
                    loadedMessages.push({ id: doc.id, ...data, animation: new Animated.Value(0) });
                }
            });
            setMessages(loadedMessages);
        });

        return () => unsubscribe();
    }, [userId, currentUser]);

    const handleSendMessage = async () => {
        if (message.trim()) {
            await addDoc(collection(db, 'messages'), {
                text: message,
                sender: currentUser,
                receiver: userId,
                participants: [currentUser, userId],
                timestamp: new Date(),
                clearedBy: [],
            });
            setMessage('');
        }
    };

    const handleClearHistory = async () => {
        Alert.alert(
            'Limpar Histórico',
            'Tem certeza de que deseja limpar o histórico?',
            [
                { text: 'Cancelar', style: 'cancel' },
                {
                    text: 'Confirmar',
                    onPress: async () => {
                        for (const msg of messages) {
                            const messageRef = doc(db, 'messages', msg.id);
                            if (msg.clearedBy?.includes(userId)) {
                                await deleteDoc(messageRef);
                            } else {
                                await updateDoc(messageRef, {
                                    clearedBy: arrayUnion(currentUser),
                                });
                            }
                        }
                    },
                },
            ]
        );
    };

    const renderMessageItem = ({ item }) => {
        const slideUp = item.animation.interpolate({
            inputRange: [0, 1],
            outputRange: [50, 0],
        });

        Animated.timing(item.animation, {
            toValue: 1,
            duration: 500,
            easing: Easing.out(Easing.exp),
            useNativeDriver: true,
        }).start();

        return (
            <Animated.View
                style={[
                    styles.messageContainer,
                    item.sender === currentUser ? styles.messageOutgoing : styles.messageIncoming,
                    { transform: [{ translateY: slideUp }] },
                ]}
            >
                <Text style={styles.messageText}>{item.text}</Text>
            </Animated.View>
        );
    };

    const renderSuggestions = () => {
        const suggestions = ['Bom dia', 'Olá, tudo bem?', 'Oi!'];

        return (
            <View style={styles.suggestionContainer}>
                <Text style={styles.suggestionText}>Que tal iniciar uma conversa com:</Text>
                <View style={styles.suggestionButtonsContainer}>
                    {suggestions.map((text, index) => (
                        <TouchableOpacity
                            key={index}
                            style={styles.suggestionButton}
                            onPress={() => setMessage(text)}
                        >
                            <Text style={styles.suggestionButtonText}>{text}</Text>
                        </TouchableOpacity>
                    ))}
                </View>
            </View>
        );
    };

    return (
        <View style={styles.container}>
            <View style={styles.topBar}>
                <TouchableOpacity onPress={() => navigation.goBack()}>
                    <Image source={require('./assets/voltarImg.png')} style={styles.voltarImg} />
                </TouchableOpacity>
                <Text style={styles.userNameText}>{userName}</Text>
                <Image source={require('./assets/icons/cadeadoImg.png')} style={styles.configIcon} />
            </View>

            {messages.length === 0 ? (
                renderSuggestions()
            ) : (
                <FlatList
                    data={messages}
                    keyExtractor={(item) => item.id}
                    renderItem={renderMessageItem}
                    style={styles.messageList}
                />
            )}

            <View style={styles.footerButtons}>
                <TouchableOpacity style={styles.clearButton} onPress={handleClearHistory}>
                    <Image source={require('./assets/icons/lixeiraImg.png')} style={styles.clearIcon} />
                    <Text style={styles.clearHistoryText}>Limpar Histórico</Text>
                </TouchableOpacity>
            </View>

            <View style={styles.inputContainer}>
              
                <TextInput
                    style={styles.input}
                    placeholder="Digite sua mensagem..."
                    value={message}
                    onChangeText={setMessage}
                    placeholderTextColor="#777"
                />
                <TouchableOpacity style={styles.sendButton} onPress={handleSendMessage}>
                    <Image source={require('./assets/icons/enviarImg.png')} style={styles.sendIcon} />
                </TouchableOpacity>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#1A1A1A', paddingTop: 35 },
    topBar: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        paddingVertical: 10,
        backgroundColor: '#1A1A1A',
    },
    voltarImg: { width: 24, height: 24 },
    userNameText: {
        fontSize: 16,
        fontFamily: 'Raleway-SemiBold',
        color: 'white',
        textAlign: 'center',
        flex: 1,
    },
    configIcon: { width: 24, height: 24, resizeMode: 'contain' },
    messageList: { flex: 1, padding: 10 },
    messageContainer: {
        paddingHorizontal: 15,
        paddingVertical: 10,
        borderRadius: 13,
        marginVertical: 8,
    },
    messageIncoming: { backgroundColor: '#2E2E2E', alignSelf: 'flex-start' },
    messageOutgoing: { backgroundColor: '#9F3EFC', alignSelf: 'flex-end' },
    messageText: { color: '#fff', fontFamily: 'Inter-Regular', fontSize: 12 },
    inputContainer: {
        flexDirection: 'row',
        padding: 11,
        alignItems: 'center',
    },
    input: {
        flex: 1,
        borderRadius: 20,
        paddingHorizontal: 14,
        height: 45,
        color: 'white',
        fontFamily: 'Inter-Regular',
        backgroundColor: '#292929',
    },
    sendButton: {
        backgroundColor: '#9F3EFC',
        borderRadius: 30,
        padding: 11,
        marginLeft: 10,
        justifyContent: 'center',
    },
    sendIcon: { width: 27, height: 27, resizeMode: 'cover' },
    footerButtons: {
        flexDirection: 'row',
        marginTop: 'auto',
        paddingHorizontal: 10,
        paddingBottom: 10,
    },
    clearButton: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 8,
        paddingHorizontal: 15,
        
        borderRadius: 15,
    },
    clearIcon: { width: 22, height: 22, tintColor: '#9F3EFC', marginRight: 8 },
    clearHistoryText: { color: '#A1A0A0', fontFamily: 'Montserrat-Regular', fontWeight: 100, },
    suggestionContainer: {
      alignItems: 'center',
      padding: 20,
    },
    suggestionText: {
      color: '#A1A0A0',
      fontFamily: 'Montserrat-Regular',
      marginBottom: 10,
    },
    suggestionButtonsContainer: {
      flexDirection: 'row',
      justifyContent: 'center',
    },
    suggestionButton: {
      backgroundColor: '#9F3EFC',
      paddingVertical: 10,
      paddingHorizontal: 15,
      borderRadius: 20,
      marginHorizontal: 5,
    },
    suggestionButtonText: {
      color: '#FFF',
      fontFamily: 'Inter-Regular',
    },
});

export default MessagesScreen;
