import { initializeApp, FirebaseApp } from 'firebase/app';
import { getFirestore, Firestore, enableIndexedDbPersistence } from 'firebase/firestore';
import { getAuth, Auth } from 'firebase/auth';

export interface FirebaseConfig {
  apiKey: string;
  authDomain: string;
  projectId: string;
  storageBucket: string;
  messagingSenderId: string;
  appId: string;
}

let app: FirebaseApp | null = null;
let db: Firestore | null = null;
let auth: Auth | null = null;
let isInitialized = false;

export const initializeFirebase = (config: FirebaseConfig): boolean => {
  try {
    if (isInitialized && app) {
      return true;
    }

    app = initializeApp(config);
    db = getFirestore(app);
    auth = getAuth(app);

    // Habilitar persistência offline
    enableIndexedDbPersistence(db).catch((err) => {
      if (err.code === 'failed-precondition') {
        console.warn('Persistência offline não disponível (múltiplas abas abertas)');
      } else if (err.code === 'unimplemented') {
        console.warn('Persistência offline não suportada neste navegador');
      }
    });

    isInitialized = true;
    return true;
  } catch (error) {
    console.error('Erro ao inicializar Firebase:', error);
    return false;
  }
};

export const getFirestoreInstance = (): Firestore | null => {
  return db;
};

export const getAuthInstance = (): Auth | null => {
  return auth;
};

export const isFirebaseInitialized = (): boolean => {
  return isInitialized && app !== null && db !== null;
};

export const clearFirebase = (): void => {
  app = null;
  db = null;
  auth = null;
  isInitialized = false;
};

