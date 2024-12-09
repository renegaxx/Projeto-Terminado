import 'react-native-gesture-handler';
import React from 'react';
import { View, Text, ActivityIndicator, StyleSheet, Image } from 'react-native'; // Importando componentes para a tela de carregamento
import { useFonts } from 'expo-font';
import Routes from './Routes';

export default function App() {
  const [fontsLoaded] = useFonts({
    'Raleway-Regular': require('./assets/fonts/Raleway-Regular.ttf'),
    'Raleway-Bold': require('./assets/fonts/Raleway-Bold.ttf'),
    'Raleway-SemiBold': require('./assets/fonts/Raleway-SemiBold.ttf'),
    'Montserrat-Regular': require('./assets/fonts/Montserrat-Regular.ttf'),
    'Montserrat-SemiBold': require('./assets/fonts/Montserrat-SemiBold.ttf'),
    'Montserrat-Bold': require('./assets/fonts/Montserrat-Bold.ttf'),
    'Poppins-Regular': require('./assets/fonts/Poppins-Regular.ttf'),
    'Inter-Regular': require('./assets/fonts/Inter_18pt-Regular.ttf'),
    'Manrope-Bold': require('./assets/fonts/Manrope-Bold.ttf'),
    'Manrope-SemiBold': require('./assets/fonts/Manrope-SemiBold.ttf'),

  });

  // Se as fontes ainda não foram carregadas, exibe a tela de carregamento
  if (!fontsLoaded) {
    return (
      <View style={styles.loadingContainer}>
        <Image source={require('./assets/logo.png')} style={styles.logo} />
        <Text style={styles.loadingText}>Carregando Conteúdo...</Text>
        <ActivityIndicator size="large" color="#9F3EFC" />
      </View>
    );
  }

  // Quando as fontes estiverem carregadas, renderiza as rotas
  return <Routes />;
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#000', // Fundo escuro para a tela de carregamento
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    fontFamily: 'Raleway-SemiBold', // Usando a fonte 'Raleway-SemiBold'
    color: '#fff', // Cor branca para o texto
  },
  logo: {
    width: 120, // Tamanho da largura da logo
    height: 120, // Tamanho da altura da logo
    resizeMode: 'contain', // Para garantir que a logo se ajuste corretamente ao tamanho
  },
});
