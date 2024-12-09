import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, StatusBar, Alert, Image,  } from 'react-native';
import { auth } from './firebaseConfig'; // Certifique-se de que o 'auth' está exportado corretamente do seu firebaseConfig
import { signInWithEmailAndPassword, sendPasswordResetEmail } from 'firebase/auth'; // Correção aqui

const Login = ({ navigation }) => {
  const [email, setEmail] = useState(''); // Usando o e-mail para login
  const [password, setPassword] = useState('');

  // Função para login
  const handleLogin = async () => {
    try {
      await signInWithEmailAndPassword(auth, email, password);
      navigation.navigate('Main', { screen: 'Inicial' }); // Altere aqui para a navegação correta
    } catch (error) {
      Alert.alert('Erro', 'Nome de usuário ou senha inválidos.');
    }
  };
  

  // Função para redefinir a senha
  const handleResetPassword = async () => {
    try {
      await sendPasswordResetEmail(auth, email); // Envia o link de redefinição de senha
      Alert.alert('Sucesso', 'Um e-mail de redefinição de senha foi enviado.');
    } catch (error) {
      let errorMessage = 'Erro ao enviar o e-mail de redefinição.';
      
      // Mensagens específicas de erro
      if (error.code === 'auth/user-not-found') {
        errorMessage = 'Este e-mail não está registrado.';
      } else if (error.code === 'auth/invalid-email') {
        errorMessage = 'Formato de e-mail inválido.';
      }
      
      Alert.alert('Erro', errorMessage);
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />
      <Image source={require('./assets/black3.png')} style={styles.imgBack}  />
      
      <View style={styles.content}>
        <Text style={styles.title}>Login</Text>
        <TextInput
          style={styles.input}
          placeholder="E-mail"
          placeholderTextColor="#ccc"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
        />
        <TextInput
          style={styles.input}
          placeholder="Senha"
          placeholderTextColor="#ccc"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
        />
        <TouchableOpacity onPress={handleResetPassword}>
          <Text style={styles.resetText}>Esqueceu a senha?</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.button} onPress={handleLogin}>
          <Text style={styles.buttonText}>Entrar</Text>
        </TouchableOpacity>
        
        <View style={styles.textAcesso}>
          <Text style={styles.textAcessoText}>Não tem uma conta? </Text>
          <TouchableOpacity onPress={() => navigation.navigate('Cadastro')}>
            <Text style={styles.textAcessoLink}>Clique Aqui</Text>
          </TouchableOpacity>
        </View>
      </View>
      
    </View>
  );
};

const styles = StyleSheet.create({
  backgroundImageColor: {
    position: 'absolute',
    width: 700, // Largura fixa
    height: '100%', // Altura total
    left: '50%', // Move para o centro
    transform: [{ translateX: -150 }], // Ajusta metade da largura para centralizar
    top: 350,
    

  },
  imgBack :{
    position: 'absolute',
    width: 500,
    height: 500,
    top: 450,
    zIndex: 1
  },
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    zIndex: 10,
  },
  title: {
    fontSize: 32,
    fontFamily: 'Raleway-Bold',
    marginBottom: 20,
    color: 'white',
    zIndex: 10,
  },
  input: {
    height: 50,
    width: '100%',
    borderColor: '#fff',
    borderWidth: 1.5,
    borderRadius: 10,
    paddingHorizontal: 20,
    color: 'white',
    fontFamily: 'Raleway-Regular',
    marginBottom: 20,
    backgroundColor: 'transparent',
    zIndex: 10,
  },
  button: {
    backgroundColor: '#9F3EFC',
    width: '100%',
    height: 55,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 17,
    marginTop: 30,
    zIndex: 10,
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
    fontFamily: 'Raleway-SemiBold',
  },
  resetText: {
    color: '#9F3EFC',
    fontFamily: 'Raleway-SemiBold',
    fontSize: 15,
    marginTop: 20,
  },
  textAcesso: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 30,
    zIndex:10
  },
  textAcessoText: {
    color: 'white',
    marginRight: 5,
    fontFamily: 'Raleway-Regular',
    fontSize: 15,
    zIndex: 10,
  },
  textAcessoLink: {
    color: '#9F3EFC',
    fontFamily: 'Raleway-SemiBold',
    fontSize: 15,
    zIndex: 10
  },
});

export default Login;
