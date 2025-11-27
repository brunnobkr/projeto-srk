import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  onSnapshot,
  QuerySnapshot,
  DocumentData,
} from 'firebase/firestore';
import { getFirestoreInstance, isFirebaseInitialized } from '../config/firebase';

// Mapeamento de chaves do localStorage para coleções do Firestore
const COLLECTION_MAP: Record<string, string> = {
  srk_receitas_maquina: 'receitas',
  srk_controle_producao: 'producao',
  srk_funcionarios: 'funcionarios',
  srk_controle_funcionarios: 'controleFuncionarios',
  srk_problemas_tecnicos: 'problemas',
  srk_mudancas_melhorias: 'mudancas',
  srk_instrucoes_trabalho: 'instrucoes',
  srk_componentes_produto: 'componentes',
  srk_seguranca_trabalho: 'seguranca',
  srk_historico_versoes: 'historico',
  srk_perfil_usuario: 'perfil',
  srk_acidentes: 'acidentes',
  srk_usuarios: 'usuarios',
  srk_programacoes_pedidos: 'programacoesPedidos',
  srk_setores: 'setores',
  srk_chamados_manutencao: 'chamados',
  srk_mapeamento_funcoes: 'mapeamentoFuncoes',
  srk_mensagens: 'mensagens',
  srk_conversas: 'conversas',
  srk_notificacoes: 'notificacoes',
  srk_chamadas: 'chamadas',
};

// Converter chave do localStorage para nome da coleção
const getCollectionName = (key: string): string => {
  return COLLECTION_MAP[key] || key.replace('srk_', '');
};

// Converter documento do Firestore para objeto JavaScript
const convertFirestoreDoc = (docData: DocumentData): any => {
  const data = docData.data();
  if (!data) return null;

  // Converter Timestamps para strings ISO
  const converted: any = { ...data };
  Object.keys(converted).forEach((key) => {
    if (converted[key] && typeof converted[key].toDate === 'function') {
      converted[key] = converted[key].toDate().toISOString();
    } else if (converted[key] && typeof converted[key] === 'object' && converted[key] !== null) {
      // Recursivamente converter objetos aninhados
      converted[key] = convertFirestoreDoc({ data: () => converted[key] });
    }
  });

  return { id: docData.id, ...converted };
};

export const cloudStorage = {
  // Verificar se Firebase está disponível
  isAvailable: (): boolean => {
    return isFirebaseInitialized();
  },

  // Obter todos os documentos de uma coleção
  getAll: async <T extends { id: string }>(key: string): Promise<T[]> => {
    if (!cloudStorage.isAvailable()) {
      return [];
    }

    try {
      const db = getFirestoreInstance();
      if (!db) return [];

      const collectionName = getCollectionName(key);
      const collectionRef = collection(db, collectionName);
      const snapshot = await getDocs(collectionRef);

      return snapshot.docs.map((doc) => convertFirestoreDoc(doc) as T);
    } catch (error) {
      console.error(`Erro ao buscar ${key} do Firestore:`, error);
      return [];
    }
  },

  // Obter um documento por ID
  getById: async <T extends { id: string }>(key: string, id: string): Promise<T | null> => {
    if (!cloudStorage.isAvailable()) {
      return null;
    }

    try {
      const db = getFirestoreInstance();
      if (!db) return null;

      const collectionName = getCollectionName(key);
      const docRef = doc(db, collectionName, id);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        return convertFirestoreDoc(docSnap) as T;
      }
      return null;
    } catch (error) {
      console.error(`Erro ao buscar ${key}/${id} do Firestore:`, error);
      return null;
    }
  },

  // Adicionar um documento
  add: async <T extends { id: string }>(key: string, item: T): Promise<boolean> => {
    if (!cloudStorage.isAvailable()) {
      return false;
    }

    try {
      const db = getFirestoreInstance();
      if (!db) return false;

      const collectionName = getCollectionName(key);
      const docRef = doc(db, collectionName, item.id);
      await setDoc(docRef, item);

      return true;
    } catch (error) {
      console.error(`Erro ao adicionar ${key} no Firestore:`, error);
      return false;
    }
  },

  // Atualizar um documento
  update: async <T extends { id: string }>(key: string, id: string, updates: Partial<T>): Promise<boolean> => {
    if (!cloudStorage.isAvailable()) {
      return false;
    }

    try {
      const db = getFirestoreInstance();
      if (!db) return false;

      const collectionName = getCollectionName(key);
      const docRef = doc(db, collectionName, id);
      await updateDoc(docRef, updates as any);

      return true;
    } catch (error) {
      console.error(`Erro ao atualizar ${key}/${id} no Firestore:`, error);
      return false;
    }
  },

  // Deletar um documento
  delete: async (key: string, id: string): Promise<boolean> => {
    if (!cloudStorage.isAvailable()) {
      return false;
    }

    try {
      const db = getFirestoreInstance();
      if (!db) return false;

      const collectionName = getCollectionName(key);
      const docRef = doc(db, collectionName, id);
      await deleteDoc(docRef);

      return true;
    } catch (error) {
      console.error(`Erro ao deletar ${key}/${id} do Firestore:`, error);
      return false;
    }
  },

  // Sincronizar dados do localStorage com Firestore
  syncFromLocal: async (key: string, items: any[]): Promise<boolean> => {
    if (!cloudStorage.isAvailable()) {
      return false;
    }

    try {
      const db = getFirestoreInstance();
      if (!db) return false;

      const collectionName = getCollectionName(key);
      const batch = items.map((item) => {
        const docRef = doc(db, collectionName, item.id);
        return setDoc(docRef, item);
      });

      await Promise.all(batch);
      return true;
    } catch (error) {
      console.error(`Erro ao sincronizar ${key} para Firestore:`, error);
      return false;
    }
  },

  // Sincronizar dados do Firestore para localStorage
  syncToLocal: async <T extends { id: string }>(key: string): Promise<T[]> => {
    const items = await cloudStorage.getAll<T>(key);
    if (items.length > 0) {
      try {
        localStorage.setItem(key, JSON.stringify(items));
      } catch (error) {
        console.error(`Erro ao salvar ${key} no localStorage:`, error);
      }
    }
    return items;
  },

  // Escutar mudanças em tempo real
  subscribe: <T extends { id: string }>(
    key: string,
    callback: (items: T[]) => void
  ): (() => void) | null => {
    if (!cloudStorage.isAvailable()) {
      return null;
    }

    try {
      const db = getFirestoreInstance();
      if (!db) return null;

      const collectionName = getCollectionName(key);
      const collectionRef = collection(db, collectionName);
      const q = query(collectionRef);

      const unsubscribe = onSnapshot(
        q,
        (snapshot: QuerySnapshot<DocumentData>) => {
          const items = snapshot.docs.map((doc) => convertFirestoreDoc(doc) as T);
          callback(items);

          // Atualizar localStorage também
          try {
            localStorage.setItem(key, JSON.stringify(items));
          } catch (error) {
            console.error(`Erro ao atualizar localStorage para ${key}:`, error);
          }
        },
        (error) => {
          console.error(`Erro ao escutar mudanças em ${key}:`, error);
        }
      );

      return unsubscribe;
    } catch (error) {
      console.error(`Erro ao criar listener para ${key}:`, error);
      return null;
    }
  },
};

