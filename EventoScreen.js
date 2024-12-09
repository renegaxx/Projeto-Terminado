import React, { useState, useEffect, useRef } from 'react';
import { View, Text, Image, ActivityIndicator, StyleSheet, TouchableOpacity, Animated, ImageBackground, ScrollView, Modal, TextInput } from 'react-native';
import { db } from './firebaseConfig';
import { doc, getDoc, updateDoc, arrayUnion } from 'firebase/firestore';
import { getAuth } from 'firebase/auth'; // Para obter o usuário autenticado
import axios from 'axios'; // Importando o axios

// Dados dos eventos
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

            // Retorna a data no formato 'DD Mês Abreviado YYYY'
            return `${dia} ${meses[parseInt(mes) - 1]} ${ano}`;
        }
    }
    return 'Data inválida'; // Caso a string não tenha o formato esperado
};
// Função para buscar o nome completo do usuário
const fetchUserFullName = async (userId) => {
    try {
        const userDoc = doc(db, 'users', userId); // Supondo que você tenha uma coleção 'users'
        const userSnap = await getDoc(userDoc);
        if (userSnap.exists()) {
            const userData = userSnap.data();
            return userData.fullName || 'Nome não disponível'; // Retorna o fullName ou uma string padrão
        } else {
            return 'Nome não disponível';
        }
    } catch (error) {
        console.error('Erro ao buscar nome do usuário:', error);
        return 'Nome não disponível';
    }
};

// Função para mapear imagens com base no ID
const mapImageById = (id) => {
    const event = eventsData.find((e) => e.id === id);
    return event ? event.image : null; // Retorna a imagem ou null caso não encontre
};

