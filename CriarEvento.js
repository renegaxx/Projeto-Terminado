import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  Button,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  Image,
  Animated,
  KeyboardAvoidingView, Platform,
  Modal

} from 'react-native';
import { getAuth } from 'firebase/auth';
import { db } from './firebaseConfig';
import { collection, addDoc, doc, getDoc } from 'firebase/firestore';
import DateTimePicker from '@react-native-community/datetimepicker';


const CriarEvento = ({ navigation }) => {
  const [titulo, setTitulo] = useState('');
  const [descricao, setDescricao] = useState('');
  const [localizacao, setLocalizacao] = useState('');
  const [eventoPrivacidade, setEventoPrivacidade] = useState('publico');
  const [senhaConvite, setSenhaConvite] = useState('');
  const [loading, setLoading] = useState(false);
  const [imagemSelecionada, setImagemSelecionada] = useState(null);
  const [step, setStep] = useState(1); // Controle das etapas
  const [imageUri, setImageUri] = useState(null); // Armazena a URI da imagem selecionada
  const [preco, setPreco] = useState(''); // Novo estado para armazenar o preço
  const [precoModalVisible, setPrecoModalVisible] = useState(false); // Controla a exibição do modal
  const [gostos, setGostos] = useState([]);
  const [gostoSelecionado, setGostoSelecionado] = useState('');
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedField, setSelectedField] = useState(null);
  const [selectedDate, setSelectedDate] = useState({ day: 1, month: 1, year: new Date().getFullYear() });
  const user = getAuth().currentUser;
  const [modalidade, setModalidade] = useState(null); // Estado para modalidade
  const [horario, setHorario] = useState(''); // Estado para o horário combinado
  const [horarioModalVisible, setHorarioModalVisible] = useState(false); // Controla o modal de horário
  const [horaInicio, setHoraInicio] = useState(''); // Armazena a hora de início
  const [minutoInicio, setMinutoInicio] = useState(''); // Armazena o minuto de início
  const [horaFim, setHoraFim] = useState(''); // Armazena a hora de fim
  const [minutoFim, setMinutoFim] = useState(''); // Armazena o minuto de fim
  // animação 
  const slideAnim = useRef(new Animated.Value(300)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current; // Opacidade inicial
  const inputsOpacityAnim = useRef(new Animated.Value(1)).current;

  const scrollX = useRef(new Animated.Value(0)).current; // Criar uma referência animada para o deslizamento

  const eventsData = [
    { id: '1', image: require('./assets/fotosEventos/evento1.jpg') },
    { id: '2', image: require('./assets/fotosEventos/evento2.jpg') },
    { id: '3', image: require('./assets/fotosEventos/evento3.jpg') },
    { id: '4', image: require('./assets/fotosEventos/evento4.jpg') },
    { id: '5', image: require('./assets/fotosEventos/evento5.jpg') },
    { id: '6', image: require('./assets/fotosEventos/evento6.jpg') },
    { id: '7', image: require('./assets/fotosEventos/evento7.jpg') },
    { id: '8', image: require('./assets/fotosEventos/evento8.jpg') },
    { id: '9', image: require('./assets/fotosEventos/evento9.jpg') },
    { id: '10', image: require('./assets/fotosEventos/evento10.jpg') },
  ];
  const formatSelectedDate = () => {
    return `${String(selectedDate.day).padStart(2, '0')}-${String(selectedDate.month).padStart(2, '0')}-${selectedDate.year}`;
  };

  const animations = useRef({}); // Animações para cada imagem

  const handleHorarioSave = () => {
    // Validação básica
    if (!horaInicio || !minutoInicio || !horaFim || !minutoFim) {
      alert('Por favor, insira todos os horários e minutos.');
      return;
    }
    const horarioFormatado = `${horaInicio}:${minutoInicio} - ${horaFim}:${minutoFim}`;
    setHorario(horarioFormatado);
    setHorarioModalVisible(false);
  };

  const openModal = (field) => {
    setSelectedField(field);
    setModalVisible(true);
  };

  const closeModal = () => {
    setModalVisible(false);
    setSelectedField(null);
  };

  const selectValue = (value) => {
    setSelectedDate({ ...selectedDate, [selectedField]: value });
    closeModal();
  };

  const generateValues = () => {
    if (selectedField === 'day') {
      return Array.from({ length: 31 }, (_, i) => i + 1);
    }
    if (selectedField === 'month') {
      return Array.from({ length: 12 }, (_, i) => i + 1);
    }
    if (selectedField === 'year') {
      const currentYear = new Date().getFullYear();
      return Array.from({ length: 2029 - currentYear + 1 }, (_, i) => currentYear + i);
    }
    return [];
  };


  const gerarCodigoAleatorio = () => {
    const caracteres = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let codigo = '';
    for (let i = 0; i < 4; i++) {
      codigo += caracteres.charAt(Math.floor(Math.random() * caracteres.length));
    }
    return codigo;
  };
  const isValidURL = (url) => {
    const regex = new RegExp(
      '^(https?:\\/\\/)?' +
      '((([a-z\\d]([a-z\\d-]*[a-z\\d])*)\\.?)+[a-z]{2,}|((\\d{1,3}\\.){3}\\d{1,3}))' +
      '(\\:\\d+)?(\\/[-a-z\\d%_.~+]*)*' +
      '(\\?[;&a-z\\d%_.~+=-]*)?' +
      '(\\#[-a-z\\d_]*)?$',
      'i'
    );
    return !!url.match(regex);
  };




  const handleImageSelection = (imageId) => {
    setImagemSelecionada(imageId); // Atualiza o número da imagem selecionada

    // Animação para a imagem selecionada
    Object.keys(animations.current).forEach((key) => {
      Animated.timing(animations.current[key], {
        toValue: key === imageId ? 1.2 : 1, // Escala maior para a imagem selecionada
        duration: 300,
        useNativeDriver: true,
      }).start();
    });
  };

  const goBack = () => {
    navigation.goBack();
  };

  const showDateTimePicker = () => setShowDatePicker(true);

  const handleEventoSubmit = async () => {
    if (
      !titulo.trim() ||
      !descricao.trim() ||
      !localizacao.trim() ||
      !gostoSelecionado ||
      !modalidade ||
      !imagemSelecionada ||
      !horario ||
      !preco.trim() // Verifica se o preço está preenchido
    ) {
      alert('Por favor, preencha todos os campos obrigatórios.');
      return;
    }

    setLoading(true);
    try {
      const codigoEvento = gerarCodigoAleatorio();
      const formattedDate = formatSelectedDate(); // Formata a data no formato DD-MM-YYYY
      const eventoRef = await addDoc(collection(db, 'eventos'), {
        titulo,
        descricao,
        localizacao,
        gosto: gostoSelecionado,
        usuarioId: user.uid,
        dataCriacao: new Date(),
        privacidade: eventoPrivacidade,
        senhaConvite: eventoPrivacidade === 'privado' ? senhaConvite : null,
        codigo: codigoEvento,
        modalidade,
        imagemSelecionada,
        horario,
        dataEvento: formattedDate, // Adiciona a data no formato DD-MM-YYYY
        preco, // Adiciona o preço ao banco de dados
      });

      await addDoc(collection(db, 'modalidade'), {
        modalidade,
        eventoId: eventoRef.id,
        dataCriacao: new Date(),
      });

      navigation.goBack();
    } catch (error) {
      console.error('Erro ao criar o evento:', error);
    } finally {
      setLoading(false);
    }
  };




  const nextStep = () => {
    console.log({ titulo, descricao, localizacao, gostoSelecionado, modalidade });
    if (step === 1 && titulo && descricao) {
      setStep(2);
    } else if (step === 2 && localizacao && gostoSelecionado) {
      setStep(3);
    } else if (step === 3) {
      handleEventoSubmit();
    }
  };





  useEffect(() => {
    // Inicializar animações para cada item de eventsData
    eventsData.forEach((item) => {
      if (!animations.current[item.id]) {
        animations.current[item.id] = new Animated.Value(1);
      }
    });

    const fetchGostos = async () => {
      if (user) {
        try {
          const userDoc = doc(db, 'users', user.uid);
          const userSnap = await getDoc(userDoc);

          if (userSnap.exists()) {
            const userData = userSnap.data();
            setGostos(userData.gostos || []);
          }
        } catch (error) {
          console.error('Erro ao buscar gostos do usuário:', error);
        }
      }
    };

    fetchGostos();

    // Animação de deslizamento para a imagem
    Animated.timing(slideAnim, {
      toValue: 0, // Alvo: posição final
      duration: 1000, // Duração da animação em milissegundos
      useNativeDriver: true, // Usa o driver nativo para melhor desempenho
    }).start();

    // Animação de opacidade para os inputs
    Animated.timing(inputsOpacityAnim, {
      toValue: 1, // Inputs visíveis
      duration: 1500, // Duração para um efeito fluido
      delay: 1000, // Aguarda a animação da imagem terminar
      useNativeDriver: true, // Usa o driver nativo
    }).start();

    // Animação de opacidade geral
    Animated.timing(opacityAnim, {
      toValue: 1, // Totalmente visível
      duration: 1000, // Duração para suavidade
      useNativeDriver: true, // Usa o driver nativo
    }).start();

  }, [user, eventsData]);

  

  return (
    <View style={styles.container}>
      <Animated.View
        style={[
          styles.imageContainer,
          {
            transform: [{ translateY: slideAnim }], // Animação de movimento vertical
            opacity: opacityAnim, // Animação de opacidade
          },
        ]}
      >
        <Image source={require('./assets/black3.png')} style={styles.backgroundImageColor} />
      </Animated.View>
      <View style={styles.cimas}>
        <TouchableOpacity onPress={goBack}>
          <Image source={require('./assets/voltarImg.png')} style={styles.codeIcon} />
        </TouchableOpacity>
      </View>
      <View style={styles.tudoCima}>
        <Image source={require('./assets/black_14 1 (1).png')} style={styles.titleImg} />
        <Text style={styles.title}>Criar Evento</Text>
      </View>
      {/* Etapa 1 */}
      {step === 1 && (
        <>
          <Text style={styles.sectionTitle}>Selecione uma imagem:</Text>
          <FlatList
            data={eventsData}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <TouchableOpacity onPress={() => handleImageSelection(item.id)}>
                <Animated.Image
                  source={item.image}
                  style={[
                    styles.carouselImage,
                    { transform: [{ scale: animations.current[item.id] || 1 }] },
                  ]}
                />
              </TouchableOpacity>
            )}
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.carouselContainer}
          />


          <Animated.View
            style={[
              styles.animatedContainer,
              {
                transform: [{ translateY: slideAnim }], // Animação de movimento vertical
                opacity: opacityAnim, // Animação de opacidade
              },
            ]}
          >
            <TextInput
              style={styles.input}
              placeholder="Título do Evento"
              placeholderTextColor="#aaa"
              value={titulo}
              onChangeText={setTitulo}
            />
            <TextInput
              style={styles.input}
              placeholder="Descrição do Evento"
              placeholderTextColor="#aaa"
              multiline
              value={descricao}
              onChangeText={setDescricao}
            />
          </Animated.View>
        </>
      )}

      {/* Etapa 2 */}
      {step === 2 && (
        <>
          <Text style={styles.sectionTitle}>Selecione os gostos do Evento:</Text>
          {/* Carrossel de gostos */}
          <View style={styles.carouselContainer2}>
            <FlatList
              data={gostos}
              horizontal={true}
              keyExtractor={(item, index) => index.toString()}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[
                    styles.gostoItem,
                    gostoSelecionado === item && styles.selectedGosto, // Estilo do item selecionado
                  ]}
                  onPress={() => setGostoSelecionado(item)} // Seleciona o gosto
                >
                  <Text
                    style={[
                      styles.gostoText,
                      gostoSelecionado === item && styles.selectedGostoText, // Estilo do texto do item selecionado
                    ]}
                  >
                    {item}
                  </Text>
                </TouchableOpacity>
              )}
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.contentList} // Espaçamento interno
            />
          </View>
          <View style={styles.buttonContainer}>
            <Text style={styles.sectionTitle}>Escolha a Modalidade:</Text>
            <View style={styles.buttonContainer2}>


              <TouchableOpacity
                style={[
                  styles.button2,
                  modalidade === 'presencial' && styles.buttonActive2, // Estilo do botão ativo
                ]}
                onPress={() => setModalidade('presencial')} // Define a modalidade como "presencial"
              >
                <Text
                  style={[
                    styles.buttonText2,
                    modalidade === 'presencial' && styles.buttonActiveText2, // Estilo do texto ativo
                  ]}
                >
                  Presencial
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.button2,
                  modalidade === 'online' && styles.buttonActive2, // Estilo do botão ativo
                ]}
                onPress={() => setModalidade('online')} // Define a modalidade como "online"
              >
                <Text
                  style={[
                    styles.buttonText2,
                    modalidade === 'online' && styles.buttonActiveText2, // Estilo do texto ativo
                  ]}
                >
                  Online
                </Text>
              </TouchableOpacity>
            </View>
          </View>
          <Text style={styles.sectionTitle2}>Selecione a Data</Text>

          {/* Campos de Data */}
          <View style={styles.dateFields}>
            <TouchableOpacity
              style={styles.dateField}
              onPress={() => openModal('day')}
            >
              <Text style={styles.dateText}>{selectedDate.day}</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.dateField}
              onPress={() => openModal('month')}
            >
              <Text style={styles.dateText}>{selectedDate.month}</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.dateField}
              onPress={() => openModal('year')}
            >
              <Text style={styles.dateText}>{selectedDate.year}</Text>
            </TouchableOpacity>
          </View>

          {/* Modal de Seleção */}
          <Modal
            visible={modalVisible}
            transparent={true}
            animationType="slide"
            onRequestClose={closeModal}
          >
            <View style={styles.modalBackground}>
              <View style={styles.modalContainer}>
                <Text style={styles.modalTitle}>Selecione o {selectedField}</Text>
                <FlatList
                  data={generateValues()}
                  keyExtractor={(item) => item.toString()}
                  renderItem={({ item }) => (
                    <TouchableOpacity
                      style={styles.modalItem}
                      onPress={() => selectValue(item)}
                    >
                      <Text style={styles.modalItemText}>{item}</Text>
                    </TouchableOpacity>
                  )}
                />
                <TouchableOpacity style={styles.closeButton} onPress={closeModal}>
                  <Text style={styles.closeButtonText}>Fechar</Text>
                </TouchableOpacity>
              </View>
            </View>
          </Modal>


          <View style={styles.issoAi}>


            <TextInput
              style={styles.input}
              placeholder="Localização"
              placeholderTextColor="#aaa"
              value={localizacao}
              onChangeText={setLocalizacao}
            />
          </View>
        </>
      )}

      {/* Etapa 3 */}
      {step === 3 && (
        <>
          <Text style={styles.sectionTitle}>Definir Horário:</Text>
          <TouchableOpacity
            style={styles.priceButton}
            onPress={() => setHorarioModalVisible(true)} // Abre o modal de horário
          >
            <Text style={styles.buttonText}>
              {horario ? `Horário: ${horario}` : '00 - 00'}
            </Text>
          </TouchableOpacity>

          {/* Modal para definir o horário */}
          <Modal
            visible={horarioModalVisible}
            transparent={true}
            animationType="slide"
            onRequestClose={() => setHorarioModalVisible(false)}
          >
            <View style={styles.modalContainer}>
              <View style={styles.modalContent}>
                <Text style={styles.sectionTitle3}>Defina o Horário:</Text>

                {/* Horário de Início */}
                <Text style={styles.label}>Início:</Text>
                <View style={styles.row}>
                  <TextInput
                    style={styles.inputSmall}
                    placeholder="Hora (ex: 17)"
                    value={horaInicio}
                    onChangeText={setHoraInicio}
                    keyboardType="numeric"
                    maxLength={2}
                  />
                  <TextInput
                    style={styles.inputSmall}
                    placeholder="Minuto (ex: 00)"
                    value={minutoInicio}
                    onChangeText={setMinutoInicio}
                    keyboardType="numeric"
                    maxLength={2}
                  />
                </View>

                {/* Horário de Fim */}
                <Text style={styles.label}>Término:</Text>
                <View style={styles.row}>
                  <TextInput
                    style={styles.inputSmall}
                    placeholder="Hora (ex: 20)"
                    value={horaFim}
                    onChangeText={setHoraFim}
                    keyboardType="numeric"
                    maxLength={2}
                  />
                  <TextInput
                    style={styles.inputSmall}
                    placeholder="Minuto (ex: 30)"
                    value={minutoFim}
                    onChangeText={setMinutoFim}
                    keyboardType="numeric"
                    maxLength={2}
                  />
                </View>

                <View style={styles.modalButtons}>
                  <TouchableOpacity
                    style={[styles.button, { marginRight: 10 }]}
                    onPress={() => setHorarioModalVisible(false)}
                  >
                    <Text style={styles.buttonText}>Cancelar</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.button} onPress={handleHorarioSave}>
                    <Text style={styles.buttonText}>Salvar</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </Modal>
          <Text style={styles.sectionTitle}>Finalizar Configuração:</Text>
          <TouchableOpacity
            style={styles.priceButton}
            onPress={() => setPrecoModalVisible(true)} // Abre o modal
          >
            <Text style={styles.buttonText}>
              {preco ? `R$ ${preco}` : 'R$ 00,00'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity onPress={nextStep} style={styles.button}>
            <Text style={styles.buttonText}>Criar Evento</Text>
          </TouchableOpacity>
          <Modal
            visible={precoModalVisible}
            transparent={true}
            animationType="slide"
            onRequestClose={() => setPrecoModalVisible(false)} // Fecha o modal
          >
            <View style={styles.modalContainer}>
              <View style={styles.modalContent}>
                <Text style={styles.sectionTitle}>Definir Preço do Evento:</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Preço (R$)"
                  keyboardType="numeric"
                  value={preco}
                  onChangeText={setPreco}
                />
                <View style={styles.modalButtons}>
                  <TouchableOpacity
                    style={[styles.button, { marginRight: 10 }]}
                    onPress={() => setPrecoModalVisible(false)}
                  >
                    <Text style={styles.buttonText}>Cancelar</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.button}
                    onPress={() => setPrecoModalVisible(false)}
                  >
                    <Text style={styles.buttonText}>Salvar</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </Modal>
        </>
      )}

      {/* Botão de Avançar */}
      {step !== 3 && (
        <TouchableOpacity onPress={nextStep} style={styles.button}>
          <Text style={styles.buttonText}>Avançar</Text>
        </TouchableOpacity>

      )}

      {loading && <ActivityIndicator size="large" color="#9F3EFC" />}





    </View>
  );
};

