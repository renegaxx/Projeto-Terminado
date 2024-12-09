import React, { useState, useEffect, useRef } from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    StyleSheet,
    FlatList,
    Image,
    ActivityIndicator,
    Animated,
    Dimensions,
    Alert, // Para mostrar o alerta de confirmação
} from 'react-native';
import { Easing } from 'react-native';

import {
    getFirestore,
    collection,
    getDocs,
    doc,
    getDoc,
    deleteDoc,
    updateDoc,
    arrayUnion,
    arrayRemove,
    query,
    where,
} from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { useNavigation } from '@react-navigation/native';

const { width } = Dimensions.get('window');

const UsuariosConversas = () => {
    const navigation = useNavigation();
    const [users, setUsers] = useState([]);
    const [unaddedUsers, setUnaddedUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [favorites, setFavorites] = useState([]);
    const [trash, setTrash] = useState([]); // Estado para as conversas na lixeira
    const [activeTab, setActiveTab] = useState(0); // Index da aba ativa
    const [unreadMessages, setUnreadMessages] = useState({});

    const db = getFirestore();
    const auth = getAuth();

    // Animation state
    const translateXAnim = useRef(new Animated.Value(0)).current; // Para animação horizontal

    const tabs = ['Adicionados', 'Favoritos', 'Não Adicionados', 'Lixeira']; // Nova aba Lixeira

    const fetchUsers = async () => {
        const currentUser = auth.currentUser;
        if (!currentUser) return;
    
        try {
            setLoading(true);
    
            const userDocRef = doc(db, 'users', currentUser.uid);
            const userDoc = await getDoc(userDocRef);
            const addedUsers = userDoc.exists() ? userDoc.data().addedUsers || [] : [];
            setUsers(addedUsers);
    
            const messagesQuery = query(
                collection(db, 'messages'),
                where('recipientId', '==', currentUser.uid)
            );
            const messagesSnapshot = await getDocs(messagesQuery);
            const senders = new Set();
    
            const unreadMessagesCount = {}; // Para armazenar a quantidade de mensagens não lidas
    
            messagesSnapshot.forEach((doc) => {
                const data = doc.data();
                if (data.senderId && !addedUsers.some((u) => u.id === data.senderId)) {
                    senders.add(data.senderId);
                }
                // Verificar se a mensagem não foi lida
                if (data.read === false) {
                    unreadMessagesCount[data.senderId] = (unreadMessagesCount[data.senderId] || 0) + 1;
                }
            });
    
            setUnreadMessages(unreadMessagesCount);
    
            const unaddedUsersList = [];
            for (const senderId of senders) {
                const senderDocRef = doc(db, 'users', senderId);
                const senderDoc = await getDoc(senderDocRef);
                if (senderDoc.exists()) {
                    unaddedUsersList.push({
                        id: senderId,
                        ...senderDoc.data(),
                    });
                }
            }
    
            setUnaddedUsers(unaddedUsersList);
            const favoritesData = userDoc.exists() ? userDoc.data().favorites || [] : [];
            setFavorites(favoritesData);
            const trashData = userDoc.exists() ? userDoc.data().trash || [] : []; // Lixeira
            setTrash(trashData);
        } catch (error) {
            console.error('Erro ao carregar usuários:', error);
        } finally {
            setLoading(false);
        }
    };
    

    useEffect(() => {
        fetchUsers();
    }, []);

    const switchTab = (tabIndex) => {
        // Animação para mudar a aba e mover a imagem
        Animated.timing(translateXAnim, {
            toValue: -width * tabIndex, // Movimenta a posição horizontal com base na aba
            duration: 1000, // Tempo de transição mais longo
            easing: Easing.out(Easing.exp), // Transição mais suave
            useNativeDriver: true,
        }).start();
        setActiveTab(tabIndex);
    };

    const renderTabItem = ({ item, index }) => (
        <TouchableOpacity
            style={[styles.tabButton, activeTab === index && styles.activeTab]}
            onPress={() => switchTab(index)}
        >
            <Text style={styles.tabButtonText}>{item}</Text>
        </TouchableOpacity>
    );

    const renderUserItem = ({ item }) => {
        const isFavorite = favorites.includes(item.id);
        const unreadCount = unreadMessages[item.id] || 0; // Pegando o número de mensagens não lidas para o usuário
    
        return (
            <TouchableOpacity
                onPress={() => navigation.navigate('MessagesScreen', { userId: item.id })}
                style={styles.userItem}
            >
                <Image source={require('./assets/mcigPerfil.jpg')} style={styles.perfilImage} />
                <View style={styles.userInfo}>
                    <Text style={styles.userName}>{item.username || 'Usuário desconhecido'}</Text>
                    <Text style={styles.userLastMessage}>Aperte para Conversar</Text>
                    {unreadCount > 0 && (
                        <View style={styles.unreadMessageBadge}>
                            <Text style={styles.unreadMessageText}>{unreadCount}</Text>
                        </View>
                    )}
                </View>
                {(activeTab === 0 || activeTab === 1) && (  // As abas 'Adicionados' e 'Favoritos' têm a estrela
                    <TouchableOpacity
                        onPress={() => toggleFavorite(item.id)}
                        style={styles.favoriteButton}
                    >
                        <Text style={{ color: isFavorite ? '#FFD700' : '#A1A0A0' }}>★</Text>
                    </TouchableOpacity>
                )}
                {activeTab === 3 && ( // Mostrar ícone de lixeira apenas na aba Lixeira
                    <TouchableOpacity
                        onPress={() => handleDeleteFromTrash(item.id)}
                        style={styles.trashButton}
                    >
                        <Image
                            source={require('./assets/icons/lixeiraImg.png')} // Certifique-se de que o caminho esteja correto
                            style={[styles.trashIcon, { tintColor: '#9F3EFC' }]} // Cor do ícone
                        />
                    </TouchableOpacity>
                )}
            </TouchableOpacity>
        );
    };
    


    const handleDeleteFromTrash = (userId) => {
        // Confirmar exclusão permanente
        Alert.alert(
            "Confirmar exclusão",
            "Você realmente deseja excluir esta conversa permanentemente?",
            [
                {
                    text: "Cancelar",
                    style: "cancel",
                },
                {
                    text: "Excluir",
                    onPress: () => deleteFromFirestore(userId),
                },
            ]
        );
    };

    const deleteFromFirestore = async (userId) => {
        const currentUser = auth.currentUser;
        if (!currentUser) return;

        const userDocRef = doc(db, 'users', currentUser.uid);
        const userDoc = await getDoc(userDocRef);
        if (!userDoc.exists()) return;

        const userData = userDoc.data();
        const updatedTrash = userData.trash.filter((item) => item.id !== userId); // Remover da lixeira
        setTrash(updatedTrash);

        // Excluir conversa do Firestore
        const messageRef = doc(db, 'messages', userId);
        await deleteDoc(messageRef); // Excluir documento da mensagem

        // Atualizar a lixeira no Firestore
        await updateDoc(userDocRef, {
            trash: updatedTrash,
        });
    };
    const toggleFavorite = async (userId) => {
        const currentUser = auth.currentUser;
        if (!currentUser) return;

        const userDocRef = doc(db, 'users', currentUser.uid);

        try {
            const userDoc = await getDoc(userDocRef);
            if (userDoc.exists()) {
                const userData = userDoc.data();
                const updatedFavorites = userData.favorites || [];

                // Verifica se o usuário já está nos favoritos
                if (updatedFavorites.includes(userId)) {
                    // Remove do favorito
                    updatedFavorites.splice(updatedFavorites.indexOf(userId), 1);
                } else {
                    // Adiciona aos favoritos
                    updatedFavorites.push(userId);
                }

                // Atualiza a lista de favoritos no Firestore
                await updateDoc(userDocRef, { favorites: updatedFavorites });

                // Atualiza o estado local
                setFavorites(updatedFavorites);
            }
        } catch (error) {
            console.error("Erro ao atualizar favoritos: ", error);
        }
    };

    return (
        <View style={styles.container}>
            <View style={styles.cimaBackground}>
                <Animated.Image
                    source={require('./assets/black_4 2.png')}
                    style={[
                        styles.imagemBackground,
                        {
                            transform: [
                                {
                                    translateX: translateXAnim.interpolate({
                                        inputRange: [-width * tabs.length, 30],
                                        outputRange: [width * tabs.length * 0.4, 0],
                                    }),
                                },
                            ],
                        },
                    ]}
                />
            </View>
            <Text style={styles.headerText}>Conversas</Text>

            <View style={styles.carouselContainer}>
                <FlatList
                    data={tabs}
                    horizontal
                    keyExtractor={(item, index) => index.toString()}
                    renderItem={renderTabItem}
                    showsHorizontalScrollIndicator={false}
                />
            </View>

            <Animated.View
                style={{
                    flex: 1,
                    flexDirection: 'row',
                    transform: [{ translateX: translateXAnim }],
                    width: width * tabs.length,
                }}
            >
                {tabs.map((tab, index) => (
                    <View
                        key={index}
                        style={{ width, padding: 10, backgroundColor: '#000' }}
                    >
                        {loading ? (
                            <ActivityIndicator size="large" color="#9F3EFC" />
                        ) : (
                            <FlatList
                                data={
                                    index === 0
                                        ? users // Aba "Adicionados"
                                        : index === 1
                                            ? users.filter((user) =>
                                                favorites.includes(user.id) // Aba "Favoritos"
                                            )
                                            : unaddedUsers // Aba "Não Adicionados"
                                }
                                keyExtractor={(item) => item.id}
                                renderItem={renderUserItem}
                                ListEmptyComponent={
                                    <Text style={styles.emptyText}>
                                        Nenhuma conversa encontrada.
                                    </Text>
                                }
                            />
                        )}
                    </View>
                ))}
            </Animated.View>

        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#000',
    },
    imagemBackground: {
        width: 1200,
        height: 90,
        position: 'absolute',
        right: 5,
    },
    headerText: {
        fontSize: 16,
        fontFamily: 'Raleway-SemiBold',
        color: 'white',
        textAlign: 'center',
        paddingTop: 50,
    },
    carouselContainer: {
        width: '100%',
        height: 40,
        marginTop: 20,
    },
    tabButton: {
        paddingHorizontal: 20,
        paddingVertical: 10,
        borderRadius: 10,
        backgroundColor: 'transparent',
        borderWidth: 0.2,
        borderColor: 'white',
        marginHorizontal: 5,
    },
    activeTab: {
        backgroundColor: '#9F3EFC',
        borderColor: '#9F3EFC',
    },
    tabButtonText: {
        color: '#fff',
        fontSize: 14,
        fontFamily: 'Raleway-SemiBold',
    },
    userItem: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 15,
        borderBottomWidth: 1,
        borderBottomColor: '#222',
    },
    perfilImage: {
        width: 60,
        height: 60,
        borderRadius: 30,
        marginRight: 15,
    },
    userInfo: {
        flex: 1,
    },
    userName: {
        fontSize: 16,
        color: 'white',
    },
    userLastMessage: {
        fontSize: 14,
        color: '#A1A0A0',
    },
    favoriteButton: {
        marginLeft: 10,
    },
    trashButton: {
        marginLeft: 10,
        justifyContent: 'center',
        alignItems: 'center',
    },
    trashIcon: {
        width: 24,  // Tamanho ajustado para o ícone
        height: 24,
    },
    emptyText: {
        color: '#A1A0A0',
        textAlign: 'center',
        marginTop: 20,
    },
    unreadMessageBadge: {
        position: 'absolute',
        top: 0,
        right: 0,
        backgroundColor: '#FF3B30',
        borderRadius: 10,
        paddingHorizontal: 6,
        paddingVertical: 2,
    },
    unreadMessageText: {
        color: 'white',
        fontSize: 12,
        fontWeight: 'bold',
    },
    
});

export default UsuariosConversas;
