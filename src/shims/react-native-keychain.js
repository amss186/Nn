// Shim pour react-native-keychain côté web.
// Implémentation minimale : stocke en localStorage (démo).
// Si tu veux une implémentation plus sécurisée, remplacer par IndexedDB + WebCrypto.

module.exports = {
  setGenericPassword: async (username, password) => {
    try {
      if (typeof window !== 'undefined') {
        localStorage.setItem('rn_keychain_user', username || '');
        localStorage.setItem('rn_keychain_pass', password || '');
      }
      return true;
    } catch (e) {
      return false;
    }
  },
  getGenericPassword: async () => {
    if (typeof window === 'undefined') return false;
    const username = localStorage.getItem('rn_keychain_user');
    const password = localStorage.getItem('rn_keychain_pass');
    if (username === null && password === null) return false;
    return { username, password };
  },
  resetGenericPassword: async () => {
    if (typeof window === 'undefined') return false;
    localStorage.removeItem('rn_keychain_user');
    localStorage.removeItem('rn_keychain_pass');
    return true;
  }
};