const EventoScreen = ({ route, }) => {
    const { eventId } = route.params; // Pegando o ID do evento passado pela navegação
    const [event, setEvent] = useState(null);
    const [loading, setLoading] = useState(true);
    const [gostos, setGostos] = useState([]);
    const [gostoSelecionado, setGostoSelecionado] = useState('');
    const [liked, setLiked] = useState(false);  // Estado para o botão de "gostar"
    const [disliked, setDisliked] = useState(false);  // Estado para o botão de "desativado"
    const [modalVisible, setModalVisible] = useState(false);
    const [modalStep, setModalStep] = useState('payment'); // Estados: 'payment', 'loading', 'success'
    const [codigoPart1, setCodigoPart1] = useState('');
    const [codigoPart2, setCodigoPart2] = useState('');
    const [codigoPart3, setCodigoPart3] = useState('');
    const [codigoPart4, setCodigoPart4] = useState('');
    const [emailCodigo, setEmailCodigo] = useState('');
    const [codigoValido, setCodigoValido] = useState(null); // null para inicializar sem mensagem
    const [userName, setUserName] = useState('');
    const [userEmail, setUserEmail] = useState('');
    const [userPhone, setUserPhone] = useState('');
    const [userPlano, setUserPlano] = useState('');
    const [informacoesVisiveis, setInformacoesVisiveis] = useState(false); // Controle da exibição das informações
    const [userFullName, setUserFullName] = useState('');
    const [userDataEmissao, setUserDataEmissao] = useState('');
    const [eventosPagos, setEventosPagos] = useState([]);
    

    const refPart1 = useRef(null);
    const refPart2 = useRef(null);
    const refPart3 = useRef(null);
    const refPart4 = useRef(null);

    // Animações
    const imageAnim = useRef(new Animated.Value(1)).current; // Animação de opacidade para imagem

    const scrollY = new Animated.Value(0);  // Valor animado para o scroll Y

    useEffect(() => {
        if (eventId) {
            fetchEvent();
            fetchGostos(); // Busca também os gostos

            const user = getAuth().currentUser; // Obtém o usuário autenticado
            if (user) {
                console.log('Email do usuário:', user.email); // Exibe o e-mail no console

                // Busca os dados completos do usuário no Firestore
                fetchUserDetails(user.uid).then(({ fullName, phone, plano, eventosPagos }) => {
                    console.log('Nome completo do usuário:', fullName);
                    console.log('Telefone do usuário:', phone);
                    console.log('Plano do usuário:', plano); // Exibe o plano no console
                    setUserFullName(fullName);
                    setUserPhone(phone);
                    setUserPlano(plano);
                    setEventosPagos(eventosPagos); // Define os eventos pagos

                    // Verifica se o evento atual está na lista de eventos pagos
                    if (eventosPagos.includes(eventId)) {
                        setInformacoesVisiveis(true); // Exibe as informações do ticket
                    } else {
                        setInformacoesVisiveis(false); // Caso o evento não tenha sido pago ainda
                    }
                });
            } else {
                console.log('Nenhum usuário autenticado.');
            }
        }
    }, [eventId]);

    useEffect(() => {
        const userId = getAuth().currentUser.uid;
        fetchUserDetails(userId).then(userDetails => {
            // Verifica se já existe a data de emissão no Firestore
            if (userDetails.dataEmissao && userDetails.dataEmissao !== 'Data não disponível') {
                setUserFullName(userDetails.fullName);
                setUserPhone(userDetails.phone);
                setUserPlano(userDetails.plano);
                setUserDataEmissao(userDetails.dataEmissao);
            } else {
                // Caso contrário, você pode tratar como não concluído e permitir o processo de pagamento
                console.log('Dados não encontrados, por favor, finalize a compra');
            }
        });
    }, []);

    useEffect(() => {
        if (userDataEmissao && userFullName && userPhone && userPlano) {
            setInformacoesVisiveis(true);
        }
    }, [userDataEmissao, userFullName, userPhone, userPlano]);

    useEffect(() => {
        const fetchUserPaidEvents = async () => {
            const user = getAuth().currentUser;
            if (user) {
                const userRef = doc(db, 'users', user.uid);
                const userSnap = await getDoc(userRef);
                if (userSnap.exists()) {
                    const userData = userSnap.data();
                    setEventosPagos(userData.eventosPagos || []);
                }
            }
        };

        if (eventId) {
            fetchEvent();
            fetchGostos();
            fetchUserPaidEvents();
        }
    }, [eventId]);

    useEffect(() => {
        if (eventosPagos.includes(eventId)) {
            setInformacoesVisiveis(true);
        } else {
            setInformacoesVisiveis(false);
        }
    }, [eventosPagos, eventId]);

    useEffect(() => {
        if (eventosPagos && eventosPagos.includes(eventId)) {
            setInformacoesVisiveis(true); // Exibe o ticket se o evento foi pago
        } else {
            setInformacoesVisiveis(false); // Caso contrário, esconde
        }
    }, [eventosPagos, eventId]); // Executa toda vez que a lista de eventos pagos ou o eventId mudar    

    const fetchUserDetails = async (userId) => {
        try {
            const userDoc = doc(db, 'users', userId);
            const userSnap = await getDoc(userDoc);
            if (userSnap.exists()) {
                const userData = userSnap.data();
                const fullName = userData.fullName || 'Nome não disponível';
                const phone = userData.phone || 'Telefone não disponível';
                const plano = userData.plano || 'Nenhum plano';
                const eventosPagos = userData.eventosPagos || [];

                // Formatar a data de emissão no formato dd/mm/aaaa
                const dataEmissao = userData.dataEmissao
                    ? new Date(userData.dataEmissao).toLocaleDateString('pt-BR', {
                        day: '2-digit',
                        month: '2-digit',
                        year: 'numeric' // Exibe o ano com 4 dígitos
                    })
                    : 'Data não disponível';

                return { fullName, phone, plano, dataEmissao, eventosPagos };
            } else {
                return { fullName: 'Nome não disponível', phone: 'Telefone não disponível', plano: 'Plano não disponível', dataEmissao: 'Data não disponível', eventosPagos: [] };
            }
        } catch (error) {
            console.error('Erro ao buscar dados do usuário:', error);
            return { fullName: 'Nome não disponível', phone: 'Telefone não disponível', plano: 'Plano não disponível', dataEmissao: 'Data não disponível', eventosPagos: [] };
        }
    };

    const handleGarantirTicket = () => {
        setModalVisible(true); // Exibir o modal ao pressionar "Garantir Ticket"
    };

    const handlePagar = async () => {
        console.log('Processando pagamento...');
        setModalStep('loading');

        const user = getAuth().currentUser;
        if (user) {
            const eventData = event;
            const email = user.email;

            try {
                const fullName = await fetchUserFullName(user.uid);
                const response = await axios.post('http://192.168.15.77:3000/send-email', {
                    to: email,
                    subject: `Código do Evento: ${eventData.titulo}`,
                    text: `Olá, ${fullName}!\n\nAgradecemos por escolher participar do nosso evento. Estamos felizes em tê-lo conosco!\n\nAqui está o código do evento que você selecionou:\n\nCódigo do Evento: ${eventData.codigo}\n\nPor favor, guarde essa informação com cuidado. Caso precise de mais detalhes ou tenha alguma dúvida, não hesite em entrar em contato com a nossa equipe.\n\nAtenciosamente,\nEquipe PutHype\nTransformando momentos em experiências inesquecíveis.`,
                });

                setEmailCodigo(eventData.codigo);
                console.log('E-mail enviado com sucesso!', response.data);

                // Salvar a data de emissão e o evento pago no banco de dados
                const userRef = doc(db, 'users', user.uid);
                await updateDoc(userRef, {
                    dataEmissao: new Date().toISOString(), // Salvando a data atual
                    eventosPagos: arrayUnion(eventId) // Adiciona o evento à lista de eventos pagos
                });

                setModalStep('success');
            } catch (error) {
                console.error('Erro ao enviar e-mail:', error);
                setModalStep('payment');
            }
        } else {
            console.log('Usuário não autenticado.');
            setModalStep('payment');
        }
    };

    //codigo
    useEffect(() => {
        if (modalVisible) {
            // Limpar os campos de entrada quando o modal for aberto
            setCodigoPart1('');
            setCodigoPart2('');
            setCodigoPart3('');
            setCodigoPart4('');
        }
    }, [modalVisible]);

    // Função de validação atualizada para fechar o modal e exibir as informações se o código for correto
    const validateCodigo = () => {
        const codigo = `${codigoPart1}${codigoPart2}${codigoPart3}${codigoPart4}`;
        if (codigo === emailCodigo) {
            setCodigoValido(true);
            setInformacoesVisiveis(true);
            setModalVisible(false); // Fecha o modal quando o código for válido
        } else {
            setCodigoValido(false);
            setInformacoesVisiveis(false);
        }
    };

    const handleCancelar = () => {
        setModalVisible(false);
        setModalStep('payment');
    };

    // Atualize a função de validação para fechar o modal quando o código for válido
    const handleSalvar = () => {
        validateCodigo();  // Chama a função de validação quando o botão "Salvar" for pressionado
    };

    // Função para buscar os gostos no Firestore
    const fetchGostos = async () => {
        try {
            const gostosDoc = doc(db, 'eventos', eventId, 'gostos', 'lista'); // Supondo que gostos sejam armazenados assim
            const gostosSnap = await getDoc(gostosDoc);
            if (gostosSnap.exists()) {
                const gostosData = gostosSnap.data();
                setGostos(gostosData.lista); // Atualiza o estado de gostos com a lista recebida
            } else {
                setGostos([]); // Nenhum gosto encontrado
            }
        } catch (error) {
            console.error('Erro ao buscar gostos:', error);
        }
    };

    useEffect(() => {
        if (eventId) {
            fetchEvent();
            fetchGostos();  // Busca também os gostos
        }
    }, [eventId]);

    const fetchEvent = async () => {
        console.log(`Buscando evento com ID: ${eventId}`);
        try {
            const eventDoc = doc(db, 'eventos', eventId);
            const eventSnap = await getDoc(eventDoc);
            if (eventSnap.exists()) {
                const eventData = eventSnap.data();
                setEvent(eventData);
                console.log(`Evento encontrado:`, eventData);
            } else {
                console.error('Evento não encontrado.');
                setEvent(null);
            }
        } catch (error) {
            console.error('Erro ao buscar evento:', error);
            setEvent(null);
        } finally {
            setLoading(false);
        }
    };
    

    useEffect(() => {
        if (eventId) {
            fetchEvent();
        }
    }, [eventId]);

    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <Image style={styles.CarregamentoEvento} source={require('./assets/Carregamento.png')}></Image>
            </View>
        );
    }

    if (!event) {
        return (
            <View style={styles.errorContainer}>
                <Text style={styles.errorText}>Evento não encontrado.</Text>
            </View>
        );
    }

    return (
        <ImageBackground
            source={mapImageById(event.imagemSelecionada)} // Sua imagem de fundo
            style={styles.container} // Estilo do container para garantir que a imagem ocupe toda a tela
            resizeMode="cover" // Ajuste o modo de exibição da imagem (cover, contain, etc.)
        >
            <ImageBackground
                source={require('./assets/cinzinhaBack.png')} // Sua imagem de fundo
                style={styles.container2} // Estilo do container para garantir que a imagem ocupe toda a tela
                resizeMode="cover" // Ajuste o modo de exibição da imagem (cover, contain, etc.)
            >
                <ScrollView contentContainerStyle={styles.scrollContainer}>
                    <Animated.View
                        style={[styles.eventImageContainer, { transform: [{ scale: imageAnim }] }]}
                    >
                    </Animated.View>
                    <View styles={styles.tudoContainer}>
                        <Image
                            source={mapImageById(event.imagemSelecionada)}
                            style={styles.imageEvent}
                        />
                        <View style={styles.cimaInfo}>
                            <Text style={styles.eventTitle}>{event.titulo}</Text>
                            <Text style={styles.eventPreco}>
                                R$ {event.preco ? parseFloat(event.preco).toFixed(2) : '0.00'}
                            </Text>
                        </View>
                        <Text style={styles.eventSubTitle}>{event.gosto}</Text>
                        <View style={styles.containerDescription}>
                            <View style={styles.containerBotaoDescription}>
                                <View style={styles.botaoDescription}>
                                    <Image style={styles.imgBotao} source={require('./assets/icons/estrelaImg.png')}></Image>
                                    <Text style={styles.textBotaoDescription}>4.5</Text>

                                </View>
                                <View style={styles.botaoDescription}>
                                    <Image style={styles.imgBotao} source={require('./assets/icons/olhoImg.png')}></Image>
                                    <Text style={styles.textBotaoDescription}>10K</Text>
                                </View>
                                <View style={styles.botaoDescription}>
                                    <Image style={styles.imgBotao} source={require('./assets/icons/olhoImg.png')}></Image>
                                    <Text style={styles.textBotaoDescription}>
                                        {event.dataEvento ? formatData(event.dataEvento) : 'Data não disponível'}
                                    </Text>

                                </View>
                            </View>
                            <Text style={styles.eventDescription}>{event.descricao}</Text>
                            <View style={styles.gostosContainer}>
                                {gostos.map((gosto, index) => (
                                    <TouchableOpacity
                                        key={index}
                                        style={[styles.gostoItem, gostoSelecionado === gosto && styles.gostoSelected]}
                                        onPress={() => setGostoSelecionado(gosto)}
                                    >
                                        <Text style={styles.gostoText}>{gosto}</Text>
                                    </TouchableOpacity>
                                ))}
                            </View>
                            <View style={styles.botoes}>
                                {/* Botão "Gostar" */}
                                <TouchableOpacity
                                    style={[
                                        styles.botao,
                                        liked && { borderColor: 'red' }, // Se "liked" for true, muda a borda para vermelho
                                    ]}
                                    onPress={() => setLiked(!liked)} // Alterna o estado de "liked"
                                >
                                    <Image
                                        source={require('./assets/icons/gostarImg.png')}
                                        style={[
                                            styles.gostar,
                                            { tintColor: liked ? 'red' : '#fff' }, // Muda a cor do ícone para vermelho se "liked" for true
                                        ]}
                                    />
                                </TouchableOpacity>

                                {/* Botão "Desgostar" */}
                                <TouchableOpacity
                                    style={[
                                        styles.botao,
                                        disliked && { borderColor: 'yellow' }, // Se "disliked" for true, muda a borda para amarelo
                                    ]}
                                    onPress={() => setDisliked(!disliked)} // Alterna o estado de "disliked"
                                >
                                    <Image
                                        source={require('./assets/icons/desativadoImg.png')}
                                        style={[
                                            styles.gostar,
                                            { tintColor: disliked ? 'yellow' : '#fff' }, // Muda a cor do ícone para amarelo se "disliked" for true
                                        ]}
                                    />
                                </TouchableOpacity>
                            </View>
                        </View>
                    </View>
                    <Text style={styles.outrasText}>Outras Informações</Text>
                    <View style={styles.outrasInformacoes}>
                        <View style={styles.seguuura}>
                            <View style={styles.containerOutrasText}>
                                <Image style={styles.iconOutras} source={require('./assets/icons/localImg.png')}></Image>
                                <Text style={styles.outrasText2}>{event.localizacao}</Text>
                            </View>
                            <View style={styles.containerOutrasText}>
                                <Image style={styles.iconOutras} source={require('./assets/icons/clockImg.png')}></Image>
                                <Text style={styles.outrasText2}>
                                    {event.horario}
                                </Text>
                            </View>
                            <View style={styles.containerOutrasText}>
                                <Image style={styles.iconOutras} source={require('./assets/icons/eventImg.png')}></Image>
                                <Text style={styles.outrasText2}>
                                    {event.dataEvento ? formatData(event.dataEvento) : 'Data não disponível'}
                                </Text>
                            </View>

                        </View>
                        <View style={styles.participantes}>


                        </View>

                    </View>

                    {/* // View do ticketGarantido, exibindo as informações do usuário */}
                    {informacoesVisiveis && (
                        <View style={styles.ticketGarantido}>
                            <Text style={styles.ticketTitle}>{event.titulo.charAt(0).toUpperCase() + event.titulo.slice(1)}
                            </Text>
                            <View style={styles.repetir}>
                                <View style={styles.repetindo}></View>
                                <View style={styles.repetindo}></View>
                                <View style={styles.repetindo}></View>
                                <View style={styles.repetindo}></View>
                                <View style={styles.repetindo}></View>
                                <View style={styles.repetindo}></View>
                                <View style={styles.repetindo}></View>
                                <View style={styles.repetindo}></View>
                                <View style={styles.repetindo}></View>
                                <View style={styles.repetindo}></View>
                                <View style={styles.repetindo}></View>
                                <View style={styles.repetindo}></View>
                                <View style={styles.repetindo}></View>
                                <View style={styles.repetindo}></View>
                                <View style={styles.repetindo}></View>
                            </View>

                            <View style={styles.tudoInfo}>
                                <View style={styles.tudoInfo1}>
                                    <View style={styles.tudoInfoText}>
                                        <Text style={styles.infoText1}>Nome:</Text>
                                        <Text style={styles.infoText2}>{userFullName}</Text>
                                    </View>
                                    <View style={styles.tudoInfoText}>
                                        <Text style={styles.infoText1}>Telefone:</Text>
                                        <Text style={styles.infoText2}>{userPhone}</Text>
                                    </View>
                                </View>
                                <View style={styles.tudoInfo2}>
                                    <View style={styles.tudoInfoText}>
                                        <Text style={styles.infoText1}>Plano:</Text>
                                        <Text style={styles.infoText2}>{userPlano}</Text>
                                    </View>
                                    <View style={styles.tudoInfoText}>
                                        <Text style={styles.infoText1}>Data de Emissão:</Text>
                                        <Text style={styles.infoText2}>{userDataEmissao}</Text>
                                    </View>
                                </View>
                            </View>

                            <View style={styles.repetir}>
                                <View style={styles.repetindo}></View>
                                <View style={styles.repetindo}></View>
                                <View style={styles.repetindo}></View>
                                <View style={styles.repetindo}></View>
                                <View style={styles.repetindo}></View>
                                <View style={styles.repetindo}></View>
                                <View style={styles.repetindo}></View>
                                <View style={styles.repetindo}></View>
                                <View style={styles.repetindo}></View>
                                <View style={styles.repetindo}></View>
                                <View style={styles.repetindo}></View>
                                <View style={styles.repetindo}></View>
                                <View style={styles.repetindo}></View>
                                <View style={styles.repetindo}></View>
                                <View style={styles.repetindo}></View>
                            </View>

                            <View style={styles.QRcode}>
                                {/* Aqui você pode colocar o QR code ou outro conteúdo */}
                            </View>
                        </View>
                    )}

                </ScrollView>

                <View style={styles.containerBotaoBaixo}>
                    <TouchableOpacity onPress={handleGarantirTicket} style={[styles.botaoBaixo, styles.backButton]}>
                        <Text style={styles.textoBotao}>Garantir Ticket</Text>
                    </TouchableOpacity>
                </View>
                {/* Modal para mostrar a mensagem de pagamento */}
                <Modal
                    animationType="slide"
                    transparent={true}
                    visible={modalVisible}
                    onRequestClose={() => setModalVisible(false)}
                >
                    <View style={styles.modalOverlay}>
                        <View style={styles.modalContainer}>
                            {modalStep === 'payment' && (
                                <>
                                    <Text style={styles.modalText}>
                                        Pague o valor de R$ {event.preco} para confirmar sua inscrição e garantir seu ticket.
                                    </Text>
                                    <View style={styles.modalButtonContainer}>
                                        <TouchableOpacity
                                            style={styles.modalButton}
                                            onPress={handlePagar}
                                        >
                                            <Text style={styles.modalButtonText}>Pagar</Text>
                                        </TouchableOpacity>
                                        <TouchableOpacity
                                            style={[styles.modalButton, styles.modalCancelButton]}
                                            onPress={handleCancelar}
                                        >
                                            <Text style={styles.modalButtonText}>Cancelar</Text>
                                        </TouchableOpacity>
                                    </View>
                                </>
                            )}
                            {modalStep === 'loading' && (
                                <View style={styles.loadingContainer}>
                                    <ActivityIndicator size="large" color="#fff" />
                                    <Text style={styles.loadingText}>Enviando email...</Text>
                                </View>
                            )}
                            {modalStep === 'success' && (
                                <>
                                    <Text style={styles.modalText}>Código enviado para o seu email!</Text>
                                    <View style={styles.codeInputContainer}>
                                        <TextInput
                                            ref={refPart1}
                                            style={styles.input}
                                            maxLength={1}
                                            keyboardType="numeric"
                                            value={codigoPart1}
                                            onChangeText={(text) => {
                                                setCodigoPart1(text);
                                                if (text) refPart2.current.focus();
                                            }}
                                        />
                                        <TextInput
                                            ref={refPart2}
                                            style={styles.input}
                                            maxLength={1}
                                            keyboardType="numeric"
                                            value={codigoPart2}
                                            onChangeText={(text) => {
                                                setCodigoPart2(text);
                                                if (text) refPart3.current.focus();
                                            }}
                                        />
                                        <TextInput
                                            ref={refPart3}
                                            style={styles.input}
                                            maxLength={1}
                                            keyboardType="numeric"
                                            value={codigoPart3}
                                            onChangeText={(text) => {
                                                setCodigoPart3(text);
                                                if (text) refPart4.current.focus();
                                            }}
                                        />
                                        <TextInput
                                            ref={refPart4}
                                            style={styles.input}
                                            maxLength={1}
                                            keyboardType="numeric"
                                            value={codigoPart4}
                                            onChangeText={(text) => {
                                                setCodigoPart4(text);
                                            }}
                                        />
                                    </View>
                                    <TouchableOpacity
                                        style={styles.modalButton}
                                        onPress={handleSalvar} // A função que valida o código
                                    >
                                        <Text style={styles.modalButtonText}>Salvar</Text>
                                    </TouchableOpacity>

                                    {/* Exibir a mensagem de Código Correto ou Errado */}
                                    {codigoValido !== null && (
                                        <View style={styles.modalMessage}>
                                            <Text style={styles.modalMessageText}>
                                                {codigoValido ? 'Código Correto' : 'Código Errado'}
                                            </Text>
                                        </View>
                                    )}
                                </>
                            )}
                        </View>
                    </View>
                </Modal>

            </ImageBackground>
        </ImageBackground>
    );
};

