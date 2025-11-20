const path = require("path");
const webpack = require("webpack");
const HtmlWebpackPlugin = require("html-webpack-plugin");

module.exports = {
  entry: path.resolve(__dirname, "index.web.js"),
  output: {
    path: path.resolve(__dirname, "dist"),
    filename: "bundle.[contenthash].js",
    publicPath: "/"
  },
  resolve: {
    extensions: [".web.js", ".web.ts", ".web.tsx", ".js", ".jsx", ".ts", ".tsx", ".json"],
    alias: {
      "react-native$": "react-native-web"
    },
    fallback: {
      crypto: require.resolve("crypto-browserify"),
      stream: require.resolve("stream-browserify"),
      vm: require.resolve("vm-browserify"),
      assert: require.resolve("assert"),
      zlib: require.resolve("browserify-zlib"),
      util: require.resolve("util/"),
      buffer: require.resolve("buffer/"),
      process: require.resolve("process/browser"),
      path: require.resolve("path-browserify")
    }
  },
  module: {
    rules: [
      {
        test: /\.[jt]sx?$/,
        exclude: /node_modules\/(?!(react-native-vector-icons)\/).*/,
        use: {
          loader: "babel-loader",
          options: {
            presets: [
              ["@babel/preset-env", { targets: { browsers: "last 2 versions" } }],
              "@babel/preset-react",
              "@babel/preset-typescript"
            ],
            plugins: []
          }
        }
      },
      {
        test: /\.css$/i,
        use: ["style-loader", "css-loader"]
      },
      {
        test: /\.(ttf|otf|eot|woff|woff2)$/,
        type: "asset/resource",
        generator: {
          filename: "assets/fonts/[name][ext]"
        }
      },
      {
        test: /\.(png|jpe?g|gif|svg)$/,
        type: "asset/resource",
        generator: {
          filename: "assets/images/[name][ext]"
        }
      }
    ]
  },
  plugins: [
    new HtmlWebpackPlugin({
      template: path.resolve(__dirname, "public", "index.html"),
      inject: "body"
    }),
    new webpack.ProvidePlugin({
      Buffer: ["buffer", "Buffer"],
      process: "process/browser"
    })
  ],
  devServer: {
    static: path.resolve(__dirname, "public"),
    compress: true,
    port: 8080,
    historyApiFallback: true
  }
};