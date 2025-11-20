const path = require('path');
const webpack = require('webpack');
const HtmlWebpackPlugin = require('html-webpack-plugin');

const appDirectory = path.resolve(__dirname);

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
  'firebase',
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
      presets: [
        ['module:metro-react-native-babel-preset'],
      ],
      plugins: [
        ['react-native-web', { commonjs: true }],
        ['@babel/plugin-proposal-export-namespace-from'],
        ['@babel/plugin-proposal-class-properties', { loose: true }],
        ['@babel/plugin-proposal-private-methods', { loose: true }],
        ['@babel/plugin-proposal-private-property-in-object', { loose: true }]
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
    // LA SOLUTION AUX ERREURS CRYPTO :
    fallback: {
      "crypto": require.resolve("crypto-browserify"),
      "stream": require.resolve("stream-browserify"),
      "vm": require.resolve("vm-browserify"),
      "buffer": require.resolve("buffer/"),
      "process": require.resolve("process/browser"),
    }
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
    // Injecte les variables globales pour le web
    new webpack.ProvidePlugin({
      process: 'process/browser',
      Buffer: ['buffer', 'Buffer'],
    }),
  ],
};


