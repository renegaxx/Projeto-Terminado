import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList, ActivityIndicator, ImageBackground, Image } from 'react-native';
import { getAuth } from 'firebase/auth';
import { db } from './firebaseConfig';
import { collection, query, where, getDocs, doc, getDoc } from 'firebase/firestore';

const NetworkingScreen = ({ navigation }) => {
  const [gostos, setGostos] = useState([]);
  const [loading, setLoading] = useState(false); // Exclusivo para carregar gostos
  const [contentLoading, setContentLoading] = useState(false); // Exclusivo para carregar conteúdo
  const [selectedTab, setSelectedTab] = useState('');
  const [selectedGosto, setSelectedGosto] = useState('');
  const [content, setContent] = useState([]);
  const [userPlan, setUserPlan] = useState(''); // Estado para armazenar o plano do usuário
  const [error, setError] = useState(''); // Estado para lidar com erros

  const [comunidades, setComunidades] = useState([]);

  useEffect(() => {
    const fetchComunidades = async () => {
      try {
        const comunidadesRef = collection(db, 'comunidades');
        const querySnapshot = await getDocs(comunidadesRef);

        const comunidadesData = await Promise.all(
          querySnapshot.docs.map(async (document) => {
            const data = document.data();
            let avatarUrl = null;
          })
        );

        setComunidades(comunidadesData);
      } catch (error) {
        console.error('Erro ao carregar comunidades:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchComunidades();
  }, []);


  const communityImages = {
    '1': require('./assets/fotosComunidade/comunidade1.jpg'),
    '2': require('./assets/fotosComunidade/comunidade2.jpg'),
    '3': require('./assets/fotosComunidade/comunidade3.jpg'),
    '4': require('./assets/fotosComunidade/comunidade4.jpg'),
    '5': require('./assets/fotosComunidade/comunidade5.jpg'),

  };
  const mapComuById = (id) => {
    return communityImages[id] || null; // Retorna null se o ID não for encontrado
  };

  const eventsData = [
    { id: '1', image: require('./assets/fotosEventos/evento1.jpg') },
    { id: '2', image: require('./assets/fotosEventos/evento2.jpg') },
    { id: '3', image: require('./assets/fotosEventos/evento3.jpg') },
    { id: '4', image: require('./assets/fotosEventos/evento4.jpg') },
    { id: '6', image: require('./assets/fotosEventos/evento6.jpg') },
    { id: '7', image: require('./assets/fotosEventos/evento7.jpg') },
    { id: '8', image: require('./assets/fotosEventos/evento8.jpg') },
    { id: '9', image: require('./assets/fotosEventos/evento9.jpg') },
    { id: '10', image: require('./assets/fotosEventos/evento10.jpg') },
  ];
  const mapImageById = (id) => {
    const event = eventsData.find((e) => e.id === id);
    return event ? event.image : null; // Retorna a imagem ou null caso não encontre
  };



  const formatData = (data) => {
    if (typeof data === 'string') {
      // Dividir a data no formato 'DD-MM-YYYY'
      const partes = data.split('-');
      if (partes.length === 3) {
        const dia = partes[0]; // Dia
        const mes = partes[1]; // Mês
        const ano = partes[2]; // Ano

        // Array de meses em português
        const meses = [
          'Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun',
          'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'
        ];

        // Retorna o dia e o mês
        return { dia, mes: meses[parseInt(mes) - 1] };
      }
    }
    return { dia: 'Data inválida', mes: '' }; // Caso a string não tenha o formato esperado
  };

  // Busca os gostos do usuário
  const fetchUserGostos = async () => {
    setLoading(true); // Carregando gostos
    const user = getAuth().currentUser;

    if (user) {
      try {
        const userDoc = doc(db, 'users', user.uid);
        const userSnap = await getDoc(userDoc);

        if (userSnap.exists()) {
          const userData = userSnap.data();
          setGostos(userData.gostos || []);
          setUserPlan(userData.plano || ''); // Armazena o plano do usuário
        } else {
          console.log('Usuário não encontrado.');
        }
      } catch (error) {
        console.error('Erro ao buscar gostos do usuário:', error);
        setError('Erro ao carregar gostos. Tente novamente.');
      } finally {
        setLoading(false); // Finaliza o carregamento dos gostos
      }
    } else {
      console.log('Usuário não autenticado.');
      setLoading(false);
    }
  };

  const fetchContentByTab = async (tab, gosto) => {
    if (!tab) return;
    setContentLoading(true);
    setError(''); // Reseta o erro ao iniciar a nova busca

    try {
      const collectionName = tab === 'Comunidades' ? 'comunidades' : 'eventos';
      const filters = gosto
        ? [where('gosto', '==', gosto)]  // Se um gosto específico for selecionado
        : gostos.length > 0
          ? [where('gosto', 'in', gostos)] // Caso contrário, use o filtro 'in'
          : [];  // Se 'gostos' estiver vazio, não use o filtro 'in'

      if (filters.length === 0) {
        setContentLoading(false);
        setContent([]);
        return;
      }

      const contentQuery = query(collection(db, collectionName), ...filters);
      const querySnapshot = await getDocs(contentQuery);

      const fetchedContent = [];
      querySnapshot.forEach((doc) => {
        fetchedContent.push({ id: doc.id, ...doc.data() });
      });

      setContent(fetchedContent);
    } catch (error) {
      console.error(`Erro ao buscar ${tab}:`, error);
      setError(`Erro ao carregar conteúdo para ${tab}. Tente novamente.`);
    } finally {
      setContentLoading(false);
    }
  };

  useEffect(() => {
    fetchUserGostos();
  }, []);

  useEffect(() => {
    if (selectedTab) {
      fetchContentByTab(selectedTab, selectedGosto);
    }
  }, [selectedTab, selectedGosto, gostos]);

  const handleGostoClick = (gosto) => {
    setSelectedGosto(gosto === selectedGosto ? '' : gosto); // Alterna entre selecionar/desselecionar gosto
  };

  const renderGostoItem = ({ item }) => (
    <TouchableOpacity
      style={[
        styles.gostoItem,
        selectedGosto === item && styles.selectedGosto, // Estilo quando selecionado
      ]}
      onPress={() => handleGostoClick(item)} // Alterna entre selecionar e desmarcar
    >
      <Text
        style={[
          styles.gostoText,
          selectedGosto === item && styles.selectedGostoText, // Estilo do texto quando selecionado
        ]}
      >
        {selectedGosto === item ? `${item}` : item} {/* Texto personalizado */}
      </Text>
    </TouchableOpacity>
  );

  const renderContentItem = ({ item }) => {
    const backgroundImage = mapImageById(item.imagemSelecionada); // Agora dentro do escopo correto

    // Verifica se a aba selecionada é 'Eventos' ou 'Comunidades'
    const isEventoTab = selectedTab === 'Eventos';

    // Estilo condicional dependendo da aba
    const itemStyle = isEventoTab ? styles.contentItem : styles.contentItemComunidade;


    // Verifica se a aba selecionada é 'Comunidades'
    if (selectedTab === 'Comunidades') {
      return (
        <TouchableOpacity
          style={styles.overlay} // Sobreposição para os textos ficarem visíveis
          onPress={() => navigation.navigate('ComunidadeScreen', { communityId: item.id })} // Navegar para a tela de Comunidade
        >
          <ImageBackground
            source={mapComuById(item.imagemId)}
            style={itemStyle}
            imageStyle={styles.backgroundImage2}
          >


            <Text style={styles.contentTitle}>{item.titulo || item.nome}</Text>
            {item.gosto && (
              <Text style={styles.gostoText}>{item.gosto}</Text>
            )}

            {/* Descrição, caso deseje */}
            {/* <Text style={styles.contentDescription}>{item.descricao}</Text> */}
          </ImageBackground>
        </TouchableOpacity>
      );
    }

    // Return para a aba "Eventos" permanece inalterado
    return (
      <TouchableOpacity
        style={styles.overlay} // Sobreposição para os textos ficarem visíveis
        onPress={() => navigation.navigate('EventoScreen', { eventId: item.id })} // Navegar para a próxima tela de evento
      >
        <ImageBackground
          source={backgroundImage}
          style={itemStyle} // Aplica o estilo para a aba Eventos
          imageStyle={styles.backgroundImage}
        >
          <View style={styles.direitaContentItem}>
            <Text style={styles.cimaContentDate}>
              {item.dataEvento ? formatData(item.dataEvento).dia : 'Data não disponível'}
            </Text>
            <Text style={styles.baixoContentDate}>
              {item.dataEvento ? formatData(item.dataEvento).mes : ''}
            </Text>
          </View>

          <Text style={styles.contentTitle}>{item.titulo || item.nome}</Text>
          {item.gosto && (
            <Text style={styles.gostoText}>{item.gosto}</Text>
          )}

          {/* Se desejar, descomente para exibir a descrição */}
          {/* <Text style={styles.contentDescription}>{item.descricao}</Text> */}
        </ImageBackground>
      </TouchableOpacity>
    );
  };


  return (
    <View style={styles.container}>
      <Text style={styles.title}>Networking</Text>

      <View style={styles.buttonsContainer}>
        <TouchableOpacity
          style={[styles.tabButton, selectedTab === 'Comunidades' && styles.activeTab]}
          onPress={() => setSelectedTab('Comunidades')}
        >
          <Text style={styles.tabButtonText}>Comunidades</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tabButton, selectedTab === 'Eventos' && styles.activeTab]}
          onPress={() => setSelectedTab('Eventos')}
        >
          <Text style={styles.tabButtonText}>Eventos</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.carouselContainer}>
        {loading ? (
          <Text style={styles.loadingText}>Carregando gostos...</Text>
        ) : gostos.length > 0 ? (
          <FlatList
            data={gostos}
            horizontal={true}
            keyExtractor={(item, index) => index.toString()}
            renderItem={renderGostoItem}
            showsHorizontalScrollIndicator={false}
          />
        ) : (
          <Text style={styles.noGostosText}>Nenhum gosto selecionado.</Text>
        )}
      </View>

      {contentLoading ? (
        <View style={styles.loadingContainer}>
          <Image style={styles.CarregamentoEvento} source={require('./assets/Carregamento.png')}></Image>
        </View>
      ) : error ? (
        <Text style={styles.errorText}>{error}</Text>
      ) : content.length > 0 ? (
        <FlatList
          data={content}
          keyExtractor={(item) => item.id}
          renderItem={renderContentItem}
          contentContainerStyle={styles.contentList}
        />
      ) : (
        <Text style={styles.noContentText}>
          {selectedTab
            ? `Nenhum conteúdo encontrado para ${selectedTab.toLowerCase()}.`
            : 'Selecione uma aba acima para ver o conteúdo.'}
        </Text>
      )}

      {/* Botão na aba "Comunidades" para usuários com plano específico */}
      {selectedTab === 'Comunidades' && ['básico', 'avançado', 'premium'].includes(userPlan) && (
        <TouchableOpacity
          style={styles.createButton}
          onPress={() => navigation.navigate('CriarComunidade')}
        >
          <Text style={styles.createButtonText}>+</Text>
        </TouchableOpacity>
      )}

      {selectedTab === 'Eventos' && (
        <TouchableOpacity
          style={styles.createButton}
          onPress={() => navigation.navigate('CriarEvento')}
        >
          <Text style={styles.createButtonText}>+</Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  CarregamentoEvento : {
    width: 70,
    height: 70,

  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    backgroundColor: '#000',
},
  container: {
    flex: 1,

    backgroundColor: '#000',
  },
  contentItemComunidade: {
    paddingVertical: 20,
    paddingLeft: 20,
    marginVertical: 10,
    borderRadius: 10,
    overflow: 'hidden',
  },

  direitaContentItem: {
    justifyContent: 'flex-end',
    marginLeft: 'auto',
    alignItems: 'center',
    marginTop: 10,
    backgroundColor: '#fff',
    padding: 10,
    borderRadius: 13,
  },
  cimaContentDate: {
    color: '#000',
    fontFamily: 'Manrope-Bold',
    fontWeight: 700,
    fontSize: 16

  },
  baixoContentDate: {
    color: '#000',
    fontFamily: 'Raleway-SemiBold',
    fontSize: 12,

  },
  loadingText: {
    color: '#aaa',
    textAlign: 'center',
    marginTop: 10,
  },
  selectedGosto: {
    backgroundColor: '#fff',
    borderColor: '#fff',
  },
  selectedGostoText: {
    color: '#000'

  },
  title: {
    fontSize: 16,
    fontFamily: 'Raleway-SemiBold',
    color: 'white',
    textAlign: 'center',
    paddingTop: 50,
  },
  buttonsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
    paddingHorizontal: 20,
  },
  tabButton: {
    flex: 1,
    padding: 10,
    marginHorizontal: 5,
    backgroundColor: '#333',
    borderRadius: 20,
    alignItems: 'center',
  },

  activeTab: {
    backgroundColor: '#9F3EFC',
  },
  tabButtonText: {
    color: '#fff',
    fontFamily: 'Raleway-SemiBold',
  },
  carouselContainer: {
    width: '100%',
    height: 40,
    marginTop: 20,
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
  gostoText: {
    color: '#fff',
    fontSize: 14,
    fontFamily: 'Montserrat-Regular',
  },
  noGostosText: {
    color: '#aaa',
    textAlign: 'center',
    marginTop: 20,
  },
  contentList: {
    marginTop: 10,
    width: '100%',
    paddingHorizontal: 10,
  },
  contentItem: {
    backgroundColor: '#1a1a1a',
    padding: 15,
    borderRadius: 20,
    marginBottom: 10,
    height: 200,
    overflow: 'hidden',
  },
  contentTitle: {
    color: '#fff',
    fontSize: 24,
    fontWeight: 700,
    fontFamily: 'Manrope-Bold',
    marginTop: 'auto',
  },
  contentDescription: {
    color: '#aaa',
    marginBottom: 10,
  },

  adicionarImg: {
    width: 30,
    height: 30,
    tintColor: '#fff', // Ajuste se necessário
  },
  contentDate: {
    color: '#ddd',
    fontSize: 14,
  },
  noContentText: {
    color: '#aaa',
    textAlign: 'center',
    marginTop: 20,
    paddingHorizontal: 20,
  },
  criarEvento: {
    width: 40,
    height: 40,
  },
  createButton: {
    position: 'absolute',
    bottom: 70,
    right: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    borderWidth: 0.5,
    borderColor: '#9F3EFC',
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 5,

  },
  createButtonText: {
    color: '#9F3EFC',
    fontSize: 40,
    fontFamily: 'Montserrat-Regular',
    tintColor: '',
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: '#1a1a1a',
    paddingVertical: 10,
  },
  footerIcon: {
    width: 30,
    height: 30,
    tintColor: '#9F3EFC',
  },
});

export default NetworkingScreen;
