import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
} from 'react-native';
import useWalletStore from '../store/walletStore';

function BackupVerifyScreen() {
  const mnemonic = useWalletStore((state) => state.mnemonic);
  const verifyBackup = useWalletStore((state) => state.actions.verifyBackup);
  const setScreen = useWalletStore((state) => state.actions.setScreen);
  
  const [wordsToVerify, setWordsToVerify] = useState([]);
  const [userInputs, setUserInputs] = useState({});
  const [error, setError] = useState('');

  useEffect(() => {
    if (mnemonic) {
      const words = mnemonic.split(' ');
      // Select 3 random words to verify
      const indices = [];
      while (indices.length < 3) {
        const randomIndex = Math.floor(Math.random() * words.length);
        if (!indices.includes(randomIndex)) {
          indices.push(randomIndex);
        }
      }
      indices.sort((a, b) => a - b);
      
      setWordsToVerify(
        indices.map(index => ({
          index: index,
          word: words[index],
          position: index + 1, // Human-readable position (1-based)
        }))
      );
    }
  }, [mnemonic]);

  const handleInputChange = (index, value) => {
    setUserInputs({
      ...userInputs,
      [index]: value.trim().toLowerCase(),
    });
    setError('');
  };

  const handleVerify = () => {
    // Check if all inputs are filled
    const allFilled = wordsToVerify.every(item => userInputs[item.index]);
    if (!allFilled) {
      setError('Veuillez remplir tous les champs.');
      return;
    }

    // Verify each word
    const allCorrect = wordsToVerify.every(
      item => userInputs[item.index] === item.word.toLowerCase()
    );

    if (allCorrect) {
      verifyBackup();
    } else {
      setError('Les mots saisis ne correspondent pas. Veuillez réessayer.');
    }
  };

  const handleBack = () => {
    setScreen('backup');
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Vérification de la phrase de récupération</Text>

      <View style={styles.instructionBox}>
        <Text style={styles.instructionText}>
          Pour confirmer que vous avez bien sauvegardé votre phrase, veuillez entrer les mots demandés ci-dessous.
        </Text>
      </View>

      {wordsToVerify.map((item) => (
        <View key={item.index} style={styles.inputGroup}>
          <Text style={styles.label}>Mot n°{item.position}</Text>
          <TextInput
            style={styles.input}
            placeholder={`Entrez le mot n°${item.position}`}
            value={userInputs[item.index] || ''}
            onChangeText={(value) => handleInputChange(item.index, value)}
            autoCapitalize="none"
            autoCorrect={false}
          />
        </View>
      ))}

      {error ? (
        <View style={styles.errorBox}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      ) : null}

      <TouchableOpacity style={styles.button} onPress={handleVerify}>
        <Text style={styles.buttonText}>Vérifier</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.backButton} onPress={handleBack}>
        <Text style={styles.backButtonText}>Retour à la phrase</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  content: {
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    color: '#333',
    textAlign: 'center',
  },
  instructionBox: {
    backgroundColor: '#E3F2FD',
    borderRadius: 10,
    padding: 15,
    marginBottom: 30,
  },
  instructionText: {
    fontSize: 14,
    color: '#1976D2',
    lineHeight: 20,
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#CCC',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: '#F9F9F9',
  },
  errorBox: {
    backgroundColor: '#FFEBEE',
    borderWidth: 1,
    borderColor: '#EF5350',
    borderRadius: 8,
    padding: 15,
    marginBottom: 20,
  },
  errorText: {
    color: '#C62828',
    fontSize: 14,
    textAlign: 'center',
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
  backButton: {
    backgroundColor: '#F0F0F0',
    paddingVertical: 15,
    borderRadius: 10,
    alignItems: 'center',
  },
  backButtonText: {
    color: '#007AFF',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default BackupVerifyScreen;
