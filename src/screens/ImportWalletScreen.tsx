import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Platform,
  ScrollView,
} from 'react-native';
import Toast from 'react-native-toast-message';
import { ethers } from 'ethers';
import useWalletStore from '../store/walletStore';
import { auth } from '../firebaseConfig';
import { linkWalletAddressToUser } from '../services/authService';

function ImportWalletScreen({ navigation }: any) {
  const [mnemonic, setMnemonic] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const importWalletFromMnemonic = useWalletStore(
    (state) => state.actions.importWalletFromMnemonic,
  );

  const validateAndImportWallet = async () => {
    const trimmedMnemonic = mnemonic.trim();
    
    if (!trimmedMnemonic) {
      Toast.show({
        type: 'error',
        text1: 'Mnemonic requise',
        text2: 'Veuillez entrer votre phrase de récupération.',
      });
      return;
    }

    // Validate word count (12 or 24 words)
    const words = trimmedMnemonic.split(/\s+/);
    if (words.length !== 12 && words.length !== 24) {
      Toast.show({
        type: 'error',
        text1: 'Mnemonic invalide',
        text2: 'La phrase doit contenir 12 ou 24 mots.',
      });
      return;
    }

    // On web, require password for demo encryption
    if (Platform.OS === 'web' && !password) {
      Toast.show({
        type: 'error',
        text1: 'Mot de passe requis',
        text2: 'Entrez un mot de passe pour sécuriser votre wallet (web demo).',
      });
      return;
    }

    setIsLoading(true);

    try {
      // Validate mnemonic by attempting to create wallet
      ethers.Wallet.fromPhrase(trimmedMnemonic);
    } catch (error) {
      setIsLoading(false);
      Toast.show({
        type: 'error',
        text1: 'Mnemonic invalide',
        text2: 'La phrase de récupération est incorrecte.',
      });
      return;
    }

    try {
      // Import wallet using store action
      const walletAddress = await importWalletFromMnemonic(
        trimmedMnemonic,
        password || undefined,
      );

      // If user is signed in with Firebase, link wallet address
      const currentUser = auth.currentUser;
      if (currentUser) {
        await linkWalletAddressToUser(currentUser.uid, walletAddress);
        Toast.show({
          type: 'success',
          text1: 'Wallet importé',
          text2: 'Adresse liée à votre compte Firebase.',
        });
      } else {
        Toast.show({
          type: 'success',
          text1: 'Wallet importé',
          text2: 'Vous pouvez maintenant utiliser votre wallet.',
        });
      }

      // Navigate back or to dashboard
      if (navigation) {
        navigation.goBack();
      }
    } catch (error: any) {
      console.error('Import error:', error);
      Toast.show({
        type: 'error',
        text1: 'Erreur d\'importation',
        text2: error?.message || 'Impossible d\'importer le wallet.',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      <View style={styles.header}>
        <Text style={styles.title}>Importer un wallet</Text>
        <Text style={styles.subtitle}>
          Entrez votre phrase de récupération (12 ou 24 mots)
        </Text>
      </View>

      <View style={styles.form}>
        <Text style={styles.label}>Phrase de récupération</Text>
        <TextInput
          style={styles.mnemonicInput}
          placeholder="Entrez votre phrase de récupération séparée par des espaces"
          placeholderTextColor="#8B92A6"
          value={mnemonic}
          onChangeText={setMnemonic}
          multiline
          numberOfLines={4}
          autoCapitalize="none"
          autoCorrect={false}
        />

        {Platform.OS === 'web' && (
          <>
            <Text style={styles.label}>
              Mot de passe (pour chiffrement local - demo uniquement)
            </Text>
            <TextInput
              style={styles.input}
              placeholder="Mot de passe"
              placeholderTextColor="#8B92A6"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
            />
          </>
        )}

        <View style={styles.securityWarning}>
          <Text style={styles.warningTitle}>⚠️ Sécurité</Text>
          <Text style={styles.warningText}>
            • Votre phrase ne sera JAMAIS envoyée au serveur
          </Text>
          <Text style={styles.warningText}>
            • Seule l'adresse publique sera stockée dans Firestore
          </Text>
          <Text style={styles.warningText}>
            • La phrase est chiffrée localement sur votre appareil
          </Text>
          {Platform.OS === 'web' && (
            <Text style={styles.warningText}>
              • Version web: stockage demo uniquement (localStorage)
            </Text>
          )}
        </View>

        <TouchableOpacity
          style={[styles.importButton, isLoading && styles.buttonDisabled]}
          onPress={validateAndImportWallet}
          disabled={isLoading}
        >
          <Text style={styles.importButtonText}>
            {isLoading ? 'Importation...' : 'Importer le wallet'}
          </Text>
        </TouchableOpacity>

        {navigation && (
          <TouchableOpacity
            style={styles.cancelButton}
            onPress={() => navigation.goBack()}
            disabled={isLoading}
          >
            <Text style={styles.cancelButtonText}>Annuler</Text>
          </TouchableOpacity>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#24272A',
  },
  contentContainer: {
    padding: 20,
  },
  header: {
    marginBottom: 30,
    alignItems: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: '#8B92A6',
    textAlign: 'center',
  },
  form: {
    width: '100%',
  },
  label: {
    fontSize: 14,
    color: '#D6D9DC',
    marginBottom: 8,
    fontWeight: '600',
  },
  mnemonicInput: {
    backgroundColor: '#141618',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: '#FFFFFF',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#3C4043',
    minHeight: 100,
    textAlignVertical: 'top',
  },
  input: {
    backgroundColor: '#141618',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: '#FFFFFF',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#3C4043',
  },
  securityWarning: {
    backgroundColor: '#2D3748',
    borderRadius: 8,
    padding: 16,
    marginBottom: 24,
    borderLeftWidth: 4,
    borderLeftColor: '#F59E0B',
  },
  warningTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#F59E0B',
    marginBottom: 8,
  },
  warningText: {
    fontSize: 13,
    color: '#D6D9DC',
    marginBottom: 4,
  },
  importButton: {
    backgroundColor: '#037DD6',
    paddingVertical: 14,
    borderRadius: 999,
    alignItems: 'center',
    marginBottom: 12,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  importButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '600',
  },
  cancelButton: {
    backgroundColor: 'transparent',
    paddingVertical: 14,
    borderRadius: 999,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#3C4043',
  },
  cancelButtonText: {
    color: '#8B92A6',
    fontSize: 15,
    fontWeight: '600',
  },
});

export default ImportWalletScreen;
