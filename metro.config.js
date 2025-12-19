const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Ensure proper module resolution
config.resolver.sourceExts.push('cjs');

// expo-sqlite (web) loads a WASM module; Metro must treat `.wasm` as an asset.
config.resolver.assetExts.push('wasm');

// Explicitly resolve node_modules
config.resolver.nodeModulesPaths = [
  require('path').resolve(__dirname, 'node_modules'),
];

module.exports = config;

