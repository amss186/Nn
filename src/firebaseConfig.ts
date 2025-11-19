import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';

// Config fournie depuis ta console Firebase
const firebaseConfig = {
  apiKey: 'AIzaSyB31MfZcNtdDO3gdyYqCeO4NbpVMQct6Oc',
  authDomain: 'malin-wallet.firebaseapp.com',
  projectId: 'malin-wallet',
  storageBucket: 'malin-wallet.firebasestorage.app',
  messagingSenderId: '341622379332',
  appId: '1:341622379332:web:62db22e44925d96f77fd11',
  measurementId: 'G-0TT4MBSWCX',
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
