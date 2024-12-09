import { initializeApp } from 'firebase/app';
import { getAuth, initializeAuth, getReactNativePersistence } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';  // Firebase Storage para upload de arquivos
import ReactNativeAsyncStorage from '@react-native-async-storage/async-storage';

// Configuração do Firebase
const firebaseConfig = {
  apiKey: "AIzaSyAkP-I25nJEg6euMw70y09_7d6SpMQPBL0",
  authDomain: "puthype-server.firebaseapp.com",
  projectId: "puthype-server",
  storageBucket: "puthype-server.appspot.com", // Verifique se o storageBucket está correto
  messagingSenderId: "453444696907",
  appId: "1:453444696907:web:fb9b901e785c56cd97c6ce"
};

// Inicializar o Firebase
const app = initializeApp(firebaseConfig);

// Inicializar o Firestore
const db = getFirestore(app);

// Inicializar o Firebase Storage para gerenciar uploads de imagem
const storage = getStorage(app);

// **Lógica de inicialização do Auth com AsyncStorage**
let auth = getAuth(app);  // Sempre pega a instância global de Auth

// Verificando se o Auth foi inicializado corretamente com persistência
if (!auth._getPersistence) {
  auth = initializeAuth(app, {
    persistence: getReactNativePersistence(ReactNativeAsyncStorage),
  });
}

export { auth, db, storage };
