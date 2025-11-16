import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import useWalletStore from '../store/walletStore';

function OnboardingScreen({ onWalletCreated }) {
  const createWallet = useWalletStore((state) => state.actions.createWallet);

  const handleCreateWallet = async () => {
    const mnemonic = await createWallet();
    if (onWalletCreated) {
      onWalletCreated(mnemonic);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Bienvenue</Text>
      <Text style={styles.subtitle}>Créez votre portefeuille sécurisé</Text>
      <TouchableOpacity style={styles.button} onPress={handleCreateWallet}>
        <Text style={styles.buttonText}>Créer mon portefeuille</Text>
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
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#333',
  },
  subtitle: {
    fontSize: 18,
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

export default OnboardingScreen;
