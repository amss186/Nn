import { create } from 'zustand';
import { ethers } from 'ethers';
import * as Keychain from 'react-native-keychain';
import { Alchemy } from 'alchemy-sdk';
import { Platform } from 'react-native';

// Secure storage utilities (Phase 2)
import {
  encryptMnemonic,
  decryptMnemonic,
  storeEncryptedMnemonic,
  loadEncryptedMnemonic,
  clearEncryptedMnemonic,
} from '../utils/secureStorage';

// DEMO legacy web storage fallback (only used if encryption fails or password absent)
const webStorage = {
  getItem: (key) => {
    if (typeof localStorage !== 'undefined') {
      return localStorage.getItem(key);
    }
    return null;
  },
  setItem: (key, value) => {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(key, value);
    }
  },
  removeItem: (key) => {
    if (typeof localStorage !== 'undefined') {
      localStorage.removeItem(key);
    }
  },
};

const SUPPORTED_NETWORKS = [
  {
    name: 'Ethereum Sepolia',
    symbol: 'ETH',
    rpcUrl: 'https://eth-sepolia.g.alchemy.com/v2/6E1MABBp0KS-gBCc5zXk7',
    chainId: 11155111,
    explorerUrl: 'https://sepolia.etherscan.io',
    alchemyNetwork: 'eth-sepolia',
  },
  {
    name: 'Polygon Mumbai',
    symbol: 'MATIC',
    rpcUrl: 'https://polygon-mumbai.g.alchemy.com/v2/6E1MABBp0KS-gBCc5zXk7',
    chainId: 80001,
    explorerUrl: 'https://mumbai.polygonscan.com',
    alchemyNetwork: 'polygon-mumbai',
  },
];