const styles = StyleSheet.create({

    modalOverlay: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
    },
    modalContainer: {
        width: '100%',
        padding: 20,
        backgroundColor: '#000',
        borderRadius: 10,
        alignItems: 'center',
        marginTop: 'auto',
        height: 400,

    },
    modalText: {
        fontSize: 16,
        textAlign: 'center',
        marginBottom: 20,
        color: '#fff'
    },
    modalButton: {
        backgroundColor: '#007BFF',
        height: 40,
        width: 90,
        borderRadius: 5,
        marginHorizontal: 5,
    },
    modalButtonText: {
        color: 'white',
        fontSize: 16,
        textAlign: 'center',
        justifyContent: 'center',
        marginTop: 5,
    },
    modalButtonContainer: {
        flexDirection: 'row',

    },
    scrollContainer: {
        paddingBottom: 10,
    },
    CarregamentoEvento: {
        width: 100,
        height: 100,
    },
    iconOutras: {
        width: 15,
        height: 15,
        tintColor: '#fff',
    },
    cimaInfo: {


    },
    eventPreco: {
        color: '#fff',
        fontSize: 17,
        fontFamily: 'Montserrat-SemiBold',
        marginRight: 20,

    },
    containerOutrasText: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 5,

    },
    outrasInformacoes: {
        marginVertical: 10,

    },
    outrasText2: {
        fontFamily: 'Montserrat-Regular',
        fontSize: 12,
        color: '#fff',
        alignItems: 'center',
        marginLeft: 5,

    },
    outrasText: {
        color: '#fff',
        fontSize: 16,
        fontFamily: 'Montserrat-SemiBold',
        marginTop: 10,

    },
    containerBotaoDescription: {
        flexDirection: 'row',
    },

    botaoDescription: {
        paddingHorizontal: 10,
        paddingVertical: 5,
        backgroundColor: '#F5EFE8',
        alignItems: 'center',
        flexDirection: 'row',
        borderRadius: 10,
        marginHorizontal: 5,
    },
    textBotaoDescription: {
        fontFamily: 'Montserrat-SemiBold',
        fontSize: 10,
        color: '#79532A'

    },
    imgBotao: {
        width: 20,
        height: 20,
        marginRight: 5,
        tintColor: '#79532A',
    },
    eventImageContainer: {
        marginTop: 150,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#000',
    },
    container: {
        flex: 1,
    },
    container2: {
        flex: 1,
        padding: 20,
    },


    errorContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#000',
    },
    errorText: {
        color: '#FFF',
        fontSize: 18,
    },

    imageEvent: {
        width: 105,
        borderRadius: 100000,
        height: 105,
        borderWidth: 4,
        borderColor: '#fff',
        marginBottom: 50,
        marginHorizontal: 'auto'

    },

    eventTitle: {
        color: '#fff',
        fontSize: 33,
        fontFamily: 'Montserrat-Bold',
    },
    eventSubTitle: {
        color: '#fff',
        fontSize: 16,
        fontFamily: 'Montserrat-Regular',
    },

    eventDate: {
        color: '#bbb',
        fontSize: 16,

        fontFamily: 'Inter-Regular',
    },
    containerDescription: {
        backgroundColor: 'rgba(255, 255, 255, 0.2)',
        borderRadius: 15,
        borderWidth: 0.2,
        borderColor: '#fff',
        padding: 20,
        marginTop: 10,
        justifyContent: 'center',
        textAlign: 'center',
    },
    eventDescription: {
        color: '#fff',
        fontWeight: 100,
        fontSize: 16,
        marginTop: 10,
        fontFamily: 'Raleway-Regular',
    },
    botoes: {
        flexDirection: 'row',
        justifyContent: 'flex-end',
        marginTop: 10,
    },
    botao: {
        padding: 8,
        backgroundColor: 'transparent',
        borderWidth: 0.5,
        borderColor: '#fff',
        borderRadius: 8,
        marginLeft: 10,
    },
    gostar: {
        width: 23,
        height: 23,
        tintColor: '#FFF',
    },

    botaoBaixo: {
        height: 45,
        borderRadius: 10,
        marginTop: 10,
        justifyContent: 'center',
        alignItems: 'center',
        marginHorizontal: 10, // Margem entre os botões
    },
    backButton: {
        backgroundColor: '#fff',
        justifyContent: 'center',
        alignItems: 'center',
        width: '100%',  // Ajuste o tamanho conforme necessário

    },
    containerBotaoBaixo: {
        flexDirection: 'row',
        justifyContent: 'center', // Centraliza o botão horizontalmente
        alignItems: 'center', // Centraliza o botão verticalmente
        width: '100%',
        marginTop: 'auto',
    },
    textoBotao: {
        color: '#000',
        fontSize: 14,
        fontFamily: 'Montserrat-Bold',
    },


    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(0,0,0,0.5)',
    },
    loadingText: {
        marginTop: 10,
        color: '#fff',
        fontSize: 18,
    },
    codeInputContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginVertical: 20,
    },
    input: {
        width: 50,
        height: 50,
        borderColor: 'gray',
        borderWidth: 1,
        borderRadius: 5,
        textAlign: 'center',
        fontSize: 18,
        backgroundColor: '#fff',
        color: '#000',
    },
    modalMessage: {
        marginTop: 20,
        padding: 10,
        backgroundColor: '#fff',
        borderRadius: 8,
        alignItems: 'center',
        justifyContent: 'center',
        width: '80%',
    },
    modalMessageText: {
        fontSize: 18,
        color: '#333',
        fontWeight: 'bold',
    },
    ticketGarantido: {
        backgroundColor: '#fff',
        maxHeight: 300,
        justifyContent: 'center',
        borderBottomRightRadius: 30,
        borderBottomLeftRadius: 30,
        paddingVertical: 35,
        paddingHorizontal: 30,
        marginTop: 20,
    },
    tudoInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    infoText1: {
        fontSize: 14,
        color: '#a1a1a1',
        marginTop: 20,
        fontFamily: 'Inter-Regular',
    },
    infoText2: {
        fontSize: 16,
        color: '#000',
        fontFamily: 'Montserrat-SemiBold',
    },
    ticketTitle: {
        fontFamily: 'Montserrat-SemiBold',
        fontSize: 18,
        textAlign: 'center',
        maxheight: 50,
    },
    repetir: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 15,
        marginBottom: 15,
        width: '100%',
        marginHorizontal: 5,
        justifyContent: 'center',
    },
    repetindo: {
        backgroundColor: '#a1a1a1',
        width: 15,
        height: 0.5,
        marginHorizontal: 2,
    },
    QRcode: {
        width: '100%',
        height: 40,
        justifyContent: 'center',
        backgroundColor: '#a1a1a1',
        marginTop: 10,


    },

});

export default EventoScreen;

