import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Clipboard } from 'react-native';
import QRCode from 'react-native-qrcode-svg';
import useWalletStore from '../store/walletStore';

function ReceiveScreen() {
  const [copiedMessage, setCopiedMessage] = useState(false);
  const address = useWalletStore((state) => state.address);
  const setScreen = useWalletStore((state) => state.actions.setScreen);

  const handleBack = () => {
    setScreen('dashboard');
  };

  const handleCopyAddress = () => {
    Clipboard.setString(address);
    setCopiedMessage(true);
    setTimeout(() => {
      setCopiedMessage(false);
    }, 2000);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Recevoir des fonds</Text>

      <TouchableOpacity 
        style={[styles.button, styles.secondaryButton]} 
        onPress={handleBack}>
        <Text style={styles.secondaryButtonText}>Retour</Text>
      </TouchableOpacity>

      <View style={styles.qrContainer}>
        <QRCode value={address} size={250} />
      </View>

      <View style={styles.addressContainer}>
        <Text style={styles.label}>Votre adresse :</Text>
        <Text style={styles.address}>{address}</Text>
      </View>

      <TouchableOpacity 
        style={styles.button} 
        onPress={handleCopyAddress}>
        <Text style={styles.buttonText}>Copier l'adresse</Text>
      </TouchableOpacity>

      {copiedMessage && (
        <View style={styles.messageContainer}>
          <Text style={styles.messageText}>Copié !</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    marginBottom: 20,
    color: '#333',
    textAlign: 'center',
  },
  qrContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 30,
    padding: 20,
    backgroundColor: '#F5F5F5',
    borderRadius: 10,
  },
  addressContainer: {
    backgroundColor: '#F5F5F5',
    borderRadius: 10,
    padding: 15,
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
    fontWeight: '600',
  },
  address: {
    fontSize: 14,
    color: '#333',
    fontFamily: 'monospace',
    flexWrap: 'wrap',
  },
  button: {
    backgroundColor: '#007AFF',
    paddingVertical: 15,
    borderRadius: 10,
    alignItems: 'center',
    marginBottom: 15,
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
  secondaryButton: {
    backgroundColor: '#fff',
    borderWidth: 2,
    borderColor: '#007AFF',
  },
  secondaryButtonText: {
    color: '#007AFF',
    fontSize: 18,
    fontWeight: '600',
  },
  messageContainer: {
    backgroundColor: '#E5F6E5',
    borderRadius: 10,
    padding: 15,
    alignItems: 'center',
  },
  messageText: {
    color: '#2E7D32',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default ReceiveScreen;
