import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  TextInput, Platform, ScrollView
} from 'react-native';
import Toast from 'react-native-toast-message';
import { ethers } from 'ethers';
import { useWalletStore } from '../store/walletStore';
// import { auth } from '../firebaseConfig'; // Assure-toi que ce chemin existe si tu l'utilises
// import { linkWalletAddressToUser } from '../services/authService';
import { useNavigation } from '@react-navigation/native';

function OnboardingScreen() {
  const navigation = useNavigation();
  // ... (Tes états)
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirm] = useState('');
  const [showPasswordInput, setShowPwd] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [showImportInput, setShowImport] = useState(false);
  const [mnemonic, setMnemonic] = useState('');

  const createWallet = useWalletStore((s) => s.actions.createWallet);
  const importWalletFromMnemonic = useWalletStore((s) => s.actions.importWalletFromMnemonic);
  const needsBackup = useWalletStore((s) => s.needsBackup);

  const goNextFlow = () => {
    if (needsBackup) {
      navigation.navigate('Backup');
    } else {
      navigation.navigate('Locked');
    }
  };

  const handleCreateWallet = async () => {
    if (Platform.OS === 'web') {
      setShowPwd(true);
    } else {
      try {
        setIsCreating(true);
        await createWallet();
        Toast.show({ type: 'success', text1: 'Portefeuille créé', text2: 'Succès' });
        goNextFlow();
      } catch (e) { // CORRECTION : PLUS DE : any
        Toast.show({ type: 'error', text1: 'Erreur', text2: e?.message || 'Création impossible' });
      } finally {
        setIsCreating(false);
      }
    }
  };

  const handleConfirmPassword = async () => {
    // ... (Tes vérifications de mot de passe)
    if (password !== confirmPassword) return;

    try {
      setIsCreating(true);
      await createWallet(password);
      Toast.show({ type: 'success', text1: 'Portefeuille créé', text2: 'Chiffré avec succès' });
      goNextFlow();
    } catch (e) { // CORRECTION : PLUS DE : any
      Toast.show({ type: 'error', text1: 'Erreur', text2: e?.message || 'Création impossible' });
    } finally {
      setIsCreating(false);
    }
  };

  const handleConfirmImport = async () => {
    // ... (Tes vérifications)
    try {
      setIsCreating(true);
      const address = await importWalletFromMnemonic(mnemonic.trim(), password || undefined);
      Toast.show({ type: 'success', text1: 'Wallet importé', text2: 'Adresse liée.' });
      goNextFlow();
    } catch (e) { // CORRECTION : PLUS DE : any
      Toast.show({ type: 'error', text1: 'Erreur import', text2: e?.message || 'Impossible.' });
    } finally {
      setIsCreating(false);
    }
  };

  // ... (Le reste de ton render est bon)
  return (
    <ScrollView contentContainerStyle={styles.scrollContainer} style={{ flex: 1, backgroundColor: '#24272A' }}>
      {/* ... Copie le reste de ton UI ici, elle était correcte ... */}
       <View style={styles.container}>
        <View style={styles.logoContainer}>
          <Text style={styles.logo}>🦊</Text>
          <Text style={styles.brandName}>Malin Wallet</Text>
        </View>
        {/* ... */}
        {/* Pour gagner de la place je ne remets pas tout le JSX, garde le tien, il est bon */}
        {/* Juste assure-toi d'utiliser les fonctions handle... corrigées ci-dessus */}
        {!showImportInput && !showPasswordInput && (
           <View style={styles.formContainer}>
            <TouchableOpacity style={styles.button} onPress={handleCreateWallet}>
                <Text style={styles.buttonText}>Créer mon portefeuille</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.secondaryButton} onPress={() => setShowImport(true)}>
                <Text style={styles.secondaryButtonText}>Importer</Text>
            </TouchableOpacity>
           </View>
        )}
      </View>
    </ScrollView>
  );
}

// ... (Styles identiques)
const styles = StyleSheet.create({
  scrollContainer: { flexGrow: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
  container: { width: '100%', maxWidth: 500, justifyContent: 'center', alignItems: 'center' },
  logoContainer: { alignItems: 'center', marginBottom: 30 },
  logo: { fontSize: 80, marginBottom: 15 },
  brandName: { fontSize: 32, fontWeight: 'bold', color: '#FFFFFF' },
  formContainer: { width: '100%', maxWidth: 400 },
  button: { backgroundColor: '#037DD6', paddingVertical: 15, borderRadius: 100, alignItems: 'center', marginBottom: 15 },
  buttonText: { color: '#FFFFFF', fontSize: 16, fontWeight: '600' },
  secondaryButton: { backgroundColor: 'transparent', paddingVertical: 15, borderRadius: 100, alignItems: 'center', borderWidth: 2, borderColor: '#037DD6' },
  secondaryButtonText: { color: '#037DD6', fontSize: 16, fontWeight: '600' },
  input: { backgroundColor: '#141618', borderRadius: 8, padding: 15, fontSize: 16, color: '#FFFFFF', marginBottom: 20, borderWidth: 1, borderColor: '#3C4043' },
  label: { fontSize: 14, color: '#D6D9DC', marginBottom: 8, fontWeight: '600' },
  mnemonicInput: { backgroundColor: '#141618', borderRadius: 8, padding: 15, fontSize: 16, color: '#FFFFFF', marginBottom: 20, borderWidth: 1, borderColor: '#3C4043', minHeight: 100 },
  warningBox: { flexDirection: 'row', backgroundColor: '#3D2E1F', borderRadius: 10, padding: 15, marginBottom: 20, borderWidth: 1, borderColor: '#F7931A' },
  warningIcon: { fontSize: 20, marginRight: 10 },
  warningText: { flex: 1, color: '#F7931A', fontSize: 12, lineHeight: 18 },
  title: { fontSize: 32, fontWeight: 'bold', marginBottom: 10, color: '#FFFFFF' },
  subtitle: { fontSize: 16, color: '#8B92A6', marginBottom: 40, textAlign: 'center', paddingHorizontal: 20 },
});

export default OnboardingScreen;


