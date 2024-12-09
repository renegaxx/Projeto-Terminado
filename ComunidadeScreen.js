import React, { useState, useEffect } from 'react';
import { View, Image, Text, StyleSheet, Modal, TouchableOpacity, FlatList, TextInput, Button, Alert, ImageBackground } from 'react-native';
import { db } from './firebaseConfig';
import { doc, getDoc, updateDoc, arrayUnion, arrayRemove } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';

const ComunidadeScreen = ({ route, navigation }) => {
    const { communityId } = route.params;
    const [community, setCommunity] = useState(null);
    const [modalVisible, setModalVisible] = useState(false);
    const [message, setMessage] = useState('');
    const [messages, setMessages] = useState([]);
    const [userJoined, setUserJoined] = useState(false);
    const [userNames, setUserNames] = useState({}); // Para armazenar os nomes dos usuários
    const auth = getAuth(); // Inicializando auth
    const currentUser = auth.currentUser ? auth.currentUser.displayName : null; // Agora pode ser acessado sem erro

    const communityImages = {
        '1': require('./assets/fotosComunidade/comunidade1.jpg'),
        '2': require('./assets/fotosComunidade/comunidade2.jpg'),
        '3': require('./assets/fotosComunidade/comunidade3.jpg'),
        '4': require('./assets/fotosComunidade/comunidade4.jpg'),
        '5': require('./assets/fotosComunidade/comunidade5.jpg'),
    };
    const avatarImages = {
        1: require('./assets/avatares/1.jpg'),
        2: require('./assets/avatares/2.jpg'),
        3: require('./assets/avatares/3.jpg'),
        4: require('./assets/avatares/4.jpg'),
        5: require('./assets/avatares/5.jpg'),
        6: require('./assets/avatares/6.jpg'),
        7: require('./assets/avatares/7.jpg'),
        8: require('./assets/avatares/8.jpg'),
        9: require('./assets/avatares/9.jpg'),
        10: require('./assets/avatares/10.jpg'),
        11: require('./assets/avatares/11.jpg'),
    };

    const fetchCommunityData = async () => {
        try {
            const communityRef = doc(db, 'comunidades', communityId);
            const communityDoc = await getDoc(communityRef);

            if (communityDoc.exists()) {
                setCommunity(communityDoc.data());
                const user = getAuth().currentUser;
                if (user && communityDoc.data().membros?.includes(user.uid)) {
                    setUserJoined(true);
                }
            }
        } catch (error) {
            console.error('Erro ao carregar comunidade:', error);
        }
    };

    const fetchUserNames = async (userIds) => {
        try {
            const names = {};
            for (const userId of userIds) {
                const userDoc = await getDoc(doc(db, 'users', userId)); // Assuming you have a 'users' collection
                if (userDoc.exists()) {
                    names[userId] = userDoc.data().username; // Assuming users have a 'username' field
                }
            }
            setUserNames(names);
        } catch (error) {
            console.error('Erro ao buscar nomes de usuários:', error);
        }
    };

    const fetchMessages = async () => {
        const communityRef = doc(db, 'comunidades', communityId);
        const communityDoc = await getDoc(communityRef);
        if (communityDoc.exists()) {
            const messages = communityDoc.data().mensagens || [];
            setMessages(messages);

            // Extrair todos os userIds das mensagens
            const userIds = messages.map(msg => msg.userId);
            fetchUserNames([...new Set(userIds)]); // Remover IDs duplicados antes de buscar os nomes
        }
    };

    const joinCommunity = async () => {
        const user = getAuth().currentUser;
        if (user) {
            try {
                const communityRef = doc(db, 'comunidades', communityId);
                await updateDoc(communityRef, {
                    membros: arrayUnion(user.uid),
                });
                setUserJoined(true);
                setModalVisible(false);
            } catch (error) {
                console.error('Erro ao adicionar usuário à comunidade:', error);
                Alert.alert('Erro', 'Não foi possível entrar na comunidade.');
            }
        }
    };

    const leaveCommunity = async () => {
        const user = getAuth().currentUser;
        if (user) {
            try {
                const communityRef = doc(db, 'comunidades', communityId);
                await updateDoc(communityRef, {
                    membros: arrayRemove(user.uid), // Remove o usuário da lista de membros
                });
                setUserJoined(false); // Atualiza o estado para indicar que o usuário não é mais membro
                Alert.alert('Sucesso', 'Você saiu da comunidade com sucesso.');
            } catch (error) {
                console.error('Erro ao sair da comunidade:', error);
                Alert.alert('Erro', 'Não foi possível sair da comunidade.');
            }
        }
    };

    const sendMessage = async () => {
        const user = getAuth().currentUser;
        if (user && message.trim() !== '') {
            const userRef = doc(db, 'users', user.uid); // Referência ao documento do usuário
            const userDoc = await getDoc(userRef);

            if (userDoc.exists()) {
                const { username, avatar } = userDoc.data(); // Obtendo o username e avatar do usuário

                const newMessage = {
                    userId: user.uid,
                    username: username,  // Adicionando o username
                    avatar: avatar,      // Adicionando o avatar
                    message,
                    timestamp: new Date(),
                };

                try {
                    const communityRef = doc(db, 'comunidades', communityId);
                    await updateDoc(communityRef, {
                        mensagens: arrayUnion(newMessage),
                    });
                    setMessages([...messages, newMessage]);
                    setMessage('');
                } catch (error) {
                    console.error('Erro ao enviar mensagem:', error);
                    Alert.alert('Erro', 'Não foi possível enviar a mensagem.');
                }
            }
        }
    };

    useEffect(() => {
        fetchCommunityData();
        fetchMessages();
    }, [communityId]);

    return (
        <View style={styles.container}>
            {!userJoined && community ? (
                <ImageBackground
                    source={communityImages[community.imagemId] || require('./assets/fotosComunidade/comunidade1.jpg')}
                    style={styles.communityBackground}
                    resizeMode="cover"
                >
                    <ImageBackground
                        source={require('./assets/cinzinhaBack2.png')}
                        style={styles.communityBackground2}
                        resizeMode="cover"
                    >
                        <Modal
                            visible={modalVisible}
                            animationType="slide"
                            transparent={true}
                            onRequestClose={() => setModalVisible(false)}
                        >
                            <View style={styles.modalOverlay}>
                                <View style={styles.modalContent}>
                                    <Text style={styles.modalTitle}>Participar da Comunidade</Text>
                                    <Text style={styles.modalDescription}>Deseja entrar na comunidade?</Text>
                                    <TouchableOpacity style={styles.modalButton} onPress={joinCommunity}>
                                        <Text style={styles.buttonText}>Participar</Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity
                                        style={[styles.modalButton, { backgroundColor: 'transparent', borderWidth: 0.5, borderColor: '#fff' }]}
                                        onPress={() => setModalVisible(false)}
                                    >
                                        <Text style={[styles.buttonText, { color: '#fff' }]}>Cancelar</Text>
                                    </TouchableOpacity>
                                </View>
                            </View>
                        </Modal>
                        <View style={styles.containerInfo}>
                            <Text style={styles.communityName}>{community.nome}</Text>
                            <Text style={styles.communityDescription}>{community.descricao}</Text>
                        </View>
                        <View style={styles.botoes}>
                            <TouchableOpacity style={styles.voltarButton} onPress={() => navigation.goBack()}>
                                <Text style={styles.voltarButtonText}>Voltar</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={styles.joinButton}
                                onPress={() => setModalVisible(true)}
                            >
                                <Text style={styles.buttonText}>Próximo</Text>
                            </TouchableOpacity>
                        </View>
                    </ImageBackground>
                </ImageBackground>
            ) : (
                <View style={styles.chatContainer}>
                    <View style={styles.topBar}>
                        <TouchableOpacity onPress={() => navigation.goBack()}>
                            <Image source={require('./assets/voltarImg.png')} style={styles.voltarImg} />
                        </TouchableOpacity>
                        <Text style={styles.userNameText}>{community ? community.nome : 'Carregando...'}</Text>
                        <TouchableOpacity
                            style={styles.leaveButton}
                            onPress={leaveCommunity} // Chama a função para sair da comunidade
                        >
                            <Image source={require('./assets/sairImg.png')} style={styles.configIcon} />
                        </TouchableOpacity>
                    </View>
                    <FlatList
    data={messages}
    renderItem={({ item }) => (
        <View
            style={[
                styles.messageItem,
                item.userId === getAuth().currentUser?.uid ? styles.messageRight : null,  // Verifica se o userId da mensagem é igual ao uid do usuário atual
            ]}
        >
            <View style={styles.messageHeader}>
                {/* Exibir o avatar com base no valor de item.avatar */}
                <Image source={avatarImages[item.avatar]} style={styles.avatar} />
                <Text style={styles.username}>{item.username}</Text>
            </View>
            <Text style={styles.messageText}>{item.message}</Text>
        </View>
    )}
    keyExtractor={(item, index) => index.toString()}
/>
                    <View style={styles.inputContainer}>
                        <TextInput
                            style={styles.input}
                            value={message}
                            onChangeText={setMessage}
                            placeholder="Digite uma mensagem..."
                            placeholderTextColor="#777"
                        />
                        <TouchableOpacity style={styles.sendButton} onPress={sendMessage}>
                            <Image source={require('./assets/icons/enviarImg.png')} style={styles.sendIcon} />
                        </TouchableOpacity>
                    </View>
                </View>
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#1A1A1A',
    },
    topBar: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        marginTop: 30,
        marginBottom: 30,
        backgroundColor: '#1A1A1A',
    },
    userNameText: {
        fontFamily: 'Raleway-SemiBold',
        color: 'white',
        textAlign: 'center',
        flex: 1,
        color: '#fff'
    },
    voltarImg: { width: 24, height: 24 },
    configIcon: { width: 24, height: 24, resizeMode: 'contain' },
    sendButton: {
        backgroundColor: '#9F3EFC',
        borderRadius: 30,
        padding: 11,
        marginLeft: 10,
        justifyContent: 'center',
    },
    sendIcon: { width: 24, height: 24, resizeMode: 'cover' },
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
    containerInfo: {
        flex: 1, // Ocupar toda a tela     
    },
    communityBackground: {
        height: '100%',
        justifyContent: 'center',
        alignItems: 'center',
        resizeMode: 'cover',
    },
    communityBackground2: {
        height: '100%',
        justifyContent: 'center',
        alignItems: 'center',
        resizeMode: 'cover',
        width: '100%'
    },
    communityName: {
        fontSize: 35,
        fontFamily: 'Manrope-Bold',
        color: '#fff',
        marginTop: 35,
        marginTop: 'auto',
        textAlign: 'center'
    },
    communityDescription: {
        fontSize: 14,
        color: '#a1a1a1',
        marginBottom: 20,
        textAlign: 'center',
        fontFamily: 'Raleway-Regular'
    },
    joinButton: {
        backgroundColor: '#fff',
        paddingHorizontal: 15,
        paddingVertical: 10,
        borderRadius: 20,
        alignItems: 'center',
        width: 150,
        marginLeft: 5
    },
    botoes: {
        flexDirection: 'row',
        alignItems: 'center',
        marginHorizontal: 10,
        justifyContent: 'center',
        marginTop: 15,
    },
    voltarButton: {
        backgroundColor: 'transparent',
        paddingHorizontal: 15,
        paddingVertical: 10,
        borderRadius: 20,
        alignItems: 'center',
        width: 150,
        borderWidth: 0.5,
        borderColor: '#fff',
        marginRight: 10
    },
    voltarButtonText: {
        color: '#fff',
        fontFamily: 'Raleway-Regular',
        fontSize: 14
    },
    buttonText: {
        fontSize: 14,
        fontFamily: 'Raleway-Regular',
        color: '#000'
    },
    modalOverlay: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(0, 0, 0, 0.7)',  // Opacidade ajustada para visibilidade
    },
    modalContent: {
        backgroundColor: '#000',
        padding: 20,
        borderRadius: 10,
        alignItems: 'center',
        width: '80%',
        borderRadius: 20,
    },
    modalTitle: {
        fontSize: 25,
        fontFamily: 'Manrope-Bold',
        marginBottom: 10,
        color: '#fff'
    },
    modalDescription: {
        fontSize: 16,
        marginBottom: 20,
        color: '#a1a1a1'
    },
    modalButton: {
        backgroundColor: '#fff',
        padding: 10,
        borderRadius: 15,
        marginVertical: 5,
        width: '100%',
        alignItems: 'center',
    },
    chatContainer: {
        flex: 1,
        padding: 10,
    },
    messageItem: {
        marginBottom: 10,
    },
    messageHeader: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    avatar: {
        width: 32,
        height: 32,
        borderRadius: 20,
        marginRight: 10,
    },
    username: {
        fontSize: 16,
        fontFamily: 'Manrope-Bold',
        color: 'white'
    },
    messageText: {
        fontSize: 14,
        fontFamily: 'Raleway-SemiBold',
        color: '#a1a1a1',
    },
    messageInput: {
        height: 40,
        borderWidth: 1,
        borderColor: '#ccc',
        borderRadius: 5,
        paddingHorizontal: 10,
        marginBottom: 10,
    },
    messageRight: {
        alignSelf: 'flex-end', // Alinha a mensagem à direita

        borderRadius: 10,
        padding: 10,
        marginRight: 10,
    },
});

export default ComunidadeScreen;
