/**
 * Sample React Native App
 * https://github.com/facebook/react-native
 *
 * @format
 */

import React, { useEffect } from 'react';
import { StatusBar, StyleSheet, useColorScheme, View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import useWalletStore from './src/store/walletStore';
import OnboardingScreen from './src/components/OnboardingScreen';
import BackupScreen from './src/components/BackupScreen';
import BackupVerifyScreen from './src/components/BackupVerifyScreen';
import LockedScreen from './src/components/LockedScreen';
import DashboardScreen from './src/components/DashboardScreen';
import SendScreen from './src/components/SendScreen';
import ReceiveScreen from './src/components/ReceiveScreen';

function App() {
  const isDarkMode = useColorScheme() === 'dark';

  return (
    <SafeAreaProvider>
      <StatusBar barStyle={isDarkMode ? 'light-content' : 'dark-content'} />
      <AppContent />
    </SafeAreaProvider>
  );
}

function AppContent() {
  const isWalletCreated = useWalletStore((state) => state.isWalletCreated);
  const isWalletUnlocked = useWalletStore((state) => state.isWalletUnlocked);
  const needsBackup = useWalletStore((state) => state.needsBackup);
  const currentScreen = useWalletStore((state) => state.currentScreen);
  const checkStorage = useWalletStore((state) => state.actions.checkStorage);

  useEffect(() => {
    checkStorage();
  }, [checkStorage]);

  let screen;
  if (!isWalletCreated) {
    screen = <OnboardingScreen />;
  } else if (needsBackup) {
    if (currentScreen === 'backupVerify') {
      screen = <BackupVerifyScreen />;
    } else {
      screen = <BackupScreen />;
    }
  } else if (!isWalletUnlocked) {
    screen = <LockedScreen />;
  } else {
    // Wallet is unlocked, show screen based on currentScreen state
    if (currentScreen === 'send') {
      screen = <SendScreen />;
    } else if (currentScreen === 'receive') {
      screen = <ReceiveScreen />;
    } else {
      screen = <DashboardScreen />;
    }
  }

  return (
    <View style={styles.container}>
      {screen}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});

export default App;
