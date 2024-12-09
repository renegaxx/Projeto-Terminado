// getUsername.js
import { doc, getDoc } from 'firebase/firestore';
import { db } from './firebaseConfig'; // Certifique-se de que o db está sendo importado corretamente

export const getUsername = async (uid) => {
  try {
    const userDocRef = doc(db, 'users', uid); // Aqui você se refere ao documento do usuário na coleção 'users'
    const userDoc = await getDoc(userDocRef);

    if (userDoc.exists()) {
      const data = userDoc.data();
      return data.username; // Retorna o nome de usuário
    } else {
      throw new Error('Usuário não encontrado'); // Trate o erro se necessário
    }
  } catch (error) {
    console.error("Erro ao buscar username:", error); // Adicione um log para verificar o erro
    throw error; // Repassa o erro para o handler de erro
  }
};
