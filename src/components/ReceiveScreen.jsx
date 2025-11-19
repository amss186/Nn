import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform, Alert } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import useWalletStore from '../store/walletStore';

// Dynamically import QRCode only on native platforms
let QRCode = null;
if (Platform.OS !== 'web') {
  try {
    QRCode = require('react-native-qrcode-svg').default;
  } catch (e) {
    console.log('QRCode library not available');
  }
}

function ReceiveScreen() {
  const [copiedMessage, setCopiedMessage] = useState(false);
  const address = useWalletStore((state) => state.address);
  const setScreen = useWalletStore((state) => state.actions.setScreen);
  
  // Use React Navigation when available (web/App.tsx)
  let navigation = null;
  try {
    navigation = useNavigation();
  } catch (e) {
    // Navigation not available (App.jsx), will use store-based navigation
  }

  const handleBack = () => {
    // For store-based navigation (App.jsx)
    setScreen('dashboard');
    
    // For React Navigation (App.tsx / web)
    if (navigation && typeof navigation.goBack === 'function') {
      try {
        navigation.goBack();
      } catch (e) {
        console.log('Navigation goBack failed:', e);
      }
    }
  };

  const handleCopyAddress = async () => {
    try {
      // Try web clipboard API first
      if (Platform.OS === 'web' && navigator.clipboard) {
        await navigator.clipboard.writeText(address);
        setCopiedMessage(true);
        setTimeout(() => {
          setCopiedMessage(false);
        }, 2000);
      } else {
        // Fallback to React Native Clipboard
        const { default: Clipboard } = await import('react-native').then(rn => ({ default: rn.Clipboard }));
        Clipboard.setString(address);
        setCopiedMessage(true);
        setTimeout(() => {
          setCopiedMessage(false);
        }, 2000);
      }
    } catch (error) {
      console.log('Failed to copy address:', error);
      Alert.alert('Erreur', 'Impossible de copier l\'adresse');
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Recevoir des fonds</Text>

      <TouchableOpacity 
        style={[styles.button, styles.secondaryButton]} 
        onPress={handleBack}>
        <Text style={styles.secondaryButtonText}>Retour</Text>
      </TouchableOpacity>

      {QRCode ? (
        <View style={styles.qrContainer}>
          <QRCode value={address} size={250} />
        </View>
      ) : (
        <View style={styles.qrContainer}>
          <Text style={styles.qrPlaceholder}>
            📱 Le QR code est disponible uniquement sur l'application mobile.
          </Text>
          <Text style={styles.qrSubtext}>
            Utilisez le bouton "Copier l'adresse" ci-dessous pour partager votre adresse.
          </Text>
        </View>
      )}

      <View style={styles.addressContainer}>
        <Text style={styles.label}>Votre adresse :</Text>
        <Text style={styles.address} selectable={true}>{address}</Text>
      </View>

      <TouchableOpacity 
        style={styles.button} 
        onPress={handleCopyAddress}>
        <Text style={styles.buttonText}>Copier l'adresse</Text>
      </TouchableOpacity>

      {copiedMessage && (
        <View style={styles.messageContainer}>
          <Text style={styles.messageText}>✓ Adresse copiée !</Text>
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
    minHeight: 290,
  },
  qrPlaceholder: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 10,
  },
  qrSubtext: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
    lineHeight: 20,
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
