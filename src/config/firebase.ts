import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';

// Configuração do Firebase
export const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyCTTNjRiem7WLVEmA85ZOfeXh7OiAiGyuo",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "project-ded1e.firebaseapp.com",
  databaseURL: import.meta.env.VITE_FIREBASE_DATABASE_URL || "https://project-ded1e-default-rtdb.firebaseio.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "project-ded1e",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "project-ded1e.firebasestorage.app",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "428024696641",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:428024696641:web:35d12a873ce9e0ca77dbc0"
};

// Admin UID do painel editorial/gestor
export const ADMIN_UID = import.meta.env.VITE_ADMIN_UID || "PFmlUD9TfnhqwGYuHVaa86EsANl1";

// Inicialização segura do Firebase singleton
export const firebaseApp = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);

// Inicialização da instância do Firestore
export const db = getFirestore(firebaseApp);
