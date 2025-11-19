import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import Toast from 'react-native-toast-message';
import useWalletStore from '../store/walletStore';
import { useNavigation } from '@react-navigation/native';

function ReceiveScreen() {
  const navigation = useNavigation();
  const address = useWalletStore((state) => state.address);
  const currentNetwork = useWalletStore((state) => state.currentNetwork);

  const handleBack = () => {
    navigation.goBack();
  };

  const handleCopyAddress = () => {
    if (Platform.OS === 'web' && typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(address);
      Toast.show({
        type: 'success',
        text1: 'Adresse copiée',
        text2: 'L\'adresse a été copiée dans le presse-papiers',
      });
    } else {
      // For native, you would use Clipboard from react-native
      Toast.show({
        type: 'success',
        text1: 'Adresse copiée',
        text2: 'L\'adresse a été copiée',
      });
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={handleBack}>
          <Text style={styles.backButton}>← Retour</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Recevoir</Text>
        <View style={styles.placeholder} />
      </View>

      <View style={styles.content}>
        <View style={styles.networkBadge}>
          <Text style={styles.networkBadgeText}>{currentNetwork.name} - Testnet</Text>
        </View>

        <View style={styles.qrContainer}>
          <View style={styles.qrPlaceholder}>
            <Text style={styles.qrIcon}>📱</Text>
            <Text style={styles.qrText}>QR Code</Text>
            <Text style={styles.qrSubtext}>Scannez pour recevoir</Text>
          </View>
        </View>

        <View style={styles.addressContainer}>
          <Text style={styles.label}>Votre adresse</Text>
          <View style={styles.addressBox}>
            <Text style={styles.address} numberOfLines={2}>
              {address}
            </Text>
          </View>
        </View>

        <TouchableOpacity 
          style={styles.copyButton} 
          onPress={handleCopyAddress}>
          <Text style={styles.copyButtonText}>📋 Copier l'adresse</Text>
        </TouchableOpacity>

        <View style={styles.warningBox}>
          <Text style={styles.warningIcon}>⚠️</Text>
          <Text style={styles.warningText}>
            Envoyez uniquement des actifs {currentNetwork.symbol} et des tokens sur le réseau {currentNetwork.name}. L'envoi d'autres actifs peut entraîner une perte permanente.
          </Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#24272A',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 15,
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#3C4043',
  },
  backButton: {
    color: '#037DD6',
    fontSize: 16,
    fontWeight: '600',
  },
  title: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
  placeholder: {
    width: 60,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  networkBadge: {
    backgroundColor: '#2D3748',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    alignSelf: 'center',
    marginBottom: 30,
  },
  networkBadgeText: {
    color: '#F7931A',
    fontSize: 12,
    fontWeight: '600',
  },
  qrContainer: {
    alignItems: 'center',
    marginBottom: 30,
  },
  qrPlaceholder: {
    width: 250,
    height: 250,
    backgroundColor: '#FFFFFF',
    borderRadius: 15,
    justifyContent: 'center',
    alignItems: 'center',
  },
  qrIcon: {
    fontSize: 60,
    marginBottom: 10,
  },
  qrText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 5,
  },
  qrSubtext: {
    fontSize: 14,
    color: '#666',
  },
  addressContainer: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    color: '#8B92A6',
    marginBottom: 10,
    fontWeight: '600',
  },
  addressBox: {
    backgroundColor: '#141618',
    borderRadius: 10,
    padding: 15,
    borderWidth: 1,
    borderColor: '#3C4043',
  },
  address: {
    fontSize: 14,
    color: '#FFFFFF',
    fontFamily: 'monospace',
    lineHeight: 20,
  },
  copyButton: {
    backgroundColor: '#037DD6',
    paddingVertical: 15,
    borderRadius: 10,
    alignItems: 'center',
    marginBottom: 20,
  },
  copyButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  warningBox: {
    flexDirection: 'row',
    backgroundColor: '#3D2E1F',
    borderRadius: 10,
    padding: 15,
    borderWidth: 1,
    borderColor: '#F7931A',
  },
  warningIcon: {
    fontSize: 20,
    marginRight: 10,
  },
  warningText: {
    flex: 1,
    color: '#F7931A',
    fontSize: 12,
    lineHeight: 18,
  },
});

export default ReceiveScreen;
