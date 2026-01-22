const webpack = require('webpack');
const path = require('path');
const CopyWebpackPlugin = require('copy-webpack-plugin');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');

module.exports = {
  entry: {
    // Content script - runs on markdown pages
    content: './src/main.ts',

    // Background service worker
    background: './src/background.ts',

    // Popup UI
    popup: './src/popup/popup.ts',
  },

  output: {
    path: path.resolve(__dirname, '../extension'),
    filename: 'js/[name].js',
    chunkFilename: 'js/[id].js',
    publicPath: '/', // Use root path for Chrome extension assets
    clean: false, // Don't clean on every build (we copy assets)
  },

  resolve: {
    extensions: ['.ts', '.js', '.json'],
    alias: {
      '@': path.resolve(__dirname, '../src'),
      '@core': path.resolve(__dirname, '../src/core'),
      '@components': path.resolve(__dirname, '../src/components'),
      '@utils': path.resolve(__dirname, '../src/utils'),
      '@types': path.resolve(__dirname, '../src/types'),
      '@styles': path.resolve(__dirname, '../src/styles'),
      '@plugins': path.resolve(__dirname, '../src/plugins'),
    },
  },

  module: {
    rules: [
      // TypeScript
      {
        test: /\.ts$/,
        loader: 'esbuild-loader',
        options: {
          target: 'es2020',
          loader: 'ts',
        },
        exclude: /node_modules/,
      },

      // CSS
      {
        test: /\.css$/,
        use: [MiniCssExtractPlugin.loader, 'css-loader'],
      },

      // Images (for inline icons if needed)
      {
        test: /\.(png|jpg|jpeg|gif|svg)$/,
        type: 'asset/resource',
        generator: {
          filename: 'assets/[name][ext]',
        },
      },

      // Fonts (KaTeX)
      {
        test: /\.(woff|woff2|ttf|eot)$/,
        type: 'asset/resource',
        generator: {
          filename: 'fonts/[hash][ext][query]',
        },
      },
    ],
  },

  plugins: [
    // Extract CSS
    new MiniCssExtractPlugin({
      filename: 'css/[name].css',
    }),

    // Copy static assets
    new CopyWebpackPlugin({
      patterns: [
        // Manifest
        {
          from: 'src/manifest.json',
          to: 'manifest.json',
          transform(content) {
            // Add version from package.json
            const manifest = JSON.parse(content.toString());
            const packageJson = require('../package.json');
            manifest.version = packageJson.version;
            return JSON.stringify(manifest, null, 2);
          },
        },

        // Popup HTML
        {
          from: 'src/popup/index.html',
          to: 'popup.html',
        },

        // Icons (only copy if they exist)
        {
          from: 'src/assets/icons',
          to: 'assets/icons',
          noErrorOnMissing: true,
        },

        // Highlight.js themes for syntax highlighting
        // Light themes
        {
          from: 'node_modules/highlight.js/styles/github.css',
          to: 'node_modules/highlight.js/styles/github.css',
        },
        {
          from: 'node_modules/highlight.js/styles/vs.css',
          to: 'node_modules/highlight.js/styles/vs.css',
        },
        {
          from: 'node_modules/highlight.js/styles/atom-one-light.css',
          to: 'node_modules/highlight.js/styles/atom-one-light.css',
        },
        {
          from: 'node_modules/highlight.js/styles/tokyo-night-light.css',
          to: 'node_modules/highlight.js/styles/tokyo-night-light.css',
        },
        // Dark themes
        {
          from: 'node_modules/highlight.js/styles/github-dark.css',
          to: 'node_modules/highlight.js/styles/github-dark.css',
        },
        {
          from: 'node_modules/highlight.js/styles/github-dark-dimmed.css',
          to: 'node_modules/highlight.js/styles/github-dark-dimmed.css',
        },
        {
          from: 'node_modules/highlight.js/styles/vs2015.css',
          to: 'node_modules/highlight.js/styles/vs2015.css',
        },
        {
          from: 'node_modules/highlight.js/styles/atom-one-dark.css',
          to: 'node_modules/highlight.js/styles/atom-one-dark.css',
        },
        {
          from: 'node_modules/highlight.js/styles/monokai.css',
          to: 'node_modules/highlight.js/styles/monokai.css',
        },
        {
          from: 'node_modules/highlight.js/styles/monokai-sublime.css',
          to: 'node_modules/highlight.js/styles/monokai-sublime.css',
        },
        {
          from: 'node_modules/highlight.js/styles/tokyo-night-dark.css',
          to: 'node_modules/highlight.js/styles/tokyo-night-dark.css',
        },
        {
          from: 'node_modules/highlight.js/styles/nord.css',
          to: 'node_modules/highlight.js/styles/nord.css',
        },
        {
          from: 'node_modules/highlight.js/styles/night-owl.css',
          to: 'node_modules/highlight.js/styles/night-owl.css',
        },

        // KaTeX CSS and fonts
        {
          from: 'node_modules/katex/dist/katex.min.css',
          to: 'node_modules/katex/dist/katex.min.css',
        },
        {
          from: 'node_modules/katex/dist/fonts',
          to: 'node_modules/katex/dist/fonts',
        },

        // Locales
        {
          from: 'src/_locales',
          to: '_locales',
        },
      ],
    }),

    // Force all chunks to be merged into the main bundle
    // This prevents dynamic imports from creating separate files, resolving CSP issues
    new webpack.optimize.LimitChunkCountPlugin({
      maxChunks: 1,
    }),
  ],

  // Optimization - prevent ALL code splitting including dynamic imports
  optimization: {
    splitChunks: false, // Completely disable code splitting
    runtimeChunk: false, // Don't create a separate runtime chunk
  },

  // Performance hints
  performance: {
    hints: false, // Disable warnings for large bundles (extensions don't care)
  },
};
