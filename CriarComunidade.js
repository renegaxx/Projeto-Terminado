import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Image,
  FlatList,
  ScrollView,
  Dimensions,
  KeyboardAvoidingView,
  Platform,
  Animated,
} from 'react-native';

import { db } from './firebaseConfig';
import { getAuth } from 'firebase/auth';
import { collection, addDoc, getDoc, doc, getDocs } from 'firebase/firestore';

const { width } = Dimensions.get('window');

const CriarComunidade = ({ navigation }) => {
  const [nome, setNome] = useState('');
  const [descricao, setDescricao] = useState('');
  const [visibilidade, setVisibilidade] = useState('publico');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [gostos, setGostos] = useState([]);
  const [gostoSelecionado, setGostoSelecionado] = useState(null);
  const [imagemSelecionada, setImagemSelecionada] = useState(null); // Armazena o id da imagem selecionada
  const [animations, setAnimations] = useState({});
  const [nomeCriador, setNomeCriador] = useState('');
  const [avatarCriador, setAvatarCriador] = useState('');
  const scrollX = useRef(new Animated.Value(0)).current;
  const user = getAuth().currentUser;

  useEffect(() => {
    const fetchGostos = async () => {
      if (user) {
        try {
          const userDoc = doc(db, 'users', user.uid);
          const userSnap = await getDoc(userDoc);

          if (userSnap.exists()) {
            const userData = userSnap.data();
            setGostos(userData.gostos || []); // Carrega os gostos do usuário
            setNomeCriador(userData.nome || ''); // Carrega o nome do usuário
            setAvatarCriador(userData.avatar || ''); // Carrega o avatar do usuário
          }
        } catch (error) {
          console.error('Erro ao buscar gostos do usuário:', error);
        }
      }
    };

    fetchGostos();

    // Inicializa animações para cada item em gostos
    const newAnimations = gostos.reduce((acc, item) => {
      acc[item] = new Animated.Value(1);
      return acc;
    }, {});
    setAnimations(newAnimations);
  }, [user, gostos]);

  const handleGostoSelection = (gosto) => {
    setGostoSelecionado(gosto);

    // Aplica animação ao gosto selecionado
    Object.keys(animations).forEach((key) => {
      Animated.timing(animations[key], {
        toValue: key === gosto ? 1.2 : 1, // Aumenta a escala para o gosto selecionado
        duration: 300,
        useNativeDriver: true,
      }).start();
    });
  };

  const gerarCodigo = () => {
    const caracteres = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let codigo = '';
    for (let i = 0; i < 4; i++) {
      codigo += caracteres.charAt(Math.floor(Math.random() * caracteres.length));
    }
    return codigo;
  };

  // Função para verificar o número de participantes antes de criar a comunidade
  const verificarParticipantes = async () => {
    try {
      const comunidadesRef = collection(db, 'comunidades');
      const querySnapshot = await getDocs(comunidadesRef);
      let numParticipantes = 0;

      querySnapshot.forEach((doc) => {
        if (doc.data().participantes && doc.data().participantes.length >= 15) {
          numParticipantes += 1;
        }
      });

      if (numParticipantes >= 15) {
        return false; // Já existem 15 ou mais comunidades com 15 participantes
      }
      return true; // É possível criar a comunidade
    } catch (error) {
      console.error('Erro ao verificar participantes:', error);
      return false;
    }
  };

  const salvarComunidade = async () => {
    if (!nome || !descricao || !imagemSelecionada) { // Verifica se uma imagem foi selecionada
      setError('Preencha todos os campos e selecione uma imagem.');
      return;
    }
  
    setLoading(true);
    setError('');
  
    const podeCriarComunidade = await verificarParticipantes();
    if (!podeCriarComunidade) {
      setError('Limite de 15 participantes alcançado para esta comunidade.');
      setLoading(false);
      return;
    }
  
    try {
      const codigoPrivado = visibilidade === 'privado' ? gerarCodigo() : null;
  
      // Dados do usuário autenticado
      const userDoc = doc(db, 'users', user.uid);
      const userSnap = await getDoc(userDoc);
      let avatar = '';
      let fullName = '';
      let email = '';
  
      if (userSnap.exists()) {
        const userData = userSnap.data();
        avatar = userData.avatar || '';  // Pega o avatar
        fullName = userData.fullName || '';  // Pega o nome completo
        email = userData.email || '';  // Pega o email
      }
  
      // Salvar a comunidade com o id da imagem selecionada e dados do criador
      await addDoc(collection(db, 'comunidades'), {
        nome,
        descricao,
        visibilidade,
        codigoPrivado,
        criador: {
          id: user.uid,
          fullName: fullName,
          email: email,
          avatar: avatar,  // Salva o avatar também
        },
        criacao: new Date(),
        gosto: gostoSelecionado, // Apenas salva o gosto selecionado na comunidade
        imagemId: imagemSelecionada, // Adiciona o id da imagem selecionada
        participantes: [user.uid], // Adiciona o criador como participante inicial
      });
  
      setNome('');
      setDescricao('');
      setVisibilidade('publico');
      setImagemSelecionada(null); // Limpar a seleção da imagem após criar a comunidade
      navigation.goBack();
    } catch (e) {
      console.error('Erro ao salvar comunidade:', e);
      setError('Ocorreu um erro ao criar a comunidade. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };
  
  const imagens = [
    { id: 1, src: require('./assets/fotosComunidade/comunidade1.jpg') },
    { id: 2, src: require('./assets/fotosComunidade/comunidade2.jpg') },
    { id: 3, src: require('./assets/fotosComunidade/comunidade3.jpg') },
    { id: 4, src: require('./assets/fotosComunidade/comunidade4.jpg') },
    { id: 5, src: require('./assets/fotosComunidade/comunidade5.jpg') },
  ];

  const handlePress = (id) => {
    setImagemSelecionada(id); // Atualiza o estado com o id da imagem
  };

  const renderItem = ({ item }) => (
    <TouchableOpacity onPress={() => handlePress(item.id)}>
      <View style={styles.imageContainer}>
        <Image source={item.src} style={[styles.image, imagemSelecionada === item.id && styles.selectedImage]} />
      </View>
    </TouchableOpacity>
  );

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.title}>Criar</Text>
        <Text style={styles.title2}>Comunidade</Text>

        <TextInput
          style={styles.input}
          placeholder="Nome da Comunidade"
          placeholderTextColor="#aaa"
          value={nome}
          onChangeText={setNome}
        />

        <TextInput
          style={[styles.input2, styles.textArea]}
          placeholder="Descrição"
          placeholderTextColor="#aaa"
          value={descricao}
          onChangeText={setDescricao}
          multiline
        />
        
        <View style={styles.carouselContainer2}>
          <FlatList
            data={gostos}
            horizontal
            keyExtractor={(item) => item}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={[styles.gostoItem, gostoSelecionado === item && styles.selectedGosto]} 
                onPress={() => handleGostoSelection(item)} 
              >
                <Animated.Text
                  style={[styles.gostoText, { transform: [{ scale: animations[item] || 1 }] }]}
                >
                  {item}
                </Animated.Text>
              </TouchableOpacity>
            )}
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.carouselContainer}
          />
        </View>

        <FlatList
          data={imagens}
          renderItem={renderItem}
          keyExtractor={(item) => item.id.toString()}
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.carousel}
        />

        <View style={styles.radioContainer}>
          <TouchableOpacity
            style={styles.radioButton}
            onPress={() => setVisibilidade('publico')}
          >
            <View
              style={visibilidade === 'publico' ? styles.radioSelecionado : styles.radioNaoSelecionado}
            />
            <Text style={styles.radioTexto}>Público</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.radioButton}
            onPress={() => setVisibilidade('privado')}
          >
            <View
              style={visibilidade === 'privado' ? styles.radioSelecionado : styles.radioNaoSelecionado}
            />
            <Text style={styles.radioTexto}>Privado</Text>
          </TouchableOpacity>
        </View>

        {error ? <Text style={styles.errorText}>{error}</Text> : null}
      </ScrollView>

      <TouchableOpacity
        style={styles.saveButton}
        onPress={salvarComunidade}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.saveButtonText}>Salvar</Text>
        )}
      </TouchableOpacity>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
    paddingTop: 20,
    paddingHorizontal: 20,
    marginBottom: 100, // Adiciona um padding inferior para dar espaço para o botão
  },
  carouselContainer2: {
    width: '100%',
    height: 40,
    marginTop: 0,
  },
  contentList: {
    paddingHorizontal: 10,
  },
  gostoItem: {
    borderRadius: 10,
    borderWidth: 0.5,
    paddingHorizontal: 20,
    borderColor: '#fff',
    marginHorizontal: 5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  selectedGosto: {
    backgroundColor: '#fff',
    borderColor: '#fff',
  },
  gostoText: {
    color: '#fff',
    fontSize: 14,
  },
  selectedGostoText: {
    color: '#000',
  },
  title: {
    fontSize: 30,
    fontFamily: 'Manrope-Bold',
    color: '#fff',
    marginTop: 20,
  },
  title2: {
    fontSize: 30,
    fontFamily: 'Manrope-Bold',
    color: '#fff',
  },
  input: {
    height: 50,
    borderColor: '#fff',
    borderWidth: 1.5,
    borderRadius: 10,
    paddingHorizontal: 20,
    color: 'white',
    marginBottom: 20,
    backgroundColor: 'transparent',
    marginTop: 20,
  },
  input2: {
    height: 50,
    borderColor: '#fff',
    borderWidth: 1.5,
    borderRadius: 10,
    paddingHorizontal: 20,
    color: 'white',
    marginBottom: 20,
    backgroundColor: 'transparent',
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  carousel: {
    marginTop: 20,
  },
  imageContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    height: 340,
  },
  image: {
    width: 150,
    marginHorizontal: 20,
    height: 300,
    borderRadius: 10,
    resizeMode: 'cover',
  },
  radioContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 20,
  },
  radioButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 20,
  },
  radioSelecionado: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#fff',
    marginRight: 8,
  },
  radioNaoSelecionado: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#ccc',
    marginRight: 8,
  },
  radioTexto: {
    fontSize: 16,
    color: '#fff',
  },
  saveButton: {
    backgroundColor: '#9F3EFC',
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
    position: 'absolute', // Faz o botão ficar fixo na parte inferior
    bottom: 20, // Define a distância da parte inferior
    left: 20,
    right: 20,
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  errorText: {
    color: '#f00',
    textAlign: 'center',
    marginBottom: 15,
  },
});

export default CriarComunidade;