const useWalletStore = create((set, get) => ({
  // Core state
  mnemonic: null,                 // Plain mnemonic only held when unlocked (DO NOT persist)
  encryptedMnemonicPayload: null, // Chiffrement PBKDF2 + AES-GCM (web)
  address: null,
  isWalletCreated: false,
  isWalletUnlocked: false,
  needsBackup: false,             // If true, user must verify backup flow
  hasBackedUp: false,             // Phase 3 flag
  securityLevel: 'weak',          // 'weak' | 'strong'
  tempPlainMnemonic: null,        // Used only for backup verification then cleared
  balance: '0',
  currentScreen: 'dashboard',
  isSending: false,
  sendError: null,
  transactions: [],
  tokenBalances: [],
  customTokens: [], // user-added tokens { address, symbol, decimals }
  assetToSend: null,
  currentNetwork: SUPPORTED_NETWORKS[0],

  // WalletConnect state
  walletConnectRequest: null,

  actions: {
    // Vérifie stockage existant (web/natif)
    checkStorage: async () => {
      try {
        let walletExists = false;
        let needsBackup = false;
        let hasBackedUp = false;
        let encryptedPayload = null;

        if (Platform.OS === 'web') {
          const payload = loadEncryptedMnemonic();
            encryptedPayload = payload;
          const legacyMnemonic = webStorage.getItem('wallet_mnemonic');
          if (payload || legacyMnemonic) walletExists = true;

          // backup flags
          const needsBackupStored = localStorage.getItem('wallet_needsBackup');
          needsBackup = needsBackupStored === 'true';
          const backedUpStored = localStorage.getItem('wallet_hasBackedUp');
          hasBackedUp = backedUpStored === 'true';
        } else {
          const credentials = await Keychain.getGenericPassword();
          walletExists = !!credentials;
          // For native we assume user must backup if newly created
          needsBackup = walletExists ? true : false;
        }

        set({
          isWalletCreated: walletExists,
          needsBackup,
          hasBackedUp,
          encryptedMnemonicPayload: encryptedPayload,
        });

        // Auto-unlock in web if encrypted payload exists & backup done
        if (Platform.OS === 'web' && encryptedPayload && !needsBackup) {
          // Cannot decrypt without password; require user to unlock explicitly.
        }
      } catch (error) {
        console.log('checkStorage error:', error);
        set({ isWalletCreated: false });
      }
    },

    // Crée un nouveau portefeuille
    createWallet: async (password = '') => {
      const wallet = ethers.Wallet.createRandom();
      const phrase = wallet.mnemonic.phrase;

      if (Platform.OS === 'web') {
        try {
          if (password) {
            const payload = await encryptMnemonic(phrase, password);
            storeEncryptedMnemonic(payload);
            set({ encryptedMnemonicPayload: payload, securityLevel: 'strong' });
          } else {
            // Fallback weak storage if no password
            webStorage.setItem('wallet_mnemonic', phrase);
            set({ securityLevel: 'weak' });
          }
          localStorage.setItem('wallet_needsBackup', 'true');
          localStorage.setItem('wallet_hasBackedUp', 'false');
        } catch (e) {
          console.warn('Encryption failed, fallback weak storage:', e);
          webStorage.setItem('wallet_mnemonic', phrase);
          localStorage.setItem('wallet_needsBackup', 'true');
          localStorage.setItem('wallet_hasBackedUp', 'false');
          set({ securityLevel: 'weak' });
        }
      } else {
        await Keychain.setGenericPassword('wallet', phrase, {
          accessControl: Keychain.ACCESS_CONTROL.BIOMETRY_ANY_OR_DEVICE_PASSCODE,
        });
      }

      set({
        mnemonic: phrase,
        tempPlainMnemonic: phrase, // for backup verification
        address: wallet.address,
        isWalletCreated: true,
        isWalletUnlocked: false,
        needsBackup: true,
        hasBackedUp: false,
      });

      return phrase;
    },

    // Import mnemonic existante
    importWalletFromMnemonic: async (mnemonic, passwordForLocalEncryption = '') => {
      try {
        const wallet = ethers.Wallet.fromPhrase(mnemonic.trim());
        const address = wallet.address;

        if (Platform.OS === 'web') {
          try {
            if (passwordForLocalEncryption) {
              const payload = await encryptMnemonic(mnemonic.trim(), passwordForLocalEncryption);
              storeEncryptedMnemonic(payload);
              set({ encryptedMnemonicPayload: payload, securityLevel: 'strong' });
            } else {
              webStorage.setItem('wallet_mnemonic', mnemonic.trim());
              set({ securityLevel: 'weak' });
            }
            // Imported wallet: assume user already has mnemonic => no backup required
            localStorage.setItem('wallet_needsBackup', 'false');
            localStorage.setItem('wallet_hasBackedUp', 'true');
          } catch (e) {
            console.warn('Encryption failed fallback weak storage:', e);
            webStorage.setItem('wallet_mnemonic', mnemonic.trim());
            localStorage.setItem('wallet_needsBackup', 'false');
            localStorage.setItem('wallet_hasBackedUp', 'true');
            set({ securityLevel: 'weak' });
          }
        } else {
          await Keychain.setGenericPassword('wallet', mnemonic.trim(), {
            accessControl: Keychain.ACCESS_CONTROL.BIOMETRY_ANY_OR_DEVICE_PASSCODE,
          });
        }

        set({
          mnemonic: mnemonic.trim(),
          tempPlainMnemonic: null, // not needed for import
          address,
          isWalletCreated: true,
          isWalletUnlocked: true,
          needsBackup: false,
          hasBackedUp: true,
        });

        return address;
      } catch (error) {
        console.log('importWalletFromMnemonic error:', error);
        throw new Error('Mnemonic invalide');
      }
    },

    // Vérifie sauvegarde (Backup phase)
    verifyBackup: () => {
      if (Platform.OS === 'web') {
        localStorage.setItem('wallet_needsBackup', 'false');
        localStorage.setItem('wallet_hasBackedUp', 'true');
      }
      set({
        needsBackup: false,
        hasBackedUp: true,
        isWalletUnlocked: true,
        tempPlainMnemonic: null,
        currentScreen: 'dashboard',
      });
    },

    // Déverrouille (web password ou natif biométrie)
    unlockWallet: async (password = '') => {
      try {
        if (Platform.OS === 'web') {
          const payload = get().encryptedMnemonicPayload;
          const legacyMnemonic = webStorage.getItem('wallet_mnemonic');

          if (payload) {
            // Decrypt using password
            const phrase = await decryptMnemonic(payload, password);
            const wallet = ethers.Wallet.fromPhrase(phrase);
            set({
              mnemonic: phrase,
              address: wallet.address,
              isWalletUnlocked: true,
            });
            return true;
          }

          if (legacyMnemonic) {
            // Weak storage fallback
            const wallet = ethers.Wallet.fromPhrase(legacyMnemonic);
            set({
              mnemonic: legacyMnemonic,
              address: wallet.address,
              isWalletUnlocked: true,
            });
            return true;
          }

          throw new Error('Aucun portefeuille trouvé');
        }

        // Native: Keychain + biométrie
        const credentials = await Keychain.getGenericPassword({
          authenticationPrompt: { title: 'Déverrouiller le portefeuille' },
        });

        if (!credentials) {
          throw new Error('Échec de l’authentification ou annulée');
        }

        const wallet = ethers.Wallet.fromPhrase(credentials.password);
        set({
          mnemonic: credentials.password,
          address: wallet.address,
          isWalletUnlocked: true,
        });
        return true;
      } catch (error) {
        console.log('Unlock failed:', error);
        throw error;
      }
    },

    lockWallet: () => {
      set({
        mnemonic: null,
        isWalletUnlocked: false,
      });
    },

    wipeWallet: async () => {
      clearEncryptedMnemonic(); // clear encrypted payload web
      await Keychain.resetGenericPassword();
      if (Platform.OS === 'web') {
        localStorage.removeItem('wallet_needsBackup');
        localStorage.removeItem('wallet_hasBackedUp');
        webStorage.removeItem('wallet_mnemonic');
        webStorage.removeItem('wallet_password');
      }
      set({
        mnemonic: null,
        encryptedMnemonicPayload: null,
        tempPlainMnemonic: null,
        address: null,
        isWalletCreated: false,
        isWalletUnlocked: false,
        needsBackup: false,
        hasBackedUp: false,
        balance: '0',
        transactions: [],
        tokenBalances: [],
        customTokens: [],
      });
    },

    fetchData: async () => {
      try {
        const { address, currentNetwork } = get();
        if (!address) return;

        const settings = {
          apiKey: '6E1MABBp0KS-gBCc5zXk7',
          network: currentNetwork.alchemyNetwork,
        };
        const alchemy = new Alchemy(settings);

        const balanceWei = await alchemy.core.getBalance(address);
        const balanceEth = ethers.utils.formatEther(balanceWei);

        const tokenBalancesResponse = await alchemy.core.getTokenBalances(address);

        const tokensWithBalance = tokenBalancesResponse.tokenBalances.filter(
          (token) => token.tokenBalance !== '0' && token.tokenBalance !== null,
        );

        const tokenMetadataPromises = tokensWithBalance.map((token) =>
          alchemy.core.getTokenMetadata(token.contractAddress),
        );
        const tokenMetadataList = await Promise.all(tokenMetadataPromises);

        const finalTokenList = tokensWithBalance
          .map((token, index) => {
            const metadata = tokenMetadataList[index];
            if (!metadata.symbol) return null;
            const balance =
              parseInt(token.tokenBalance, 16) / Math.pow(10, metadata.decimals || 18);
            return {
              symbol: metadata.symbol,
              balance: balance.toFixed(4),
              contractAddress: token.contractAddress,
              decimals: metadata.decimals || 18,
              logo: metadata.logo,
            };
          })
          .filter((token) => token !== null);

        // Transactions
        const sentTransfers = await alchemy.core.getAssetTransfers({
          fromBlock: '0x0',
          toBlock: 'latest',
          fromAddress: address,
          category: ['external'],
          order: 'desc',
          withMetadata: true,
          maxCount: 20,
        });

        const receivedTransfers = await alchemy.core.getAssetTransfers({
          fromBlock: '0x0',
          toBlock: 'latest',
          toAddress: address,
          category: ['external'],
          order: 'desc',
          withMetadata: true,
          maxCount: 20,
        });

        const allTransfers = [...sentTransfers.transfers, ...receivedTransfers.transfers];
        allTransfers.sort((a, b) => {
          const dateA = new Date(a.metadata.blockTimestamp);
          const dateB = new Date(b.metadata.blockTimestamp);
          return dateB - dateA;
        });

        set({
          balance: balanceEth,
          transactions: allTransfers.slice(0, 40),
          tokenBalances: finalTokenList,
        });
      } catch (error) {
        console.log('Failed to fetch data:', error);
        set({ balance: '0', transactions: [], tokenBalances: [] });
      }
    },

    setScreen: (screenName, asset = null) => {
      set({
        currentScreen: screenName,
        assetToSend: asset,
      });
    },

    switchNetwork: (network) => {
      set({
        currentNetwork: network,
        balance: '0',
        tokenBalances: [],
        transactions: [],
      });
    },

    sendTransaction: async (toAddress, amount) => {
      set({ isSending: true, sendError: null });
      try {
        const { mnemonic, assetToSend, currentNetwork } = get();
        if (!mnemonic) {
          throw new Error('Mnémonique non disponible. Déverrouille le portefeuille.');
        }

        const provider = new ethers.providers.JsonRpcProvider(currentNetwork.rpcUrl);
        const wallet = ethers.Wallet.fromPhrase(mnemonic);
        const connectedWallet = wallet.connect(provider);

        if (!ethers.utils.isAddress(toAddress)) {
          throw new Error('Adresse destinataire invalide.');
        }

        if (assetToSend && assetToSend.contractAddress) {
          const tokenAbi = ['function transfer(address to, uint256 amount)'];
          const tokenContract = new ethers.Contract(
            assetToSend.contractAddress,
            tokenAbi,
            connectedWallet,
          );
            const amountToSend = ethers.utils.parseUnits(amount, assetToSend.decimals);
          const tx = await tokenContract.transfer(toAddress, amountToSend);
          await tx.wait();
        } else {
          const txValue = ethers.utils.parseEther(amount);
          const tx = { to: toAddress, value: txValue };
          const txResponse = await connectedWallet.sendTransaction(tx);
          await txResponse.wait();
        }

        await get().actions.fetchData();
        get().actions.setScreen('dashboard');
      } catch (error) {
        console.log('sendTransaction error:', error);
        set({ sendError: error.message });
      } finally {
        set({ isSending: false });
      }
    },

    // ERC-20 custom token management (Phase 4 minimal)
    addCustomToken: (token) => {
      const { customTokens } = get();
      if (
        customTokens.find(
          (t) => t.address.toLowerCase() === token.address.toLowerCase(),
        )
      ) {
        return;
      }
      set({ customTokens: [...customTokens, token] });
    },

    // WalletConnect existing actions preserved:

    setWalletConnectRequest: (request) => {
      set({ walletConnectRequest: request });
    },

    clearWalletConnectRequest: () => {
      set({ walletConnectRequest: null });
    },

    approveSession: async () => {
      const { walletConnectRequest, address, currentNetwork } = get();
      if (!walletConnectRequest || walletConnectRequest.type !== 'session_proposal') {
        console.error('No session proposal to approve');
        return;
      }
      try {
        const WalletConnectService = (await import('../services/WalletConnectService')).default;
        const wcService = WalletConnectService.getInstance();
        const accounts = [`eip155:${currentNetwork.chainId}:${address}`];
        await wcService.approveSession(
          walletConnectRequest.id,
          accounts,
          currentNetwork.chainId,
        );
        set({ walletConnectRequest: null });
      } catch (error) {
        console.error('Failed to approve session:', error);
        throw error;
      }
    },

    rejectSession: async () => {
      const { walletConnectRequest } = get();
      if (!walletConnectRequest || walletConnectRequest.type !== 'session_proposal') {
        console.error('No session proposal to reject');
        return;
      }
      try {
        const WalletConnectService = (await import('../services/WalletConnectService')).default;
        const wcService = WalletConnectService.getInstance();
        await wcService.rejectSession(walletConnectRequest.id);
        set({ walletConnectRequest: null });
      } catch (error) {
        console.error('Failed to reject session:', error);
        throw error;
      }
    },

    approveRequest: async () => {
      const { walletConnectRequest, mnemonic, currentNetwork } = get();
      if (!walletConnectRequest || walletConnectRequest.type !== 'session_request') {
        console.error('No session request to approve');
        return;
      }
      if (!mnemonic) {
        throw new Error('Wallet not unlocked');
      }
      try {
        const WalletConnectService = (await import('../services/WalletConnectService')).default;
        const wcService = WalletConnectService.getInstance();

        const wallet = ethers.Wallet.fromPhrase(mnemonic);
        const provider = new ethers.providers.JsonRpcProvider(currentNetwork.rpcUrl);
        const connectedWallet = wallet.connect(provider);

        const { topic, id, params } = walletConnectRequest;
        const { request } = params;
        let result;

        switch (request.method) {
          case 'eth_sign':
          case 'personal_sign': {
            const message = request.params[0];
            result = await connectedWallet.signMessage(
              ethers.utils.isHexString(message) ? ethers.utils.arrayify(message) : message,
            );
            break;
          }
          case 'eth_signTypedData':
          case 'eth_signTypedData_v4': {
            const typedData = JSON.parse(request.params[1]);
            result = await connectedWallet._signTypedData(
              typedData.domain,
              typedData.types,
              typedData.message,
            );
            break;
          }
          case 'eth_sendTransaction':
          case 'eth_signTransaction': {
            const txRequest = request.params[0];
            const tx = {
              to: txRequest.to,
              value: txRequest.value ? ethers.BigNumber.from(txRequest.value) : undefined,
              data: txRequest.data,
              gasLimit: txRequest.gas ? ethers.BigNumber.from(txRequest.gas) : undefined,
              gasPrice: txRequest.gasPrice ? ethers.BigNumber.from(txRequest.gasPrice) : undefined,
            };
            if (request.method === 'eth_sendTransaction') {
              const txResponse = await connectedWallet.sendTransaction(tx);
              result = txResponse.hash;
            } else {
              const signedTx = await connectedWallet.signTransaction(tx);
              result = signedTx;
            }
            break;
          }
          default:
            throw new Error(`Unsupported method: ${request.method}`);
        }

        await wcService.respondRequest(topic, id, result);
        set({ walletConnectRequest: null });

        if (request.method === 'eth_sendTransaction') {
          await get().actions.fetchData();
        }
      } catch (error) {
        console.error('Failed to approve request:', error);
        throw error;
      }
    },

    rejectRequest: async () => {
      const { walletConnectRequest } = get();
      if (!walletConnectRequest || walletConnectRequest.type !== 'session_request') {
        console.error('No session request to reject');
        return;
      }
      try {
        const WalletConnectService = (await import('../services/WalletConnectService')).default;
        const wcService = WalletConnectService.getInstance();
        await wcService.rejectRequest(walletConnectRequest.topic, walletConnectRequest.id);
        set({ walletConnectRequest: null });
      } catch (error) {
        console.error('Failed to reject request:', error);
        throw error;
      }
    },
  },
}));

export { SUPPORTED_NETWORKS };
export default useWalletStore;