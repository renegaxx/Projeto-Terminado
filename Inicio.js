import { useFonts } from 'expo-font';
import AppLoading from 'expo-app-loading';
import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity, Animated, StatusBar, ImageBackground,  } from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native'; // Importando useNavigation

export default function Inicio() {
  const navigation = useNavigation(); // Hook de navegação

  // Animações para as imagens black1.png e black2.png
  const black1Anim = useRef(new Animated.Value(0)).current;
  const black2Anim = useRef(new Animated.Value(0)).current;
  const black1ScaleAnim = useRef(new Animated.Value(2)).current;
  const black2ScaleAnim = useRef(new Animated.Value(2)).current;

  // Animação de opacidade para os elementos
  const [isStarted, setIsStarted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Animação de piscar do eclipse
  const eclipseOpacity = useRef(new Animated.Value(1)).current;

  // Função para iniciar as animações
  const startAnimations = () => {
    Animated.sequence([
      Animated.delay(1000),
      Animated.parallel([
        Animated.timing(black1Anim, {
          toValue: 1,
          duration: 1500,
          useNativeDriver: true,
        }),
        Animated.timing(black2Anim, {
          toValue: 1,
          duration: 1500,
          useNativeDriver: true,
        }),
        Animated.timing(black1ScaleAnim, {
          toValue: 1,
          duration: 1500,
          useNativeDriver: true,
        }),
        Animated.timing(black2ScaleAnim, {
          toValue: 1,
          duration: 1500,
          useNativeDriver: true,
        }),
      ]),
    ]).start();

    // Animação de piscar do eclipse
    Animated.loop(
      Animated.sequence([
        Animated.timing(eclipseOpacity, {
          toValue: 0.5,
          duration: 1500,
          useNativeDriver: true,
        }),
        Animated.timing(eclipseOpacity, {
          toValue: 1,
          duration: 1500,
          useNativeDriver: true,
        }),
      ])
    ).start();
  };

  // useEffect para inicializar as animações ao carregar a tela pela primeira vez
  useEffect(() => {
    startAnimations();
  }, []);

  // useFocusEffect para reiniciar a tela sempre que ela for focada
  useFocusEffect(
    React.useCallback(() => {
      black1Anim.setValue(0);
      black2Anim.setValue(0);
      black1ScaleAnim.setValue(2);
      black2ScaleAnim.setValue(2);
      eclipseOpacity.setValue(1);
      setIsStarted(false);
      setIsLoading(false);

      // Iniciar novamente as animações
      startAnimations();

      return () => { };
    }, [])
  );

  // Função que é chamada ao pressionar o botão "Iniciar"
  const handlePress = () => {
    setIsStarted(true);

    // Animação de movimento para black1 e black2
    Animated.parallel([
      Animated.timing(black1Anim, {
        toValue: 2,
        duration: 1000,
        useNativeDriver: true,
      }),
      Animated.timing(black2Anim, {
        toValue: 2,
        duration: 1000,
        useNativeDriver: true,
      }),
    ]).start(() => {
      setIsLoading(true);
      // Navegar para a tela de login
      setTimeout(() => {
        navigation.navigate('Login'); // Redireciona para a tela de Login
      }, 5000); // Aguarda 5 segundos antes de navegar
    });
  };

  return (
    <View style={styles.container}>
      {/* StatusBar para alterar os ícones da barra de notificações para branco */}
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />

      {/* Imagem black1 com animação */}
      <Animated.Image
        source={require('./assets/black1.png')}
        style={[styles.blacks2, {
          transform: [
            {
              translateY: black1Anim.interpolate({
                inputRange: [0, 1, 2],
                outputRange: [-600, -350, -1000],
              })
            },
            {
              translateX: black1Anim.interpolate({
                inputRange: [0, 1],
                outputRange: [-100, 0],
              })
            },
            { scale: black1ScaleAnim },
          ],
        }]}
        blurRadius={10}
      />

      {/* Imagem black2 com animação */}
      <Animated.Image
        source={require('./assets/black2.png')}
        style={[styles.blacks, {
          transform: [
            {
              translateY: black2Anim.interpolate({
                inputRange: [0, 1, 2],
                outputRange: [350, 420, 1000],
              })
            },
            {
              translateX: black2Anim.interpolate({
                inputRange: [0, 1],
                outputRange: [250, -110],
              })
            },
            { scale: black2ScaleAnim },
          ],
          zIndex: 1, // black2 atrás do botão
        }]}
        blurRadius={10}
      />

      {/* Botões e logo */}
      <Animated.View style={[styles.buttonContainer, { opacity: isStarted ? 0 : 1 }]}>
        <TouchableOpacity style={styles.button} onPress={() => console.log('Bem-Vindo pressionado!')}>
          <Text style={styles.buttonText}>Bem-Vindo</Text>
        </TouchableOpacity>
      </Animated.View>

      <View style={[styles.meio, { opacity: isStarted ? 0 : 1 }]}>
        <Image
          source={require('./assets/logo.png')}
          style={styles.imagem}
        />
        <Text style={styles.texto}>Tudo para o seu networking</Text>
      </View>
      
        <Animated.View style={[styles.button2, { opacity: isStarted ? 0 : 1 }]}>
        <ImageBackground
        source={require('./assets/gradienteBotao.png')}
        style={styles.backgroundImage2}
        resizeMode="cover"
      >
          <TouchableOpacity style={styles.button2} onPress={handlePress}>
          <Image
            source={require('./assets/enterRightImg.png')}
            style={styles.iconRight}
          />
            <Text style={styles.buttonText2}>Iniciar</Text>
          </TouchableOpacity>
          </ImageBackground>
        </Animated.View>
      

      <Animated.Image
        source={require('./assets/eclipse1.png')}
        style={[styles.imagem3, { opacity: eclipseOpacity, zIndex: 0 }]} // Eclipse atrás
      />

      {/* Componente de loading */}
      {isLoading && (
        <View style={styles.loadingContainer}>
          <Image
            source={require('./assets/Carregamento.png')}
            style={styles.loadingImage}
          />
          <Text style={styles.carregandoText}></Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  backgroundImage2: {
    overflow: 'hidden',
    width: '100%',
    height: 65,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 23,
    zIndex: 2, // Botão "Iniciar" na frente
    borderColor: '#9F3EFC'

  },
  iconRight: {
    width: 35,
    height: 35,
    marginRight: 5,
    marginTop: 3,

  },
  container: {
    flex: 1,
    backgroundColor: '#000',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  imagem3: {
    position: 'absolute',
    top: 190,
    width: 2400,
    height: 900,
    resizeMode: 'contain',
    zIndex: 0, // Eclipse atrás
  },
  buttonContainer: {
    position: 'absolute',
    top: 40,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 2, // Os botões estão sobre a imagem eclipse
  },
  button: {
    backgroundColor: '#9F3EFC',
    width: 90,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
    height: 25,
    marginBottom: 20,
  },
  buttonText: {
    color: '#fff',
    fontSize: 10,
    fontFamily: 'Raleway-Bold',
    textAlign: 'center',
  },
  blacks: {
    width: 600,
    height: 600,
    resizeMode: 'contain',
    position: 'absolute',
  },
  blacks2: {
    width: 700,
    height: 700,
    resizeMode: 'contain',
    position: 'absolute',
    left: 10,
  },
  button2: {
    width: '100%',
    height: 65,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 17,
    zIndex: 2, // Botão "Iniciar" na frente
    flexDirection: 'row'
  },
  buttonText2: {
    color: '#fff',
    fontSize: 20,
    textAlign: 'center',
    fontFamily: 'Raleway-SemiBold',
  },
  meio: {
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 130,
    zIndex: 2,
  },
  imagem: {
    width: 205,
    resizeMode: 'contain',
  },
  texto: {
    fontFamily: 'Raleway-Regular',
    color: '#fff',
    fontSize: 29,
    textAlign: 'center',
    marginBottom: 100,
  },
  loadingContainer: {
    position: 'absolute',
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
    height: '100%',

    zIndex: 3, // Loading acima de tudo
  },
  loadingImage: {
    width: 100,
    height: 100,
    resizeMode: 'contain',
  },
});
