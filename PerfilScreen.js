import React, { useState, useEffect } from 'react';
import { View, Text, Image, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { launchCamera, launchImageLibrary } from 'react-native-image-picker';
import { getAuth, signOut } from 'firebase/auth';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { db, storage } from './firebaseConfig'; // Certifique-se de que o caminho está correto
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage'; // Importação do Firebase Storage
import { useNavigation } from '@react-navigation/native';

const PerfilScreen = ({ route }) => {
  const { fullName, username, email, userId, profilePicture } = route.params;
  const [imageUri, setImageUri] = useState(profilePicture || null);
  const [role, setRole] = useState('');
  const [plano, setPlano] = useState(null);
  const [loading, setLoading] = useState(true);
  const auth = getAuth();
  const navigation = useNavigation();

  useEffect(() => {
    const fetchUserRoleAndPlano = async () => {
      const userRef = doc(db, 'users', userId);
      try {
        const docSnap = await getDoc(userRef);
        if (docSnap.exists()) {
          const userData = docSnap.data();
          if (userData.plano) {
            setPlano(userData.plano);
          }
          if (userData.criador) {
            setRole('Criador');
          } else if (userData.status === 'colaborador') {
            setRole('Colaborador');
          } else {
            setRole('Não Definido');
          }
        }
      } catch (error) {
        console.error('Erro ao buscar o status de usuário:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchUserRoleAndPlano();
  }, [userId]);

  const handleImagePick = async () => {
    const options = {
      mediaType: 'photo',
      includeBase64: true,
      quality: 1,
    };

    Alert.alert('Selecionar Imagem', 'Escolha uma opção:', [
      {
        text: 'Câmera',
        onPress: async () => {
          const result = await launchCamera(options);
          if (result.assets) {
            const image = result.assets[0].uri;
            setImageUri(image);
            await updateProfilePicture(image);
          }
        },
      },
      {
        text: 'Galeria',
        onPress: async () => {
          const result = await launchImageLibrary(options);
          if (result.assets) {
            const image = result.assets[0].uri;
            setImageUri(image);
            await updateProfilePicture(image);
          }
        },
      },
      { text: 'Cancelar', style: 'cancel' },
    ]);
  };

  const uploadImageToFirebase = async (uri) => {
    const storageRef = ref(storage, `profile_pictures/${userId}`);
    const response = await fetch(uri);
    const blob = await response.blob();
    await uploadBytes(storageRef, blob);
    const imageUrl = await getDownloadURL(storageRef);
    return imageUrl;
  };

  const updateProfilePicture = async (imageUri) => {
    try {
      const imageUrl = await uploadImageToFirebase(imageUri); // Faz o upload da imagem e pega a URL
      const userRef = doc(db, 'users', userId);
      await updateDoc(userRef, { profilePicture: imageUrl });
      setImageUri(imageUrl); // Atualiza a imagem no estado local
      Alert.alert('Sucesso', 'Foto de perfil atualizada!');
    } catch (error) {
      console.error('Erro ao atualizar a foto de perfil:', error);
      Alert.alert('Erro', 'Não foi possível atualizar a foto de perfil.');
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      Alert.alert('Logout', 'Você foi desconectado com sucesso!');
      navigation.navigate('Login');
    } catch (error) {
      console.error('Erro ao realizar logout: ', error);
      Alert.alert('Erro', 'Ocorreu um erro ao tentar sair.');
    }
  };

  const getSeloImage = (plano) => {
    if (plano === 'básico') {
      return require('./assets/selos/PlanoBasico.png');
    } else if (plano === 'avançado') {
      return require('./assets/selos/PlanoAvancado.png');
    } else if (plano === 'premium') {
      return require('./assets/selos/PlanoPremium.png');
    }
    return null;
  };

  return (
    <View style={styles.container}>
      <View style={styles.topBar}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Image source={require('./assets/voltarImg.png')} style={styles.voltarImg} />
        </TouchableOpacity>
        <Text style={styles.userNameText}>Perfil</Text>
        <Image source={require('./assets/configImg.png')} style={styles.configIcon} />
      </View>

      <View style={styles.botoes}>
        <TouchableOpacity onPress={handleImagePick}>
          <Image
            source={imageUri ? { uri: imageUri } : require('./assets/mcigPerfil.jpg')}
            style={styles.perfilImage}
          />
        </TouchableOpacity>

        <View style={styles.nameContainer}>
          <Text style={styles.name}>{fullName}</Text>
          {plano && <Image source={getSeloImage(plano)} style={styles.seloImage} />}
        </View>

        <Text style={styles.username}>@{username}</Text>
        <Text style={styles.email}>{email}</Text>

        <Text style={styles.roleText}>
          {role ? `Status: ${role}` : 'Status: Não Definido'}
        </Text>

        <TouchableOpacity onPress={handleLogout} style={styles.logoutButton}>
          <Text style={styles.logoutButtonText}>Sair</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
    paddingTop: 35,
    alignItems: 'center',
    justifyContent: 'flex-start',
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 10,
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
  perfilImage: {
    width: 100,
    height: 100,
    borderRadius: 100,
    marginBottom: 20,
  },
  name: {
    fontSize: 24,
    color: 'white',
    marginBottom: 10,
    fontFamily: 'Raleway-Bold',
  },
  username: {
    fontSize: 18,
    color: 'gray',
    marginBottom: 10,
    fontFamily: 'Poppins-Regular',
  },
  email: {
    fontSize: 16,
    color: 'white',
    fontFamily: 'sans-serif',
  },
  logoutButton: {
    backgroundColor: '#f44336',
    width: 240,
    height: 50,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 10,
    marginTop: 20,
  },
  logoutButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  botoes: {
    alignItems: 'center',
    paddingHorizontal: 30,
    marginBottom: 20,
  },
  roleText: {
    fontSize: 16,
    color: 'white',
    marginTop: 10,
    fontFamily: 'sans-serif',
  },
  nameContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  seloImage: {
    width: 20,
    height: 20,
    marginLeft: 10,
  },
});

export default PerfilScreen;
