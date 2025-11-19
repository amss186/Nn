
import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Provider as PaperProvider } from 'react-native-paper';
import Toast from 'react-native-toast-message';

// CORRECTION DES CHEMINS : On utilise 'screens' au lieu de 'components'
// Si ça plante encore, vérifie si tes dossiers s'appellent 'screens' ou 'components'
import OnboardingScreen from './src/screens/OnboardingScreen';
import BackupScreen from './src/screens/BackupScreen';
import LockedScreen from './src/screens/LockedScreen';
import DashboardScreen from './src/screens/DashboardScreen';
import SendScreen from './src/screens/SendScreen';
// import ReceiveScreen from './src/screens/ReceiveScreen'; // Décommente si le fichier existe
// import BackupVerifyScreen from './src/screens/BackupVerifyScreen'; // Décommente si le fichier existe

import { useWalletStore } from './src/store/walletStore';

const Stack = createNativeStackNavigator();

export default function App() {
  const isWalletCreated = useWalletStore((state) => state.isWalletCreated);
  const isWalletUnlocked = useWalletStore((state) => state.isWalletUnlocked);
  const needsBackup = useWalletStore((state) => state.needsBackup);

  return (
    <PaperProvider>
      <NavigationContainer>
        <Stack.Navigator screenOptions={{ headerShown: false }}>
          {!isWalletCreated ? (
            <Stack.Screen name="Onboarding" component={OnboardingScreen} />
          ) : needsBackup ? (
            <Stack.Screen name="Backup" component={BackupScreen} />
          ) : !isWalletUnlocked ? (
            <Stack.Screen name="Locked" component={LockedScreen} />
          ) : (
            <>
              <Stack.Screen name="Dashboard" component={DashboardScreen} />
              <Stack.Screen name="Send" component={SendScreen} />
            </>
          )}
        </Stack.Navigator>
        <Toast />
      </NavigationContainer>
    </PaperProvider>
  );
}



