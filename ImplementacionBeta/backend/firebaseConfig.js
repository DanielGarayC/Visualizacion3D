import { initializeApp } from 'firebase/app';
import { getStorage, connectStorageEmulator } from 'firebase/storage';
import { getFirestore, connectFirestoreEmulator } from 'firebase/firestore';

//http://localhost:4000/
const firebaseConfig = {
  apiKey: "fake-api-key",                // se usara al implementar en cloud
  projectId: "modelo3d-local",           // Solo para referencia interna
  storageBucket: "modelo3d-local.appspot.com"
};

// Inicializar Firebase App
const app = initializeApp(firebaseConfig);

// Conectar Firestore y Storage al emulador local
const db = getFirestore(app);
connectFirestoreEmulator(db, 'localhost', 8080);

const storage = getStorage(app);
connectStorageEmulator(storage, 'localhost', 9199);

// Exportar para uso en otros módulos
export { db, storage };
