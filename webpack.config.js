const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');

const appDirectory = path.resolve(__dirname);

// Liste des modules à compiler (Expo, Vector Icons, etc.)
const compileNodeModules = [
  'react-native',
  '@react-native',
  '@expo',
  'expo',
  'nativewind',
  'react-native-paper',
  'react-native-vector-icons',
  'react-native-safe-area-context',
  'react-native-svg',
  'react-native-qrcode-svg',
  'react-native-toast-message',
  'react-native-screens',
  '@react-navigation',
  'alchemy-sdk',
];

const babelLoaderConfiguration = {
  test: /\.(js|jsx|ts|tsx)$/,
  include: (input) => {
    if (!input.includes('node_modules')) return true;
    return compileNodeModules.some((moduleName) => input.includes(moduleName));
  },
  use: {
    loader: 'babel-loader',
    options: {
      cacheDirectory: true,
      babelrc: false,
      configFile: false,
      // C'EST ICI LA MAGIE : On utilise le preset officiel React Native
      // Il contient déjà "export-namespace-from", "class-properties", etc.
      presets: ['module:metro-react-native-babel-preset'],
      plugins: [
        ['react-native-web', { commonjs: true }],
      ],
    },
  },
};

module.exports = {
  entry: {
    app: path.join(appDirectory, 'index.web.js'),
  },
  output: {
    path: path.resolve(appDirectory, 'dist'),
    publicPath: '/',
    filename: 'bundle.web.js',
  },
  resolve: {
    extensions: ['.web.tsx', '.web.ts', '.tsx', '.ts', '.web.js', '.js', '.jsx', '.web.jsx'],
    alias: {
      'react-native$': 'react-native-web',
      'react-native-keychain': path.resolve(appDirectory, 'keychain.mock.js'),
    },
  },
  module: {
    rules: [
      babelLoaderConfiguration,
      {
        test: /\.(jpg|png|woff|woff2|eot|ttf|svg)$/,
        type: 'asset/resource'
      },
      {
        test: /\.ttf$/,
        loader: 'url-loader', 
        include: path.resolve(__dirname, 'node_modules/react-native-vector-icons'),
      },
    ],
  },
  plugins: [
    new HtmlWebpackPlugin({
      template: path.join(appDirectory, 'public/index.html'),
    }),
  ],
};


