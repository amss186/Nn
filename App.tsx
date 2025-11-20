import React, { useEffect, useState, useRef } from 'react';
import { NavigationContainer, NavigationContainerRef } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Provider as PaperProvider } from 'react-native-paper';
import { Platform } from 'react-native';
import Toast from 'react-native-toast-message';

import OnboardingScreen from './src/components/OnboardingScreen.jsx';
import BackupScreen from './src/components/BackupScreen.jsx';
import BackupVerifyScreen from './src/components/BackupVerifyScreen.jsx';
import LockedScreen from './src/components/LockedScreen.jsx';
import DashboardScreen from './src/components/DashboardScreen.jsx';
import SendScreen from './src/components/SendScreen.jsx';
import ReceiveScreen from './src/components/ReceiveScreen.jsx';
import ScanScreen from './src/screens/ScanScreen';
import WalletConnectModal from './src/components/WalletConnectModal';
import AuthScreen from './src/screens/AuthScreen';

import useWalletStore from './src/store/walletStore';
import {
  observeAuthState,
  AuthUser,
  handleRedirectResultOnLoad,
  linkWalletAddressToUser
} from './src/services/authService';
import './src/firebaseConfig';

const Stack = createNativeStackNavigator();

export default function App() {
  const navRef = useRef<NavigationContainerRef<any>>(null);

  const isWalletCreated    = useWalletStore((s) => s.isWalletCreated);
  const isWalletUnlocked   = useWalletStore((s) => s.isWalletUnlocked);
  const needsBackup        = useWalletStore((s) => s.needsBackup);
  const hasBackedUp        = useWalletStore((s) => s.hasBackedUp);
  const walletAddress      = useWalletStore((s) => s.address);
  const checkStorage       = useWalletStore((s) => s.actions.checkStorage);
  const walletStore        = useWalletStore();

  const [firebaseUser, setFirebaseUser] = useState<AuthUser | null>(null);
  const [authLoading, setAuthLoading]   = useState(true);

  // 1. Vérifier l'existence locale du portefeuille
  useEffect(() => {
    checkStorage();
  }, [checkStorage]);

  // 2. Gérer le retour Google redirect (web)
  useEffect(() => {
    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      handleRedirectResultOnLoad()
        .then((user) => {
          if (user) {
            Toast.show({
              type: 'success',
              text1: 'Connecté avec Google',
              text2: `Bienvenue ${user.email}`,
            });

            if (walletStore.isWalletCreated && walletAddress) {
              linkWalletAddressToUser(user.uid, walletAddress)
                .then(() => {
                  Toast.show({
                    type: 'success',
                    text1: 'Portefeuille lié',
                    text2: 'Adresse liée à votre compte.',
                  });
                })
                .catch((err) => console.error('Link wallet after redirect error:', err));
            } else {
              Toast.show({
                type: 'info',
                text1: 'Aucun portefeuille trouvé',
                text2: 'Crée ou importe ton portefeuille.',
              });
            }
          }
        })
        .catch((err) => {
          console.error('Redirect result error:', err);
          Toast.show({
            type: 'error',
            text1: 'Erreur',
            text2: 'Impossible de finaliser la connexion Google.',
          });
        });
    }
  }, []);

  // 3. Observer Firebase (web)
  useEffect(() => {
    if (Platform.OS === 'web') {
      const unsub = observeAuthState((user) => {
        setFirebaseUser(user);
        setAuthLoading(false);
      });
      return unsub;
    } else {
      setAuthLoading(false);
    }
  }, []);

  // 4. Redirection centralisée quand état change
  useEffect(() => {
    if (authLoading) return;

    const needsAuth = Platform.OS === 'web' && (!firebaseUser || !firebaseUser.emailVerified);

    if (needsAuth) {
      if (navRef.current?.getCurrentRoute()?.name !== 'Auth') {
        navRef.current?.navigate('Auth');
      }
      return;
    }

    // Auth OK : choisir destination
    if (!isWalletCreated) {
      if (navRef.current?.getCurrentRoute()?.name !== 'Onboarding') {
        navRef.current?.reset({ index: 0, routes: [{ name: 'Onboarding' }] });
      }
      return;
    }

    if (needsBackup && !hasBackedUp) {
      if (navRef.current?.getCurrentRoute()?.name !== 'Backup') {
        navRef.current?.reset({ index: 0, routes: [{ name: 'Backup' }] });
      }
      return;
    }

    if (!isWalletUnlocked) {
      if (navRef.current?.getCurrentRoute()?.name !== 'Locked') {
        navRef.current?.reset({ index: 0, routes: [{ name: 'Locked' }] });
      }
      return;
    }

    // Tout bon -> Dashboard
    if (navRef.current?.getCurrentRoute()?.name !== 'Dashboard') {
      navRef.current?.reset({ index: 0, routes: [{ name: 'Dashboard' }] });
    }
  }, [
    authLoading,
    firebaseUser,
    firebaseUser?.emailVerified,
    isWalletCreated,
    needsBackup,
    hasBackedUp,
    isWalletUnlocked
  ]);

  if (authLoading && Platform.OS === 'web') {
    return null;
  }

  const needsAuth = Platform.OS === 'web' && (!firebaseUser || !firebaseUser.emailVerified);

  return (
    <PaperProvider>
      <NavigationContainer ref={navRef}>
        <Stack.Navigator screenOptions={{ headerShown: false }}>
          {/* On garde toutes les routes pour les navigations programmatiques */}
          <Stack.Screen name="Auth" component={AuthScreen} />
          <Stack.Screen name="Onboarding" component={OnboardingScreen} />
          <Stack.Screen name="Backup" component={BackupScreen} />
          <Stack.Screen name="BackupVerify" component={BackupVerifyScreen} />
          <Stack.Screen name="Locked" component={LockedScreen} />
            <Stack.Screen name="Dashboard" component={DashboardScreen} />
          <Stack.Screen name="Send" component={SendScreen} />
          <Stack.Screen name="Receive" component={ReceiveScreen} />
          <Stack.Screen name="Scan" component={ScanScreen} />
        </Stack.Navigator>
        <WalletConnectModal />
        <Toast />
      </NavigationContainer>
    </PaperProvider>
  );
}