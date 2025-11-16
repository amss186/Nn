import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import useWalletStore from '../store/walletStore';

function LockedScreen() {
  const unlockWallet = useWalletStore((state) => state.actions.unlockWallet);

  return (
    <View style={styles.container}>
      <Text style={styles.icon}>🔒</Text>
      <Text style={styles.title}>Portefeuille Verrouillé</Text>
      <Text style={styles.subtitle}>
        Déverrouillez votre portefeuille pour continuer
      </Text>
      <TouchableOpacity style={styles.button} onPress={unlockWallet}>
        <Text style={styles.buttonText}>Déverrouiller</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#fff',
  },
  icon: {
    fontSize: 80,
    marginBottom: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#333',
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    marginBottom: 40,
    textAlign: 'center',
  },
  button: {
    backgroundColor: '#007AFF',
    paddingVertical: 15,
    paddingHorizontal: 40,
    borderRadius: 10,
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
});

export default LockedScreen;