const styles = StyleSheet.create({
  imageContainer: {
    position: 'absolute', // Posiciona a imagem
    top: 0,
    left: 330,
    right: 0,
    bottom: 0,
    zIndex: 0, // Coloca atrás de tudo
  },
  label: {
    fontSize: 16,
    fontFamily: 'Raleway-Regular',
    marginTop: 10,
    color: '#fff',
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    marginBottom: 10,
  },
  inputSmall: {
    width: '48%',
    borderColor: '#ccc',
    borderWidth: 1,
    borderRadius: 5,
    padding: 10,
    fontSize: 16,
    color: '#fff',
  },
  backgroundImageColor: {
    width: 300, // Largura fixa
    height: '38%', // Altura fixa
    alignSelf: 'center', // Centraliza no container
  },
  container: {
    flex: 1,
    paddingHorizontal: 10,
    backgroundColor: '#000',
  },
  cimas: {
    marginTop: 35,
    zIndex: 10,
  },
  tudoCima: {
    flexDirection: 'row',
    zIndex: 10,
    marginTop: 10

  },
  title: {
    fontSize: 30,
    color: '#fff',
    zIndex: 10,
    fontFamily: 'Manrope-Bold',
    marginLeft: 5,
  },
  titleImg: {
    width: 45,
    height: 45,
  },
  sectionTitle: {
    fontSize: 14,
    color: '#fff',
    marginBottom: 10,
    fontFamily: 'Montserrat-Regular',
    zIndex: 10,
  },
  sectionTitle3: {
    fontSize: 16,
    color: '#fff',
    marginBottom: 10,
    fontFamily: 'Montserrat-Bold',
    zIndex: 10,
  },
  sectionTitle2: {
    fontSize: 14,
    color: '#fff',
    marginTop: 100,
    fontFamily: 'Montserrat-Regular',
    zIndex: 10,
  },
  buttonContainer: {
    marginTop: 'auto',
    width: '100%',


  },
  buttonContainer2: {
    flexDirection: 'row',
    marginLeft: 'auto',
    marginRight: 'auto',

  },
  issoAi: {
    marginTop: 'auto',
  },
  input: {
    height: 50,
    borderColor: '#fff',
    borderWidth: 1.5,
    borderRadius: 10,
    paddingHorizontal: 20,
    color: 'white',
    fontFamily: 'Raleway-Regular',
    marginBottom: 20,
    backgroundColor: 'transparent'
  },
  animatedContainer: {
    width: '100%', // Largura dos inputs
  },
  carouselContainer: {
    height: 200, paddingTop: 40, zIndex: 10,
  },
  carouselImage: {
    width: 150,
    height: 280,
    marginHorizontal: 10,

    borderRadius: 10,
    zIndex: 10,
  },
  carouselItem: {
    backgroundColor: 'transparent',
    borderWidth: 0.5,
    borderColor: '#fff',
    paddingHorizontal: 20,
    paddingVertical: 10,
    marginHorizontal: 10,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10,

  },
  carouselItemActive: {
    backgroundColor: '#fff', // Cor de fundo para o item ativo
  },
  carouselText: {
    color: '#fff',
    fontSize: 14,
    fontFamily: 'Montserrat-SemiBold',
  },
  carouselTextActive: {
    color: '#000'
  },

  carouselContainer2: {
    width: '100%',
    height: 40,
    marginTop: 0,
  },
  selectedGosto: {
    backgroundColor: '#fff', // Fundo branco para o selecionado
    borderColor: '#fff',
  },
  selectedGostoText: {
    color: '#000', // Texto preto para o selecionado
  },
  noGostosText: {
    color: '#aaa',
    textAlign: 'center',
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
  gostoItemSelected: {
    backgroundColor: '#9F3EFC',
  },
  gostoText: {
    color: '#fff',
    fontSize: 14,
    fontFamily: 'Montserrat-Regular',
  },

  button: {
    backgroundColor: '#9F3EFC',
    marginBottom: 20,

    paddingVertical: 15,
    paddingHorizontal: 30,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#9F3EFC', // Cor do glow
    shadowOpacity: 0.8,
    shadowRadius: 10, // Intensidade do glow
    shadowOffset: { width: 40, height: 90 }, // Posiciona o brilho em torno do botão
    elevation: 100, // Para Android
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
  },
  button2: {
    backgroundColor: 'transparent',
    marginTop: 0,
    paddingVertical: 15,
    width: 130,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 0.5,
    borderColor: '#fff',
    marginHorizontal: 20,
  },
  buttonText2: {
    color: '#fff',
    fontSize: 16,
    fontFamily: 'Montserrat-Regular'
  },
  buttonActive2: {
    backgroundColor: '#fff',

  },
  buttonActiveText2: {
    color: '#000'

  },
  dateText: {
    color: '#fff',
    fontSize: 16,
  },

  codeIcon: {
    width: 30,
    height: 30,
    marginTop: 10,
  },
  dateFields: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    marginTop: 10
  },
  dateField: {
    width: 80,
    height: 80,
    backgroundColor: 'transparent',
    borderWidth: 0.5,
    borderColor: '#fff',
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 10,
  },
  dateText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    fontFamily: 'Montserrat-Regular'
  },
  priceButton: {
    backgroundColor: 'transparent',
    padding: 15,
    borderWidth: 0.5,
    borderColor: '#fff',
    borderRadius: 15,
    alignItems: 'center',
    marginBottom: 15,
  },
  modalBackground: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',

  },
  modalContainer: {
    width: '80%',
    backgroundColor: '#000',
    borderRadius: 10,
    height: 500,
    padding: 20,
    alignItems: 'center',

  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  modalItem: {
    padding: 15,
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
  },
  modalItemText: {
    fontSize: 16,
    color: '#fff',
  },
  closeButton: {
    marginTop: 20,
    padding: 10,
    backgroundColor: '#007BFF',
    borderRadius: 10,
    alignItems: 'center',
  },
  closeButtonText: {
    color: '#fff',
    fontSize: 16,
  },
});

export default CriarEvento;
