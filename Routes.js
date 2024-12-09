import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { NavigationContainer, DefaultTheme } from '@react-navigation/native'; // Importar DefaultTheme

import Inicio from './Inicio'; // Tela inicial
import Login from './Login';
import Cadastro from './Cadastro';
import TelaInicial from './TelaInicial';

import MessagesScreen from './MessagesScreen'; // Importação da tela de mensagens
import UsuariosConversas from './UsuariosConversas';
import PesquisarScreen from './PesquisarScreen';
import NetworkingScreen from './NetworkingScreen';
import CriarEvento from './CriarEvento';
import CriarComunidade from './CriarComunidade';
import NotificationsScreen from './NotificationsScreen';
import EventoScreen from './EventoScreen';
import ComunidadeScreen from './ComunidadeScreen';


import { Image, StyleSheet } from 'react-native';

const Stack = createStackNavigator();
const Tab = createBottomTabNavigator();

// Bottom Tab Navigator para o footer
function BottomTabs() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: 'rgba(0, 0, 0, 0.8)',
          borderTopLeftRadius: 25, // Adiciona arredondamento no canto superior esquerdo
          borderTopRightRadius: 25, // Adiciona arredondamento no canto superior direito
          elevation: 0, // Remove a sombra (se necessário)
          position: 'absolute', // Garante que a barra seja fixa na parte inferior
          paddingVertical: 5,
          
        },
        tabBarActiveTintColor: '#9F3EFC', // Cor do ícone ativo
        tabBarInactiveTintColor: '#888', // Cor do ícone inativo
        tabBarShowLabel: true, // Habilita a exibição do nome de cada aba
        tabBarLabelStyle: {
          fontSize: 12, // Tamanho da fonte do nome
          paddingBottom: 5, // Espaçamento entre o ícone e o nome
        },
      }}
    >
      <Tab.Screen
        name="Pesquisar"
        component={PesquisarScreen}
        options={{
          tabBarIcon: ({ color }) => (
            <Image
              source={require('./assets/icons/pesquisarImg.png')}
              style={[styles.footerIcon, { tintColor: color }]}
            />
          ),
        }}
      />

      <Tab.Screen
        name="Networking"
        component={NetworkingScreen}
        options={{
          tabBarIcon: ({ color }) => (
            <Image
              source={require('./assets/icons/networkingImg.png')}
              style={[styles.footerIcon, { tintColor: color }]}
            />
          ),
        }}
      />
      
      <Tab.Screen
        name="Inicial"
        component={TelaInicial}
        options={{
          tabBarIcon: ({ color }) => (
            <Image
              source={require('./assets/icons/homeImg.png')}
              style={[styles.footerIcon, { tintColor: color }]}
            />
          ),
        }}
      />

      <Tab.Screen
        name="Conversas"
        component={UsuariosConversas}
        options={{
          tabBarIcon: ({ color }) => (
            <Image
              source={require('./assets/icons/messageImg.png')}
              style={[styles.footerIcon, { tintColor: color }]}
            />
          ),
        }}
      />
      
      <Tab.Screen
        name="Notificações"
        component={NotificationsScreen} // Tela de Notificações
        options={{
          tabBarIcon: ({ color }) => (
            <Image
              source={require('./assets/icons/notificationImg.png')}
              style={[styles.footerIcon, { tintColor: color }]}
            />
          ),
        }}
      />
    </Tab.Navigator>
  );
}

// Stack Navigator principal
function Routes() {
  return (
    <NavigationContainer
      theme={{
        ...DefaultTheme, // Começa com o tema padrão
        colors: {
          ...DefaultTheme.colors,
          background: '#000', // Fundo escuro para a navegação
          card: '#1A1A1A', // Cor do fundo do cartão
          text: '#FFF', // Cor do texto
          border: '#444', // Cor de borda dos componentes
        },
      }}
    >
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name="Inicio" component={Inicio} />
        <Stack.Screen name="Login" component={Login} />
        <Stack.Screen name="Cadastro" component={Cadastro} />
        <Stack.Screen name="Main" component={BottomTabs} />
        <Stack.Screen name="MessagesScreen" component={MessagesScreen} />
        <Stack.Screen name="CriarEvento" component={CriarEvento} />
        <Stack.Screen name="CriarComunidade" component={CriarComunidade} />
        <Stack.Screen name="EventoScreen" component={EventoScreen} />
        <Stack.Screen name="ComunidadeScreen" component={ComunidadeScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  footerIcon: { width: 24, height: 24 },
});

export default Routes;
